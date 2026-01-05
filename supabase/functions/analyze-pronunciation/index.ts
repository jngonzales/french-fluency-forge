import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Process base64 in chunks
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

// Retry helper with exponential backoff
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  baseDelay = 1000
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 500;
      console.log(`[Azure] Retry ${attempt}/${maxRetries} after ${Math.round(delay)}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    const response = await fetch(url, options);
    
    if (response.ok) {
      return response;
    }
    
    // Handle rate limiting (429) with retry
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : baseDelay * Math.pow(2, attempt);
      console.log(`[Azure] Rate limited (429). Waiting ${waitTime}ms before retry...`);
      lastError = new Error(`Rate limited (429)`);
      continue;
    }
    
    // For other errors, don't retry
    const errorText = await response.text();
    console.error('[Azure] API error:', response.status, errorText);
    throw new Error(`Azure Speech API error: ${response.status} - ${JSON.stringify(errorText)}`);
  }
  
  throw lastError || new Error('Max retries exceeded');
}

async function assessPronunciation(
  audioData: Uint8Array,
  referenceText: string,
  speechKey: string,
  speechRegion: string,
  audioFormat: string
) {
  const startTime = Date.now();
  
  const pronunciationConfig = {
    referenceText: referenceText,
    gradingSystem: "HundredMark",
    granularity: "Phoneme",
    enableMiscue: true,
    phonemeAlphabet: "IPA"
  };

  const pronunciationConfigBase64 = btoa(JSON.stringify(pronunciationConfig));
  
  console.log('[Azure] Config:', JSON.stringify(pronunciationConfig));

  let contentType = 'audio/webm; codecs=opus';
  if (audioFormat?.includes('wav')) contentType = 'audio/wav';
  else if (audioFormat?.includes('ogg')) contentType = 'audio/ogg; codecs=opus';
  else if (audioFormat?.includes('mp3')) contentType = 'audio/mpeg';
  
  console.log('[Azure] Content-Type:', contentType);

  const endpoint = `https://${speechRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=fr-FR&format=detailed`;

  const apiStart = Date.now();
  const response = await fetchWithRetry(endpoint, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': speechKey,
      'Content-Type': contentType,
      'Pronunciation-Assessment': pronunciationConfigBase64,
      'Accept': 'application/json',
    },
    body: audioData.buffer as ArrayBuffer,
  });

  const apiDuration = Date.now() - apiStart;

  const rawResponse = await response.json();
  const nBest = rawResponse.NBest?.[0];
  
  if (!nBest) {
    throw new Error('No NBest in Azure response');
  }

  const assessment = nBest.PronunciationAssessment || {};
  const words = [];
  const phonemes = [];
  const allPhonemes = [];

  // Extract words and phonemes
  if (nBest.Words) {
    for (const word of nBest.Words) {
      const wordAssessment = word.PronunciationAssessment || word;
      const wordScore = wordAssessment.AccuracyScore ?? word.AccuracyScore ?? 0;
      const errorType = wordAssessment.ErrorType ?? word.ErrorType ?? 'None';
      
      // OLD FORMAT (for backward compatibility)
      words.push({
        word: word.Word,
        accuracyScore: wordScore,
        errorType,
      });

      // Extract phonemes
      const wordPhonemes = [];
      if (word.Phonemes) {
        for (const phoneme of word.Phonemes) {
          const phonemeAssessment = phoneme.PronunciationAssessment || phoneme;
          const phonemeScore = phonemeAssessment.AccuracyScore ?? phoneme.AccuracyScore ?? 0;
          
          // OLD FORMAT
          phonemes.push({
            phoneme: phoneme.Phoneme,
            accuracyScore: phonemeScore,
          });

          // NEW FORMAT
          const phonemeDetail = {
            phoneme: `/${phoneme.Phoneme}/`,
            score: phonemeScore,
            expected: `/${phoneme.Phoneme}/`,
            actual: `/${phoneme.Phoneme}/`,
            status: phonemeScore >= 70 ? 'correct' : 'incorrect',
            quality: phonemeScore >= 90 ? 'excellent' : phonemeScore >= 75 ? 'good' : phonemeScore >= 50 ? 'needs_work' : 'incorrect',
          };
          
          wordPhonemes.push(phonemeDetail);
          allPhonemes.push(phonemeDetail);
        }
      }

      // Add NEW FORMAT word
      words[words.length - 1].score = wordScore;
      words[words.length - 1].status = 
        errorType === 'Omission' ? 'omitted' :
        errorType === 'Insertion' ? 'inserted' :
        wordScore < 70 ? 'incorrect' : 'correct';
      words[words.length - 1].phonemes = wordPhonemes;
    }
  }

  // Get scores
  let pronScore = assessment.PronScore ?? nBest.PronScore ?? 0;
  let accuracyScore = assessment.AccuracyScore ?? nBest.AccuracyScore ?? 0;
  let fluencyScore = assessment.FluencyScore ?? nBest.FluencyScore ?? 80;
  let completenessScore = assessment.CompletenessScore ?? nBest.CompletenessScore ?? 0;

  // Fallback calculation if needed
  if (pronScore === 0 && words.length > 0) {
    const wordScores = words.map((w: any) => w.accuracyScore);
    accuracyScore = wordScores.reduce((a: number, b: number) => a + b, 0) / wordScores.length;
    
    const refWords = referenceText.split(/\s+/).filter(w => w.length > 0);
    const spokenWords = words.filter((w: any) => w.errorType !== 'Omission');
    completenessScore = Math.min(100, (spokenWords.length / refWords.length) * 100);
    
    pronScore = accuracyScore * 0.6 + fluencyScore * 0.2 + completenessScore * 0.2;
  }

  const recognizedText = words.map((w: any) => w.word).join(' ');

  // Return BOTH old format AND new unified format
  return {
    // NEW UNIFIED FORMAT
    provider: 'azure',
    success: true,
    recognizedText,
    expectedText: referenceText,
    textMatch: Math.round((words.filter((w: any) => w.errorType === 'None').length / words.length) * 100) || 100,
    scores: {
      overall: Math.round(pronScore),
      accuracy: Math.round(accuracyScore),
      fluency: Math.round(fluencyScore),
      completeness: Math.round(completenessScore),
      formula: `(${Math.round(accuracyScore)}×0.6 + ${Math.round(fluencyScore)}×0.2 + ${Math.round(completenessScore)}×0.2) = ${Math.round(pronScore)}`,
      weights: { accuracy: 0.6, fluency: 0.2, completeness: 0.2 },
    },
    words,
    allPhonemes,
    overallFeedback: pronScore >= 85 ? 'Excellent work!' : pronScore >= 70 ? 'Good job!' : 'Keep practicing!',
    strengths: allPhonemes.filter((p: any) => p.score >= 90).length > 0 
      ? [`Great pronunciation of ${allPhonemes.filter((p: any) => p.score >= 90).slice(0, 2).map((p: any) => p.phoneme).join(', ')}`]
      : ['Keep going!'],
    improvements: allPhonemes.filter((p: any) => p.score < 70).length > 0
      ? [`Practice: ${allPhonemes.filter((p: any) => p.score < 70).slice(0, 2).map((p: any) => p.phoneme).join(', ')}`]
      : [],
    practiceSuggestions: [],
    debug: {
      recordingStatus: 'success',
      audioSize: audioData.length,
      audioFormat,
      uploadStatus: 'success',
      apiProvider: 'azure',
      apiCallStatus: 'success',
      apiResponseStatus: 200,
      apiResponseTime: apiDuration,
      recognitionStatus: 'success',
      languageDetected: 'fr-FR',
      rawResponse,
      timestamp: new Date().toISOString(),
      processingSteps: [
        { step: 'azure_api_call', status: 'success', duration: apiDuration },
        { step: 'parse_response', status: 'success' },
      ],
    },
    versions: {
      provider_version: 'azure-v1',
      scorer_version: '2026-01-04',
      prompt_version: '2026-01-04',
    },
    
    // OLD FORMAT (for backward compatibility)
    pronScore: Math.round(pronScore),
    accuracyScore: Math.round(accuracyScore),
    fluencyScore: Math.round(fluencyScore),
    completenessScore: Math.round(completenessScore),
    phonemes,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audio, referenceText, itemId, audioFormat } = await req.json();

    if (!audio || !referenceText) {
      throw new Error('Missing audio or referenceText');
    }

    const speechKey = Deno.env.get('AZURE_SPEECH_KEY');
    const speechRegion = Deno.env.get('AZURE_SPEECH_REGION');

    if (!speechKey || !speechRegion) {
      throw new Error('Azure credentials not configured');
    }

    console.log(`[Pronunciation] Processing: ${itemId}`);
    console.log(`[Pronunciation] Reference: "${referenceText}"`);

    const binaryAudio = processBase64Chunks(audio);
    console.log(`[Pronunciation] Audio: ${binaryAudio.length} bytes`);

    const result = await assessPronunciation(binaryAudio, referenceText, speechKey, speechRegion, audioFormat || 'audio/webm');

    console.log(`[Pronunciation] Complete - Score: ${result.scores.overall}`);

    return new Response(
      JSON.stringify({ ...result, itemId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Pronunciation] Error:', errorMessage);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        debug: {
          recordingStatus: 'success',
          apiCallStatus: 'failed',
          apiErrorMessage: errorMessage,
          timestamp: new Date().toISOString(),
        }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

