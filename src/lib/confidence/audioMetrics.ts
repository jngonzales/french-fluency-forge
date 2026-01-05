/**
 * Audio Metrics Calculator (Simulated VAD)
 * 
 * Uses Whisper word-level timestamps to calculate timing and silence metrics
 * for confidence assessment without real-time VAD.
 */

export interface WordTimestamp {
  word: string;
  start: number; // seconds
  end: number; // seconds
}

export interface Pause {
  start: number;
  end: number;
  duration: number; // milliseconds
}

export interface TurnMetrics {
  start_latency_ms: number; // Time from prompt_end to first speech
  answer_duration_ms: number; // Total recording duration
  speech_ms: number; // Sum of word durations
  silence_ms: number; // Gaps between words
  speech_ratio: number; // speech_ms / (speech_ms + silence_ms)
  longest_silence_ms: number;
  silence_count: number; // Silences >= 600ms
  pauses: Pause[];
}

const SILENCE_THRESHOLD_MS = 600; // Count silences >= 600ms
const PAUSE_DETECTION_MS = 300; // Detect pauses > 300ms

/**
 * Calculate turn metrics from Whisper word timestamps
 * @param words Word-level timestamps from Whisper
 * @param promptEndTs When the bot finished speaking (Date or timestamp)
 * @param recordingStartTs When user started recording
 * @param recordingEndTs When user stopped recording
 * @returns Turn metrics for scoring
 */
export function calculateTurnMetrics(
  words: WordTimestamp[],
  promptEndTs: Date,
  recordingStartTs: Date,
  recordingEndTs: Date
): TurnMetrics {
  // Filter out empty words
  const validWords = words.filter(w => w.word && w.word.trim().length > 0);
  
  if (validWords.length === 0) {
    // No speech detected
    const answerDuration = recordingEndTs.getTime() - recordingStartTs.getTime();
    return {
      start_latency_ms: recordingStartTs.getTime() - promptEndTs.getTime(),
      answer_duration_ms: answerDuration,
      speech_ms: 0,
      silence_ms: answerDuration,
      speech_ratio: 0,
      longest_silence_ms: answerDuration,
      silence_count: 1,
      pauses: [{
        start: 0,
        end: answerDuration,
        duration: answerDuration
      }]
    };
  }
  
  // Calculate start latency
  // Approximation: first word start + recording start time
  const firstWord = validWords[0];
  const lastWord = validWords[validWords.length - 1];
  
  // Start latency: time from prompt end to first speech
  // We approximate first speech as recording start + first word offset
  const firstSpeechTs = new Date(recordingStartTs.getTime() + firstWord.start * 1000);
  const start_latency_ms = firstSpeechTs.getTime() - promptEndTs.getTime();
  
  // Answer duration: total recording time
  const answer_duration_ms = recordingEndTs.getTime() - recordingStartTs.getTime();
  
  // Calculate speech time (sum of word durations)
  let speech_ms = 0;
  for (const word of validWords) {
    speech_ms += (word.end - word.start) * 1000;
  }
  
  // Calculate pauses between words
  const pauses: Pause[] = [];
  for (let i = 1; i < validWords.length; i++) {
    const gap = (validWords[i].start - validWords[i - 1].end) * 1000; // Convert to ms
    
    if (gap > PAUSE_DETECTION_MS) {
      pauses.push({
        start: validWords[i - 1].end * 1000,
        end: validWords[i].start * 1000,
        duration: gap
      });
    }
  }
  
  // Calculate silence metrics
  const silence_ms = pauses.reduce((sum, p) => sum + p.duration, 0);
  const speech_ratio = speech_ms / (speech_ms + silence_ms);
  const longest_silence_ms = pauses.length > 0 
    ? Math.max(...pauses.map(p => p.duration))
    : 0;
  const silence_count = pauses.filter(p => p.duration >= SILENCE_THRESHOLD_MS).length;
  
  return {
    start_latency_ms: Math.max(0, start_latency_ms), // Ensure non-negative
    answer_duration_ms,
    speech_ms,
    silence_ms,
    speech_ratio: Math.min(1, Math.max(0, speech_ratio)), // Clamp 0-1
    longest_silence_ms,
    silence_count,
    pauses
  };
}

/**
 * Calculate metrics when no word timestamps are available (fallback)
 * Uses simple heuristics based on recording duration and transcript length
 */
export function calculateFallbackMetrics(
  transcriptWordCount: number,
  promptEndTs: Date,
  recordingStartTs: Date,
  recordingEndTs: Date
): TurnMetrics {
  const start_latency_ms = recordingStartTs.getTime() - promptEndTs.getTime();
  const answer_duration_ms = recordingEndTs.getTime() - recordingStartTs.getTime();
  
  // Estimate speech time: ~150 words per minute average
  const estimatedSpeechMs = (transcriptWordCount / 150) * 60 * 1000;
  const speech_ms = Math.min(estimatedSpeechMs, answer_duration_ms);
  const silence_ms = answer_duration_ms - speech_ms;
  const speech_ratio = speech_ms / answer_duration_ms;
  
  // Rough estimates for silence
  const estimatedPauseCount = Math.floor(transcriptWordCount / 20); // Pause every 20 words
  const avgPauseDuration = estimatedPauseCount > 0 ? silence_ms / estimatedPauseCount : 0;
  
  return {
    start_latency_ms: Math.max(0, start_latency_ms),
    answer_duration_ms,
    speech_ms,
    silence_ms,
    speech_ratio: Math.min(1, Math.max(0, speech_ratio)),
    longest_silence_ms: avgPauseDuration * 1.5, // Estimate longest as 1.5x average
    silence_count: Math.floor(estimatedPauseCount / 2), // Assume half are long pauses
    pauses: [] // Cannot estimate individual pauses without timestamps
  };
}

/**
 * Normalize start latency for tier (spec §6.3)
 * @param latencyMs Raw latency in milliseconds
 * @param tier Scenario tier (1, 2, or 3)
 * @returns Normalized latency for scoring
 */
export function normalizeLatencyForTier(latencyMs: number, tier: 1 | 2 | 3): number {
  const adjustments = {
    1: 0,
    2: 250,
    3: 500
  };
  
  return latencyMs - adjustments[tier];
}

/**
 * Normalize longest silence for tier (spec §6.3)
 * @param silenceMs Raw longest silence in milliseconds
 * @param tier Scenario tier (1, 2, or 3)
 * @returns Normalized silence for scoring
 */
export function normalizeSilenceForTier(silenceMs: number, tier: 1 | 2 | 3): number {
  const adjustment = tier === 3 ? 300 : 0;
  return silenceMs - adjustment;
}

