import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import type {
  UnifiedPronunciationResult,
  PhonemeDetail,
  WordAnalysis,
  PracticeSuggestion,
  PronunciationDebugInfo,
  WordStatus,
  PhonemeStatus,
} from "../_shared/unified-result.ts";

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

/**
 * Assess pronunciation using Azure Speech API
 * Returns unified result format with comprehensive debug info
 */
async function assessWithAzure(
  audioData: Uint8Array,
  referenceText: string,
  speechKey: string,
  speechRegion: string,
  audioFormat: string
): Promise<UnifiedPronunciationResult> {
  const startTime = Date.now();
  const processingSteps: PronunciationDebugInfo['processingSteps'] = [];

  try {
    // Step 1: Prepare Azure request
    processingSteps.push({
      step: 'prepare_azure_request',
      status: 'success',
      message: `Audio: ${audioData.length} bytes, Format: ${audioFormat}`,
    });

  const pronunciationConfig = {
    referenceText: referenceText,
    gradingSystem: "HundredMark",
    granularity: "Phoneme",
    enableMiscue: true,
    phonemeAlphabet: "IPA"
  };

  const pronunciationConfigBase64 = btoa(JSON.stringify(pronunciationConfig));
  
    console.log('[Azure] Config:', JSON.stringify(pronunciationConfig));
    console.log('[Azure] Audio format from client:', audioFormat);

    // Determine content type
  let contentType = 'audio/webm; codecs=opus';
  if (audioFormat?.includes('wav') || audioFormat?.includes('pcm')) {
    contentType = 'audio/wav';
  } else if (audioFormat?.includes('ogg')) {
    contentType = 'audio/ogg; codecs=opus';
  } else if (audioFormat?.includes('mp3') || audioFormat?.includes('mpeg')) {
    contentType = 'audio/mpeg';
  }
  
    console.log('[Azure] Using Content-Type:', contentType);

    // Step 2: Call Azure API
  const endpoint = `https://${speechRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=fr-FR&format=detailed`;

    const apiCallStart = Date.now();
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

    const apiCallDuration = Date.now() - apiCallStart;

  if (!response.ok) {
    const errorText = await response.text();
      console.error('[Azure] API error:', response.status, errorText);
      
      processingSteps.push({
        step: 'azure_api_call',
        status: 'failed',
        duration: apiCallDuration,
        message: `HTTP ${response.status}: ${errorText}`,
      });

    throw new Error(`Azure Speech API error: ${response.status} - ${errorText}`);
  }

    processingSteps.push({
      step: 'azure_api_call',
      status: 'success',
      duration: apiCallDuration,
      message: `HTTP 200 OK`,
    });

    const rawResponse = await response.json();
    console.log('[Azure] Full response received');

    // Step 3: Parse Azure response
    const nBest = rawResponse.NBest?.[0];
  if (!nBest) {
      console.error('[Azure] No NBest in response:', JSON.stringify(rawResponse));
      
      processingSteps.push({
        step: 'parse_response',
        status: 'failed',
        message: 'No NBest data in Azure response',
      });

      throw new Error('Azure response missing NBest data');
    }

    processingSteps.push({
      step: 'parse_response',
      status: 'success',
      message: `Parsed ${nBest.Words?.length || 0} words`,
    });

    console.log('[Azure] NBest keys:', Object.keys(nBest));
    console.log('[Azure] NBest.PronunciationAssessment:', JSON.stringify(nBest.PronunciationAssessment));
  
  const assessment = nBest.PronunciationAssessment || {};
    const words: WordAnalysis[] = [];
    const allPhonemes: PhonemeDetail[] = [];

    // Step 4: Extract word and phoneme data
  if (nBest.Words) {
      console.log('[Azure] First word structure:', JSON.stringify(nBest.Words[0]));
    
    for (const word of nBest.Words) {
      const wordAssessment = word.PronunciationAssessment || word;
        const wordScore = wordAssessment.AccuracyScore ?? word.AccuracyScore ?? 0;
      const errorType = wordAssessment.ErrorType ?? word.ErrorType ?? 'None';
      
        // Extract phonemes
        const phonemes: PhonemeDetail[] = [];
        const phonemeList = word.Phonemes || [];
        
      for (const phoneme of phonemeList) {
        const phonemeAssessment = phoneme.PronunciationAssessment || phoneme;
          const phonemeScore = phonemeAssessment.AccuracyScore ?? phoneme.AccuracyScore ?? 0;
          
          const phonemeDetail: PhonemeDetail = {
            phoneme: `/${phoneme.Phoneme}/` || phoneme.Phoneme,
            score: phonemeScore,
            expected: `/${phoneme.Phoneme}/`,
            actual: `/${phoneme.Phoneme}/`, // Azure doesn't provide "actual" - show expected
            status: (phonemeScore >= 70 ? 'correct' : 'incorrect') as PhonemeStatus,
            quality: getPhonemeQuality(phonemeScore),
            feedback: generatePhonemeFeedback(phonemeScore, phoneme.Phoneme),
          };
          
          phonemes.push(phonemeDetail);
          allPhonemes.push(phonemeDetail);
        }

        const wordStatus: WordStatus = 
          errorType === 'Omission' ? 'omitted' :
          errorType === 'Insertion' ? 'inserted' :
          wordScore < 70 ? 'incorrect' :
          'correct';

        const wordAnalysis: WordAnalysis = {
          word: word.Word,
          score: wordScore,
          status: wordStatus,
          phonemes,
          errorType,
          feedback: generateWordFeedback(wordScore, errorType),
        };

        words.push(wordAnalysis);
      }
    }

    processingSteps.push({
      step: 'extract_phonemes',
      status: 'success',
      message: `Extracted ${allPhonemes.length} phonemes from ${words.length} words`,
    });

  // Get top-level scores
  let pronScore = assessment.PronScore ?? nBest.PronScore ?? 0;
  let accuracyScore = assessment.AccuracyScore ?? nBest.AccuracyScore ?? 0;
    let fluencyScore = assessment.FluencyScore ?? nBest.FluencyScore ?? 80;
  let completenessScore = assessment.CompletenessScore ?? nBest.CompletenessScore ?? 0;

    // FALLBACK: Calculate scores from word-level data when top-level is missing
  if (pronScore === 0 && words.length > 0) {
      console.log('[Azure] Top-level PronScore is 0, calculating from word-level data...');
    
      const wordScores = words.map(w => w.score);
    accuracyScore = wordScores.reduce((a, b) => a + b, 0) / wordScores.length;
    
    const referenceWords = referenceText.split(/\s+/).filter(w => w.length > 0);
      const spokenWords = words.filter(w => w.status !== 'omitted');
    completenessScore = Math.min(100, (spokenWords.length / referenceWords.length) * 100);
    
    pronScore = accuracyScore * 0.6 + fluencyScore * 0.2 + completenessScore * 0.2;
    
      console.log('[Azure] Calculated scores:', {
      accuracyScore: Math.round(accuracyScore),
      fluencyScore: Math.round(fluencyScore),
      completenessScore: Math.round(completenessScore),
      pronScore: Math.round(pronScore),
    });

      processingSteps.push({
        step: 'fallback_calculation',
        status: 'success',
        message: 'Calculated scores from word-level data',
      });
    }

    // Generate feedback
    const strengths = identifyStrengths(words);
    const improvements = identifyImprovements(words, allPhonemes);
    const overallFeedback = generateOverallFeedback(Math.round(pronScore), strengths, improvements);
    const practiceSuggestions = generatePracticeSuggestions(allPhonemes);

    // Calculate text match
    const recognizedText = words.map(w => w.word).join(' ');
    const textMatch = calculateTextMatch(recognizedText, referenceText);

    // Build comprehensive debug info
    const debug: PronunciationDebugInfo = {
      recordingStatus: 'success',
      audioSize: audioData.length,
      audioFormat,
      uploadStatus: 'success',
      uploadSize: audioData.length, // Same as audio size for binary
      apiProvider: 'azure',
      apiCallStatus: 'success',
      apiResponseStatus: response.status,
      apiResponseTime: apiCallDuration,
      recognitionStatus: 'success',
      languageDetected: 'fr-FR',
      recognitionConfidence: nBest.Confidence,
      rawResponse,
      timestamp: new Date().toISOString(),
      processingSteps,
    };

    const unifiedResult: UnifiedPronunciationResult = {
      provider: 'azure',
      success: true,
      recognizedText,
      expectedText: referenceText,
      textMatch,
      scores: {
        overall: Math.round(pronScore),
        accuracy: Math.round(accuracyScore),
        fluency: Math.round(fluencyScore),
        completeness: Math.round(completenessScore),
        formula: `(${Math.round(accuracyScore)}×0.6 + ${Math.round(fluencyScore)}×0.2 + ${Math.round(completenessScore)}×0.2) = ${Math.round(pronScore)}`,
        weights: {
          accuracy: 0.6,
          fluency: 0.2,
          completeness: 0.2,
        },
      },
      words,
      allPhonemes,
      overallFeedback,
      strengths,
      improvements,
      practiceSuggestions,
      debug,
      versions: {
        provider_version: 'azure-speech-v1',
        scorer_version: '2026-01-04',
        prompt_version: '2026-01-04',
      },
    };

    processingSteps.push({
      step: 'build_unified_result',
      status: 'success',
      duration: Date.now() - startTime,
    });

    return unifiedResult;

  } catch (error) {
    console.error('[Azure] Error:', error);
    throw error;
  }
}

