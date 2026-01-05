import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

// Confidence signal dictionaries (simplified inline for edge function)
const LOW_CONFIDENCE_MARKERS = [
  'désolé', 'désolée', 'pardon', 'je suis navré', 'je suis navrée',
  'je ne sais pas', 'je sais pas', 'je crois', 'je pense peut-être',
  "j'imagine", 'je suis pas sûr', 'je suis pas sûre',
  "c'est pas grave", 'tant pis', 'comme vous voulez', 'peu importe'
];

const OWNERSHIP_MARKERS = [
  'je veux', "j'ai besoin de", 'je préfère', 'je choisis', 'je décide',
  'moi je pense', 'moi je', 'franchement',
  'je ne peux pas', 'je peux pas', 'ça ne me convient pas',
  'je vous appelle pour', 'je voudrais résoudre', 'je propose'
];

const ENGAGEMENT_MARKERS = [
  'je suis stressé', 'je suis stressée', 'je suis frustré', 'je suis frustrée',
  "ça m'inquiète", 'je suis content', 'je suis contente', 'je comprends',
  'je vois', 'je vous remercie', 'merci'
];

const STRUCTURE_MARKERS = [
  "d'abord", 'ensuite', 'puis', 'donc', 'alors', 'en résumé', 'enfin'
];

const REPAIR_MARKERS = [
  'je reformule', 'je veux dire', 'en fait', "c'est-à-dire",
  'ce que je veux dire', 'pour être clair'
];

interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

interface TurnData {
  turnNumber: number;
  transcript: string;
  wordTimestamps: WordTimestamp[];
  promptEndMs: number;
  recordingStartMs: number;
  recordingEndMs: number;
}

interface SignalMatch {
  phrase: string;
  snippet: string;
  turn: number;
}

// Find markers in text
function findMarkers(text: string, markers: string[], turnNumber: number): SignalMatch[] {
  const normalized = text.toLowerCase();
  const matches: SignalMatch[] = [];
  
  for (const marker of markers) {
    const index = normalized.indexOf(marker.toLowerCase());
    if (index !== -1) {
      // Extract snippet (10-20 words context)
      const words = text.split(/\s+/);
      const markerWords = marker.split(/\s+/).length;
      const markerIndex = text.slice(0, index).split(/\s+/).length;
      
      const startIdx = Math.max(0, markerIndex - 5);
      const endIdx = Math.min(words.length, markerIndex + markerWords + 5);
      const snippet = words.slice(startIdx, endIdx).join(' ');
      
      matches.push({
        phrase: marker,
        snippet: snippet.slice(0, 150),
        turn: turnNumber
      });
    }
  }
  
  return matches;
}

// Calculate turn metrics (simulated VAD)
function calculateTurnMetrics(turn: TurnData) {
  const words = turn.wordTimestamps.filter(w => w.word && w.word.trim().length > 0);
  
  if (words.length === 0) {
    const duration = turn.recordingEndMs - turn.recordingStartMs;
    return {
      start_latency_ms: turn.recordingStartMs - turn.promptEndMs,
      speech_ms: 0,
      silence_ms: duration,
      speech_ratio: 0,
      longest_silence_ms: duration,
      silence_count: 1
    };
  }
  
  // Start latency
  const firstSpeechMs = turn.recordingStartMs + (words[0].start * 1000);
  const start_latency_ms = Math.max(0, firstSpeechMs - turn.promptEndMs);
  
  // Speech time
  let speech_ms = 0;
  for (const word of words) {
    speech_ms += (word.end - word.start) * 1000;
  }
  
  // Pauses
  const pauses: number[] = [];
  for (let i = 1; i < words.length; i++) {
    const gap = (words[i].start - words[i - 1].end) * 1000;
    if (gap > 300) {
      pauses.push(gap);
    }
  }
  
  const silence_ms = pauses.reduce((sum, p) => sum + p, 0);
  const speech_ratio = speech_ms / (speech_ms + silence_ms || 1);
  const longest_silence_ms = pauses.length > 0 ? Math.max(...pauses) : 0;
  const silence_count = pauses.filter(p => p >= 600).length;
  
  return {
    start_latency_ms,
    speech_ms,
    silence_ms,
    speech_ratio,
    longest_silence_ms,
    silence_count
  };
}

