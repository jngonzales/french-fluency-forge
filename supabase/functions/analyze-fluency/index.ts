import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

// Calculate pauses from word timestamps
function analyzePauses(words: Array<{ start: number; end: number; word: string }>) {
  const PAUSE_THRESHOLD = 0.5; // seconds - consider a gap > 0.5s as a pause
  const pauses: Array<{ start: number; end: number; duration: number }> = [];
  
  for (let i = 1; i < words.length; i++) {
    const gap = words[i].start - words[i - 1].end;
    if (gap >= PAUSE_THRESHOLD) {
      pauses.push({
        start: words[i - 1].end,
        end: words[i].start,
        duration: gap,
      });
    }
  }
  
  return pauses;
}

serve(async (req) => {
  // Handle CORS preflight requests
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

    console.log(`Processing fluency analysis for item: ${itemId}`);
    console.log(`Recording duration reported: ${recordingDuration}s`);

    // Process audio in chunks
    const binaryAudio = processBase64Chunks(audio);
    console.log(`Audio size: ${binaryAudio.length} bytes`);

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
      console.error('Whisper API error:', errorText);
      throw new Error(`Whisper API error: ${whisperResponse.status}`);
    }

    const whisperResult = await whisperResponse.json();
    console.log('Whisper response received');

    const transcript = whisperResult.text || '';
    const words = whisperResult.words || [];
    const audioDuration = whisperResult.duration || recordingDuration;

    // Count words (excluding short utterances like "um", "uh")
    const meaningfulWords = transcript
      .split(/\s+/)
      .filter((word: string) => word.length > 1 && !/^(um|uh|euh|hm|hmm)$/i.test(word));
    
    const wordCount = meaningfulWords.length;

    // Calculate WPM (words per minute)
    const durationMinutes = audioDuration / 60;
    const wpm = durationMinutes > 0 ? Math.round(wordCount / durationMinutes) : 0;

    // Analyze pauses using word timestamps
    const pauses = analyzePauses(words);
    const pauseCount = pauses.length;
    const totalPauseDuration = pauses.reduce((sum, p) => sum + p.duration, 0);

    console.log(`Analysis complete - Words: ${wordCount}, WPM: ${wpm}, Pauses: ${pauseCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        itemId,
        transcript,
        wordCount,
        duration: audioDuration,
        wpm,
        pauseCount,
        totalPauseDuration: Math.round(totalPauseDuration * 10) / 10,
        pauses: pauses.map(p => ({
          start: Math.round(p.start * 10) / 10,
          end: Math.round(p.end * 10) / 10,
          duration: Math.round(p.duration * 10) / 10,
        })),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in analyze-fluency function:', errorMessage);
    
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
