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
  rawResponse?: unknown;
}

async function assessPronunciation(
  audioData: Uint8Array,
  referenceText: string,
  speechKey: string,
  speechRegion: string,
  audioFormat: string
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
  
  console.log('[Pronunciation] Config:', JSON.stringify(pronunciationConfig));
  console.log('[Pronunciation] Audio format from client:', audioFormat);

  // Determine content type based on audio format
  // Azure Pronunciation Assessment requires specific formats
  let contentType = 'audio/webm; codecs=opus';
  if (audioFormat?.includes('wav') || audioFormat?.includes('pcm')) {
    // WAV format - best for pronunciation assessment
    contentType = 'audio/wav';
  } else if (audioFormat?.includes('ogg')) {
    contentType = 'audio/ogg; codecs=opus';
  } else if (audioFormat?.includes('mp3') || audioFormat?.includes('mpeg')) {
    // Note: MP3 may not work well with pronunciation assessment
    contentType = 'audio/mpeg';
  }
  
  console.log('[Pronunciation] Using Content-Type:', contentType);

  // Azure Speech API endpoint - using the detailed output format
  const endpoint = `https://${speechRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=fr-FR&format=detailed`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': speechKey,
      'Content-Type': contentType,
      'Pronunciation-Assessment': pronunciationConfigBase64,
      'Accept': 'application/json',
    },
    body: audioData.buffer as ArrayBuffer,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Pronunciation] Azure API error:', response.status, errorText);
    throw new Error(`Azure Speech API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('[Pronunciation] Full Azure response:', JSON.stringify(result));

  // Parse the response
  const nBest = result.NBest?.[0];
  if (!nBest) {
    console.error('[Pronunciation] No NBest in response:', JSON.stringify(result));
    return {
      pronScore: 0,
      accuracyScore: 0,
      fluencyScore: 0,
      completenessScore: 0,
      words: [],
      phonemes: [],
      rawResponse: result,
    };
  }

  // Log the structure for debugging
  console.log('[Pronunciation] NBest keys:', Object.keys(nBest));
  console.log('[Pronunciation] NBest.PronunciationAssessment:', JSON.stringify(nBest.PronunciationAssessment));
  
  const assessment = nBest.PronunciationAssessment || {};
  const words: WordResult[] = [];
  const phonemes: PhonemeResult[] = [];

  // Extract word-level results - Azure has different response structures
  if (nBest.Words) {
    console.log('[Pronunciation] First word structure:', JSON.stringify(nBest.Words[0]));
    
    for (const word of nBest.Words) {
      // Try both nested and flat structures
      const wordAssessment = word.PronunciationAssessment || word;
      const accuracyScore = wordAssessment.AccuracyScore ?? word.AccuracyScore ?? 0;
      const errorType = wordAssessment.ErrorType ?? word.ErrorType ?? 'None';
      
      words.push({
        word: word.Word,
        accuracyScore,
        errorType,
      });

      // Extract phoneme-level results
      const phonemeList = word.Phonemes || [];
      for (const phoneme of phonemeList) {
        const phonemeAssessment = phoneme.PronunciationAssessment || phoneme;
        phonemes.push({
          phoneme: phoneme.Phoneme,
          accuracyScore: phonemeAssessment.AccuracyScore ?? phoneme.AccuracyScore ?? 0,
        });
      }
    }
  }

  // Get top-level scores
  let pronScore = assessment.PronScore ?? nBest.PronScore ?? 0;
  let accuracyScore = assessment.AccuracyScore ?? nBest.AccuracyScore ?? 0;
  let fluencyScore = assessment.FluencyScore ?? nBest.FluencyScore ?? 0;
  let completenessScore = assessment.CompletenessScore ?? nBest.CompletenessScore ?? 0;

  // FALLBACK: Calculate scores from word-level data when top-level is missing/zero
  if (pronScore === 0 && words.length > 0) {
    console.log('[Pronunciation] Top-level PronScore is 0, calculating from word-level data...');
    
    // Calculate accuracy from word scores
    const wordScores = words.map(w => w.accuracyScore);
    accuracyScore = wordScores.reduce((a, b) => a + b, 0) / wordScores.length;
    
    // Estimate fluency from timing (if available)
    if (fluencyScore === 0 && nBest.Words) {
      fluencyScore = calculateFluencyFromTiming(nBest.Words);
    }
    
    // Calculate completeness (words spoken / words expected)
    const referenceWords = referenceText.split(/\s+/).filter(w => w.length > 0);
    const spokenWords = words.filter(w => w.errorType !== 'Omission');
    completenessScore = Math.min(100, (spokenWords.length / referenceWords.length) * 100);
    
    // PronScore is weighted combination (Azure's standard formula)
    // 60% accuracy, 20% fluency, 20% completeness
    pronScore = accuracyScore * 0.6 + fluencyScore * 0.2 + completenessScore * 0.2;
    
    console.log('[Pronunciation] Calculated scores:', {
      accuracyScore: Math.round(accuracyScore),
      fluencyScore: Math.round(fluencyScore),
      completenessScore: Math.round(completenessScore),
      pronScore: Math.round(pronScore),
    });
  }

  const resultData = {
    pronScore: Math.round(pronScore),
    accuracyScore: Math.round(accuracyScore),
    fluencyScore: Math.round(fluencyScore),
    completenessScore: Math.round(completenessScore),
    words,
    phonemes,
    rawResponse: result,
  };
  
  console.log('[Pronunciation] Final result:', JSON.stringify({
    pronScore: resultData.pronScore,
    accuracyScore: resultData.accuracyScore,
    fluencyScore: resultData.fluencyScore,
    completenessScore: resultData.completenessScore,
    wordCount: resultData.words.length,
    phonemeCount: resultData.phonemes.length,
    firstWordScore: resultData.words[0]?.accuracyScore
  }));

  return resultData;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audio, referenceText, itemId, audioFormat } = await req.json();

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

    console.log(`[Pronunciation] Processing item: ${itemId}`);
    console.log(`[Pronunciation] Reference text: "${referenceText}"`);
    console.log(`[Pronunciation] Audio format: ${audioFormat}`);

    // Process audio
    const binaryAudio = processBase64Chunks(audio);
    console.log(`[Pronunciation] Audio size: ${binaryAudio.length} bytes`);
    console.log(`[Pronunciation] Audio header (first 20 bytes):`, Array.from(binaryAudio.slice(0, 20)));

    // Call Azure Speech Pronunciation Assessment
    const result = await assessPronunciation(binaryAudio, referenceText, speechKey, speechRegion, audioFormat || 'audio/webm');

    console.log(`[Pronunciation] Final scores - Pron: ${result.pronScore}, Accuracy: ${result.accuracyScore}, Fluency: ${result.fluencyScore}, Completeness: ${result.completenessScore}`);
    console.log(`[Pronunciation] Words: ${result.words.length}, Phonemes: ${result.phonemes.length}`);

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
        debug: {
          rawResponse: result.rawResponse,
          audioSize: binaryAudio.length,
          audioFormat: audioFormat || 'audio/webm',
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('[Pronunciation] Error:', errorMessage);
    console.error('[Pronunciation] Stack:', errorStack);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        stack: errorStack,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