// Aggregate metrics across turns
function aggregateMetrics(turnMetrics: any[]) {
  const latencies = turnMetrics.map(m => m.start_latency_ms);
  latencies.sort((a, b) => a - b);
  const median = latencies[Math.floor(latencies.length / 2)] || 0;
  
  let totalSpeech = 0;
  let totalSilence = 0;
  let maxSilence = 0;
  
  for (const m of turnMetrics) {
    totalSpeech += m.speech_ms;
    totalSilence += m.silence_ms;
    maxSilence = Math.max(maxSilence, m.longest_silence_ms);
  }
  
  const speechRatio = totalSpeech / (totalSpeech + totalSilence || 1);
  
  return {
    start_latency_ms_median: median,
    speech_ratio_avg: speechRatio,
    longest_silence_ms: maxSilence
  };
}

// Score D1 - Response Initiation
function scoreD1(medianLatency: number, tier: number): number {
  // Tier normalization
  const adjustment = tier === 2 ? 250 : tier === 3 ? 500 : 0;
  const normalized = medianLatency - adjustment;
  
  if (normalized <= 900) return 5;
  if (normalized <= 1400) return 4;
  if (normalized <= 2200) return 3;
  if (normalized <= 3200) return 2;
  if (normalized <= 5000) return 1;
  return 0;
}

// Score D2 - Silence Management
function scoreD2(speechRatio: number, longestSilence: number, tier: number): number {
  // Tier normalization for silence
  const silenceAdjustment = tier === 3 ? 300 : 0;
  const normalizedSilence = longestSilence - silenceAdjustment;
  
  if (speechRatio >= 0.85 && normalizedSilence < 1200) return 5;
  if (speechRatio >= 0.78 && normalizedSilence < 1800) return 4;
  if (speechRatio >= 0.70 && normalizedSilence < 2500) return 3;
  if (speechRatio >= 0.60 && normalizedSilence < 3500) return 2;
  if (speechRatio >= 0.50 || normalizedSilence < 5000) return 1;
  return 0;
}

// Score D3 - Ownership/Assertiveness
function scoreD3(
  ownershipMatches: SignalMatch[],
  lowConfidenceMatches: SignalMatch[],
  fullTranscript: string
): number {
  let score = 3; // Start at 3
  
  // Check for explicit request
  const hasRequest = /je (veux|voudrais|demande|propose)/i.test(fullTranscript);
  
  // Check for boundary setting
  const hasBoundary = /je (ne |n')peux pas|ça (ne |n')me convient pas/i.test(fullTranscript);
  
  // Adjust score
  if (ownershipMatches.length >= 2 && hasRequest) score += 1;
  if (hasBoundary) score += 1;
  if (lowConfidenceMatches.length >= 3) score -= 1;
  if (!hasRequest) score -= 1;
  
  return Math.max(0, Math.min(5, score));
}

// Score D4 - Emotional Engagement
function scoreD4(engagementMatches: SignalMatch[], fullTranscript: string): number {
  const hasFeelings = /je suis (stressé|frustré|content|déçu)|je me sens/i.test(fullTranscript);
  const hasEmpathy = /je comprends|je vois|merci/i.test(fullTranscript);
  
  if (engagementMatches.length >= 3 && hasFeelings && hasEmpathy) return 5;
  if (engagementMatches.length >= 2) return 4;
  if (engagementMatches.length >= 1) return 3;
  if (fullTranscript.length > 100) return 2;
  return 1;
}