// Helper functions
function getPhonemeQuality(score: number): string {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 50) return 'needs_work';
  return 'incorrect';
}

function generatePhonemeFeedback(score: number, phoneme: string): string {
  if (score >= 90) return 'Excellent pronunciation!';
  if (score >= 75) return 'Good, minor improvement possible';
  if (score < 50) return `Needs significant work - review /${phoneme}/ pronunciation`;
  return 'Needs practice';
}

function generateWordFeedback(score: number, errorType: string): string {
  if (errorType === 'Omission') return 'Word was skipped';
  if (errorType === 'Insertion') return 'Extra word added';
  if (score >= 90) return 'Perfect!';
  if (score >= 75) return 'Good pronunciation';
  if (score >= 50) return 'Needs some work';
  return 'Needs significant practice';
}

function calculateTextMatch(recognized: string, expected: string): number {
  const recognizedWords = recognized.toLowerCase().split(/\s+/);
  const expectedWords = expected.toLowerCase().split(/\s+/);
  
  let matches = 0;
  for (let i = 0; i < Math.min(recognizedWords.length, expectedWords.length); i++) {
    if (recognizedWords[i] === expectedWords[i]) {
      matches++;
    }
  }
  
  return Math.round((matches / expectedWords.length) * 100);
}

function identifyStrengths(words: WordAnalysis[]): string[] {
  const strengths: string[] = [];
  
  const excellentPhonemes = words
    .flatMap(w => w.phonemes)
    .filter(p => p.score >= 90);
  
  if (excellentPhonemes.length > 0) {
    const phonemeList = [...new Set(excellentPhonemes.map(p => p.phoneme))].slice(0, 3);
    strengths.push(`Excellent pronunciation of ${phonemeList.join(', ')}`);
  }
  
  const correctWords = words.filter(w => w.status === 'correct');
  if (correctWords.length > words.length * 0.8) {
    strengths.push('Strong overall accuracy');
  }
  
  const avgFluency = words.length > 0 
    ? words.reduce((sum, w) => sum + w.score, 0) / words.length
    : 0;
  
  if (avgFluency >= 85) {
    strengths.push('Natural rhythm and fluency');
  }
  
  return strengths.length > 0 ? strengths : ['Keep up the good work!'];
}

