import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// French filler words to exclude from word count
const FRENCH_FILLERS = [
  "euh", "heu", "hum", "hmm", "mh", "bah", "ben", "genre",
  "euuuh", "heuuu", "euhh", "um", "uh", "hm"
];

// Long pause threshold in seconds
const LONG_PAUSE_THRESHOLD = 1.2;

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768): Uint8Array {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

// Check if a word is a filler
function isFiller(word: string): boolean {
  return FRENCH_FILLERS.includes(word.toLowerCase().trim());
}

interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

// Calculate metrics from word timestamps
function calculateMetrics(words: WordTimestamp[], totalDuration: number) {
  // Filter out fillers
  const nonFillerWords = words.filter(w => !isFiller(w.word));
  const fillerCount = words.length - nonFillerWords.length;
  
  if (nonFillerWords.length === 0) {
    return {
      wordCount: 0,
      speakingTime: 0,
      articulationWpm: 0,
      longPauseCount: 0,
      maxPause: 0,
      pauseRatio: 1,
      totalPauseDuration: 0,
      fillerRatio: 1,
      pauses: [],
    };
  }
  
  // Speaking time: first to last non-filler word
  const firstWord = nonFillerWords[0];
  const lastWord = nonFillerWords[nonFillerWords.length - 1];
  const speakingTime = lastWord.end - firstWord.start;
  
  // Calculate articulation WPM
  const speakingTimeMinutes = speakingTime / 60;
  const articulationWpm = speakingTimeMinutes > 0 
    ? Math.round(nonFillerWords.length / speakingTimeMinutes) 
    : 0;
  
  // Analyze pauses between consecutive non-filler words
  const pauses: { start: number; end: number; duration: number }[] = [];
  let totalPauseDuration = 0;
  let longPauseCount = 0;
  let maxPause = 0;
  
  for (let i = 1; i < nonFillerWords.length; i++) {
    const gap = nonFillerWords[i].start - nonFillerWords[i - 1].end;
    
    if (gap > 0.3) { // Count pauses > 0.3s
      pauses.push({
        start: nonFillerWords[i - 1].end,
        end: nonFillerWords[i].start,
        duration: gap,
      });
      totalPauseDuration += gap;
      
      if (gap > maxPause) {
        maxPause = gap;
      }
      
      if (gap > LONG_PAUSE_THRESHOLD) {
        longPauseCount++;
      }
    }
  }
  
  // Pause ratio: total silence / total duration
  const pauseRatio = totalDuration > 0 ? totalPauseDuration / totalDuration : 0;
  
  // Filler ratio
  const fillerRatio = words.length > 0 ? fillerCount / words.length : 0;
  
  return {
    wordCount: nonFillerWords.length,
    speakingTime: Math.round(speakingTime * 100) / 100,
    articulationWpm,
    longPauseCount,
    maxPause: Math.round(maxPause * 100) / 100,
    pauseRatio: Math.round(pauseRatio * 100) / 100,
    totalPauseDuration: Math.round(totalPauseDuration * 100) / 100,
    fillerRatio: Math.round(fillerRatio * 100) / 100,
    pauses: pauses.map(p => ({
      start: Math.round(p.start * 100) / 100,
      end: Math.round(p.end * 100) / 100,
      duration: Math.round(p.duration * 100) / 100,
    })),
  };
}

// Calculate speed subscore (0-60) based on articulation WPM
function calculateSpeedSubscore(articulationWpm: number): number {
  if (articulationWpm <= 0) return 0;
  if (articulationWpm >= 140) return 60;
  
  const bands = [
    { min: 0, max: 45, prevScore: 0, score: 10 },
    { min: 45, max: 65, prevScore: 10, score: 25 },
    { min: 65, max: 85, prevScore: 25, score: 40 },
    { min: 85, max: 110, prevScore: 40, score: 55 },
    { min: 110, max: 140, prevScore: 55, score: 60 },
  ];
  
  for (const band of bands) {
    if (articulationWpm >= band.min && articulationWpm < band.max) {
      const position = (articulationWpm - band.min) / (band.max - band.min);
      return Math.round(band.prevScore + position * (band.score - band.prevScore));
    }
  }
  
  return 60;
}

// Calculate pause control subscore (0-40)
function calculatePauseSubscore(
  longPauseCount: number,
  maxPause: number,
  pauseRatio: number
): number {
  let score = 40;
  
  // -5 for each long pause (>1.2s), cap at -20
  score -= Math.min(longPauseCount * 5, 20);
  
  // -10 if max pause > 2.5s
  if (maxPause > 2.5) {
    score -= 10;
  }
  
  // -10 if pause ratio > 0.35
  if (pauseRatio > 0.35) {
    score -= 10;
  }
  
  return Math.max(0, score);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audio, itemId, recordingDuration } = await req.json();

    if (!audio) {
      throw new Error('No audio data provided');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log(`[Fluency] Processing item: ${itemId}, duration: ${recordingDuration}s`);

    // Process audio in chunks
    const binaryAudio = processBase64Chunks(audio);
    console.log(`[Fluency] Audio size: ${binaryAudio.length} bytes`);

    // Prepare form data for Whisper API with word-level timestamps
    const formData = new FormData();
    const audioBlob = new Blob([new Uint8Array(binaryAudio).buffer as ArrayBuffer], { type: 'audio/webm' });
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'fr');
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'word');

    // Call OpenAI Whisper API
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      console.error('[Fluency] Whisper API error:', errorText);
      throw new Error(`Whisper API error: ${whisperResponse.status}`);
    }

    const whisperResult = await whisperResponse.json();
    console.log('[Fluency] Whisper response received');

    const transcript = whisperResult.text || '';
    const words: WordTimestamp[] = (whisperResult.words || []).map((w: any) => ({
      word: w.word,
      start: w.start,
      end: w.end,
    }));
    const audioDuration = whisperResult.duration || recordingDuration;

    // Calculate metrics
    const metrics = calculateMetrics(words, audioDuration);
    
    // Calculate scores
    const speedSubscore = calculateSpeedSubscore(metrics.articulationWpm);
    const pauseSubscore = calculatePauseSubscore(
      metrics.longPauseCount,
      metrics.maxPause,
      metrics.pauseRatio
    );
    const totalScore = speedSubscore + pauseSubscore;
    const fluencyScore = Math.min(100, Math.max(0, metrics.articulationWpm));

    console.log(`[Fluency] Analysis complete:`, {
      wordCount: metrics.wordCount,
      articulationWpm: metrics.articulationWpm,
      longPauseCount: metrics.longPauseCount,
      speedSubscore,
      pauseSubscore,
      totalScore,
      fluencyScore,
    });

    // Version tracking
    const versions = {
      prompt_version: '2026-01-04',
      scorer_version: '2026-01-04',
      asr_version: 'whisper-1'
    };

    return new Response(
      JSON.stringify({
        success: true,
        itemId,
        transcript,
        // Metrics
        wordCount: metrics.wordCount,
        duration: audioDuration,
        speakingTime: metrics.speakingTime,
        articulationWpm: metrics.articulationWpm,
        wpm: metrics.articulationWpm,
        // Pause analysis
        longPauseCount: metrics.longPauseCount,
        maxPause: metrics.maxPause,
        pauseRatio: metrics.pauseRatio,
        totalPauseDuration: metrics.totalPauseDuration,
        fillerRatio: metrics.fillerRatio,
        pauses: metrics.pauses,
        // Scores
        speedSubscore,
        pauseSubscore,
        totalScore,
        fluencyScore,
        // Versions
        versions,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[Fluency] Error:', errorMessage);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