// Score D5 - Clarity/Control
function scoreD5(
  structureMatches: SignalMatch[],
  repairMatches: SignalMatch[],
  fullTranscript: string
): number {
  const hasRequest = /je (veux|voudrais|demande|propose)/i.test(fullTranscript);
  const hasStructure = structureMatches.length > 0;
  const hasRepair = repairMatches.length > 0;
  
  if (hasStructure && hasRequest && hasRepair) return 5;
  if (hasRequest && hasStructure) return 4;
  if (hasRequest) return 3;
  if (fullTranscript.length > 50) return 2;
  return 1;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { turns, tier, scenarioId } = await req.json();

    if (!turns || turns.length === 0) {
      throw new Error('No turns provided');
    }

    console.log(`[Confidence] Analyzing ${turns.length} turns for scenario ${scenarioId} (tier ${tier})`);

    // Calculate metrics for each turn
    const turnMetrics = turns.map((turn: TurnData) => calculateTurnMetrics(turn));
    
    // Aggregate metrics
    const aggregates = aggregateMetrics(turnMetrics);
    
    // Combine all transcripts
    const fullTranscript = turns.map((t: TurnData) => t.transcript).join(' ');
    
    // Detect signals
    const lowConfidenceMatches: SignalMatch[] = [];
    const ownershipMatches: SignalMatch[] = [];
    const engagementMatches: SignalMatch[] = [];
    const structureMatches: SignalMatch[] = [];
    const repairMatches: SignalMatch[] = [];
    
    turns.forEach((turn: TurnData, idx: number) => {
      lowConfidenceMatches.push(...findMarkers(turn.transcript, LOW_CONFIDENCE_MARKERS, idx + 1));
      ownershipMatches.push(...findMarkers(turn.transcript, OWNERSHIP_MARKERS, idx + 1));
      engagementMatches.push(...findMarkers(turn.transcript, ENGAGEMENT_MARKERS, idx + 1));
      structureMatches.push(...findMarkers(turn.transcript, STRUCTURE_MARKERS, idx + 1));
      repairMatches.push(...findMarkers(turn.transcript, REPAIR_MARKERS, idx + 1));
    });
    
    // Calculate D1-D5 scores
    const d1 = scoreD1(aggregates.start_latency_ms_median, tier);
    const d2 = scoreD2(aggregates.speech_ratio_avg, aggregates.longest_silence_ms, tier);
    const d3 = scoreD3(ownershipMatches, lowConfidenceMatches, fullTranscript);
    const d4 = scoreD4(engagementMatches, fullTranscript);
    const d5 = scoreD5(structureMatches, repairMatches, fullTranscript);
    
    // Calculate overall score
    const d1Pct = (d1 / 5) * 100;
    const d2Pct = (d2 / 5) * 100;
    const d3Pct = (d3 / 5) * 100;
    const d4Pct = (d4 / 5) * 100;
    const d5Pct = (d5 / 5) * 100;
    
    const speakingScore = Math.round(
      0.20 * d1Pct +
      0.25 * d2Pct +
      0.25 * d3Pct +
      0.15 * d4Pct +
      0.15 * d5Pct
    );
    
    console.log(`[Confidence] Scores: D1=${d1}, D2=${d2}, D3=${d3}, D4=${d4}, D5=${d5}, Overall=${speakingScore}`);
    
    return new Response(
      JSON.stringify({
        success: true,
        scores: {
          d1_response_initiation: { score_0_5: d1, confidence_0_1: 0.9 },
          d2_silence_management: { score_0_5: d2, confidence_0_1: 0.9 },
          d3_ownership_assertiveness: { score_0_5: d3, confidence_0_1: 0.8 },
          d4_emotional_engagement: { score_0_5: d4, confidence_0_1: 0.8 },
          d5_clarity_control: { score_0_5: d5, confidence_0_1: 0.8 },
          speaking_confidence_score_0_100: speakingScore
        },
        timing_aggregates: aggregates,
        signals: {
          ownership_markers: ownershipMatches.slice(0, 5),
          low_confidence_markers: lowConfidenceMatches.slice(0, 5),
          engagement_markers: engagementMatches.slice(0, 5),
          structure_markers: structureMatches.slice(0, 3),
          repair_markers: repairMatches.slice(0, 3)
        },
        versions: {
          scorer_version: '2026-01-05',
          prompt_version: '2026-01-05'
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('[Confidence] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

