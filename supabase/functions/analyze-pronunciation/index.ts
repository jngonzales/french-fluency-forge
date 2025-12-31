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

interface WordResult {
  word: string;
  accuracyScore: number;
  errorType: string;
}

interface PhonemeResult {
  phoneme: string;
  accuracyScore: number;
}

interface PronunciationResult {
  pronScore: number;
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  words: WordResult[];
  phonemes: PhonemeResult[];
}

async function assessPronunciation(
  audioData: Uint8Array,
  referenceText: string,
  speechKey: string,
  speechRegion: string
): Promise<PronunciationResult> {
  // Create pronunciation assessment config
  const pronunciationConfig = {
    referenceText: referenceText,
    gradingSystem: "HundredMark",
    granularity: "Phoneme",
    enableMiscue: true,
    phonemeAlphabet: "IPA"
  };

  const pronunciationConfigBase64 = btoa(JSON.stringify(pronunciationConfig));

  // Azure Speech API endpoint
  const endpoint = `https://${speechRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=fr-FR`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': speechKey,
      'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
      'Pronunciation-Assessment': pronunciationConfigBase64,
      'Accept': 'application/json',
    },
    body: audioData.buffer as ArrayBuffer,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Pronunciation] Azure API error:', response.status, errorText);
    throw new Error(`Azure Speech API error: ${response.status}`);
  }

  const result = await response.json();
  console.log('[Pronunciation] Azure response:', JSON.stringify(result).slice(0, 500));

  // Parse the response
  const nBest = result.NBest?.[0];
  if (!nBest) {
    throw new Error('No pronunciation assessment result');
  }

  const assessment = nBest.PronunciationAssessment || {};
  const words: WordResult[] = [];
  const phonemes: PhonemeResult[] = [];

  // Extract word-level results
  if (nBest.Words) {
    for (const word of nBest.Words) {
      const wordAssessment = word.PronunciationAssessment || {};
      words.push({
        word: word.Word,
        accuracyScore: wordAssessment.AccuracyScore || 0,
        errorType: wordAssessment.ErrorType || 'None',
      });

      // Extract phoneme-level results
      if (word.Phonemes) {
        for (const phoneme of word.Phonemes) {
          const phonemeAssessment = phoneme.PronunciationAssessment || {};
          phonemes.push({
            phoneme: phoneme.Phoneme,
            accuracyScore: phonemeAssessment.AccuracyScore || 0,
          });
        }
      }
    }
  }

  return {
    pronScore: assessment.PronScore || 0,
    accuracyScore: assessment.AccuracyScore || 0,
    fluencyScore: assessment.FluencyScore || 0,
    completenessScore: assessment.CompletenessScore || 0,
    words,
    phonemes,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audio, referenceText, itemId } = await req.json();

    if (!audio) {
      throw new Error('No audio data provided');
    }

    if (!referenceText) {
      throw new Error('No reference text provided');
    }

    const speechKey = Deno.env.get('AZURE_SPEECH_KEY');
    const speechRegion = Deno.env.get('AZURE_SPEECH_REGION');

    if (!speechKey || !speechRegion) {
      throw new Error('Azure Speech credentials not configured');
    }

    console.log(`[Pronunciation] Processing item: ${itemId}, reference: "${referenceText.slice(0, 50)}..."`);

    // Process audio
    const binaryAudio = processBase64Chunks(audio);
    console.log(`[Pronunciation] Audio size: ${binaryAudio.length} bytes`);

    // Call Azure Speech Pronunciation Assessment
    const result = await assessPronunciation(binaryAudio, referenceText, speechKey, speechRegion);

    console.log(`[Pronunciation] Score: ${result.pronScore}, Words: ${result.words.length}, Phonemes: ${result.phonemes.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        itemId,
        pronScore: result.pronScore,
        accuracyScore: result.accuracyScore,
        fluencyScore: result.fluencyScore,
        completenessScore: result.completenessScore,
        words: result.words,
        phonemes: result.phonemes,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[Pronunciation] Error:', errorMessage);
    
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