function identifyImprovements(words: WordAnalysis[], allPhonemes: PhonemeDetail[]): string[] {
  const improvements: string[] = [];
  
  const weakPhonemes = allPhonemes.filter(p => p.score < 70);
  
  if (weakPhonemes.length > 0) {
    const phonemeList = [...new Set(weakPhonemes.map(p => p.phoneme))].slice(0, 3);
    improvements.push(`Practice these sounds: ${phonemeList.join(', ')}`);
  }
  
  const incorrectWords = words.filter(w => w.status === 'incorrect');
  if (incorrectWords.length > 0) {
    const wordList = incorrectWords.slice(0, 3).map(w => `"${w.word}"`).join(', ');
    improvements.push(`Review these words: ${wordList}`);
  }
  
  const omittedWords = words.filter(w => w.status === 'omitted');
  if (omittedWords.length > 0) {
    improvements.push(`Don't skip words - every word matters in French`);
  }
  
  return improvements;
}

function generateOverallFeedback(score: number, strengths: string[], improvements: string[]): string {
  if (score >= 85) {
    return `Excellent work! ${strengths[0]} ${improvements.length > 0 ? 'Just minor tweaks needed.' : ''}`;
  } else if (score >= 70) {
    return `Good job! ${strengths[0]} ${improvements[0] ? 'Focus on: ' + improvements[0] : ''}`;
  } else if (score >= 50) {
    return `Keep practicing. ${improvements[0] || 'Work on consistency.'} ${strengths[0] || ''}`;
  } else {
    return `Don't worry, pronunciation takes time. ${improvements[0] || 'Start with the basics.'} ${strengths[0] || ''}`;
  }
}

function generatePracticeSuggestions(phonemes: PhonemeDetail[]): PracticeSuggestion[] {
  const suggestions: PracticeSuggestion[] = [];
  const problematicPhonemes = phonemes.filter(p => p.score < 70);
  
  const uniqueIssues = new Map<string, PhonemeDetail[]>();
  for (const phoneme of problematicPhonemes) {
    if (!uniqueIssues.has(phoneme.phoneme)) {
      uniqueIssues.set(phoneme.phoneme, []);
    }
    uniqueIssues.get(phoneme.phoneme)!.push(phoneme);
  }

  const topIssues = Array.from(uniqueIssues.entries())
    .sort((a, b) => {
      const avgA = a[1].reduce((sum, p) => sum + p.score, 0) / a[1].length;
      const avgB = b[1].reduce((sum, p) => sum + p.score, 0) / b[1].length;
      return avgA - avgB;
    })
    .slice(0, 3);

  for (const [phoneme, instances] of topIssues) {
    const avgScore = instances.reduce((sum, p) => sum + p.score, 0) / instances.length;
    
    const suggestion: PracticeSuggestion = {
      phoneme,
      issue: instances[0].feedback || `Low score: ${Math.round(avgScore)}%`,
      tip: getPhonemeInstruction(phoneme),
      exampleWords: getExampleWords(phoneme),
      difficulty: avgScore < 30 ? 'hard' : avgScore < 60 ? 'medium' : 'easy',
    };
    
    suggestions.push(suggestion);
  }

  return suggestions;
}

function getPhonemeInstruction(phoneme: string): string {
  const instructions: Record<string, string> = {
    '/u/': 'Round your lips and keep tongue back. Try "tout", "vous", "roue"',
    '/y/': 'Round lips but tongue forward (like /i/). Try "tu", "rue", "vue"',
    '/ʁ/': 'French R from back of throat. Try "rue", "rouge", "rire"',
    '/ɛ̃/': 'Nasal /e/. Don\'t close your mouth. Try "vin", "pain", "bien"',
    '/ɑ̃/': 'Nasal /a/. Lower jaw, open. Try "sans", "temps", "banc"',
    '/ɔ̃/': 'Nasal /o/. Round lips. Try "bon", "mon", "son"',
    '/ø/': 'Round lips, tongue forward. Try "peu", "deux", "feu"',
    '/œ/': 'Like /ø/ but more open. Try "peur", "fleur", "soeur"',
    '/s/': 'Unvoiced /s/. Try "poisson", "passer"',
    '/z/': 'Voiced /z/. Try "poison", "maison"',
  };

  return instructions[phoneme] || `Practice the ${phoneme} sound`;
}

function getExampleWords(phoneme: string): string[] {
  const examples: Record<string, string[]> = {
    '/u/': ['tout', 'vous', 'roue', 'loup', 'cou'],
    '/y/': ['tu', 'rue', 'vue', 'nu', 'pu'],
    '/ʁ/': ['rue', 'rouge', 'rire', 'partir', 'dire'],
    '/ɛ̃/': ['vin', 'pain', 'bien', 'main', 'fin'],
    '/ɑ̃/': ['sans', 'temps', 'banc', 'vent', 'dent'],
    '/ɔ̃/': ['bon', 'mon', 'son', 'long', 'fond'],
    '/ø/': ['peu', 'deux', 'feu', 'jeu', 'bleu'],
    '/œ/': ['peur', 'fleur', 'soeur', 'coeur', 'heure'],
    '/s/': ['poisson', 'saison', 'passer', 'classe'],
    '/z/': ['poison', 'raison', 'maison', 'zéro'],
  };

  return examples[phoneme] || [phoneme];
}

/**
 * Try SpeechSuper first, fallback to Azure
 * ALWAYS uses Azure if SpeechSuper not available
 */
async function assessPronunciation(
  audioData: Uint8Array,
  referenceText: string,
  audioFormat: string
): Promise<UnifiedPronunciationResult> {
  const startTime = Date.now();
  
  // Check Azure credentials first (required fallback)
  const azureKey = Deno.env.get('AZURE_SPEECH_KEY');
  const azureRegion = Deno.env.get('AZURE_SPEECH_REGION');

  if (!azureKey || !azureRegion) {
    throw new Error('Azure Speech credentials not configured (required for pronunciation assessment)');
  }
  
  // Try SpeechSuper first if API key available
  const speechSuperKey = Deno.env.get('SPEECHSUPER_API_KEY');
  
  if (speechSuperKey) {
    console.log('[Provider] Attempting SpeechSuper (primary)...');
    try {
      // Call SpeechSuper edge function
      const speechSuperUrl = Deno.env.get('SUPABASE_URL');
      const response = await fetch(`${speechSuperUrl}/functions/v1/analyze-pronunciation-speechsuper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio: btoa(String.fromCharCode(...audioData)),
          referenceText,
          audioFormat,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('[Provider] SpeechSuper succeeded');
        return result as UnifiedPronunciationResult;
      } else {
        const errorText = await response.text();
        console.warn('[Provider] SpeechSuper failed:', response.status, errorText);
        console.log('[Provider] Falling back to Azure...');
      }
    } catch (error) {
      console.warn('[Provider] SpeechSuper error:', error);
      console.log('[Provider] Falling back to Azure...');
    }
  } else {
    console.log('[Provider] SpeechSuper API key not configured, using Azure');
  }

  // Use Azure (always available)
  console.log('[Provider] Using Azure Speech...');
  return await assessWithAzure(audioData, referenceText, azureKey, azureRegion, audioFormat);
}

/**
 * Main handler
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const overallStart = Date.now();

  try {
    const { audio, referenceText, itemId, audioFormat } = await req.json();

    if (!audio) {
      throw new Error('No audio data provided');
    }

    if (!referenceText) {
      throw new Error('No reference text provided');
    }

    console.log(`[Pronunciation] Processing item: ${itemId}`);
    console.log(`[Pronunciation] Reference text: "${referenceText}"`);
    console.log(`[Pronunciation] Audio format: ${audioFormat}`);

    // Process audio
    const binaryAudio = processBase64Chunks(audio);
    console.log(`[Pronunciation] Audio size: ${binaryAudio.length} bytes`);

    // Assess with provider selection
    const result = await assessPronunciation(binaryAudio, referenceText, audioFormat || 'audio/webm');

    console.log(`[Pronunciation] Assessment complete - Provider: ${result.provider}, Score: ${result.scores.overall}`);
    console.log(`[Pronunciation] Words: ${result.words.length}, Phonemes: ${result.allPhonemes.length}`);

    const totalDuration = Date.now() - overallStart;
    console.log(`[Pronunciation] Total processing time: ${totalDuration}ms`);

    return new Response(
      JSON.stringify({
        ...result,
        itemId,
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
        provider: 'unknown',
        error: errorMessage,
        stack: errorStack,
        debug: {
          recordingStatus: 'success',
          audioSize: 0,
          audioFormat: 'unknown',
          uploadStatus: 'failed',
          apiProvider: 'unknown',
          apiCallStatus: 'failed',
          apiErrorMessage: errorMessage,
          recognitionStatus: 'failed',
          timestamp: new Date().toISOString(),
          processingSteps: [
            {
              step: 'error',
              status: 'failed',
              message: errorMessage,
            },
          ],
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
