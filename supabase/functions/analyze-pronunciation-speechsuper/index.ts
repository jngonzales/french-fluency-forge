import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import type {
  UnifiedPronunciationResult,
  PhonemeDetail,
  WordAnalysis,
  PracticeSuggestion,
  PronunciationDebugInfo,
} from "../_shared/unified-result.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Process base64 in chunks to prevent memory issues
 */
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
 * Call SpeechSuper API for pronunciation assessment
 */
async function assessWithSpeechSuper(
  audioData: Uint8Array,
  referenceText: string,
  apiKey: string,
  audioFormat: string
): Promise<UnifiedPronunciationResult> {
  const startTime = Date.now();
  const processingSteps: PronunciationDebugInfo['processingSteps'] = [];

  try {
    // Step 1: Prepare request
    processingSteps.push({
      step: 'prepare_request',
      status: 'success',
      message: `Audio: ${audioData.length} bytes, Format: ${audioFormat}`,
    });

    // Step 2: Call SpeechSuper API
    // NOTE: Update endpoint and request format once API key is available
    const apiUrl = Deno.env.get('SPEECHSUPER_API_URL') || 'https://api.speechsuper.com/';
    const endpoint = `${apiUrl}v1/pronunciation/assess`; // Update with actual endpoint
    
    const formData = new FormData();
    formData.append('file', new Blob([audioData.buffer as ArrayBuffer], { type: audioFormat }), 'audio.webm');
    formData.append('refText', referenceText);
    formData.append('language', 'fr-FR');
    formData.append('coreType', 'phoneme.score');
    formData.append('phonemeOutput', 'true');

    const apiCallStart = Date.now();
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        // May need different header format - check docs
      },
      body: formData,
    });

    const apiCallDuration = Date.now() - apiCallStart;

    if (!response.ok) {
      const errorText = await response.text();
      processingSteps.push({
        step: 'api_call',
        status: 'failed',
        duration: apiCallDuration,
        message: `HTTP ${response.status}: ${errorText}`,
      });

      throw new Error(`SpeechSuper API error: ${response.status} - ${errorText}`);
    }

    processingSteps.push({
      step: 'api_call',
      status: 'success',
      duration: apiCallDuration,
      message: `HTTP 200 OK`,
    });

    // Step 3: Parse response
    const rawResponse = await response.json();
    console.log('[SpeechSuper] Raw response:', JSON.stringify(rawResponse).substring(0, 500));

    processingSteps.push({
      step: 'parse_response',
      status: 'success',
      message: 'Response parsed successfully',
    });

    // Step 4: Extract and normalize data
    // NOTE: Update this mapping based on actual SpeechSuper response format
    const result = rawResponse.result || rawResponse;
    
    const words: WordAnalysis[] = [];
    const allPhonemes: PhonemeDetail[] = [];

    // Parse words and phonemes from SpeechSuper response
    if (result.words) {
      for (const wordData of result.words) {
        const phonemes: PhonemeDetail[] = [];
        
        if (wordData.phonemes) {
          for (const phonemeData of wordData.phonemes) {
            const phoneme: PhonemeDetail = {
              phoneme: phonemeData.ipa || phonemeData.phoneme,
              score: phonemeData.score || 0,
              expected: phonemeData.expected || phonemeData.ipa,
              actual: phonemeData.actual || phonemeData.ipa,
              status: (phonemeData.score >= 70 ? 'correct' : 'incorrect') as PhonemeDetail['status'],
              quality: getPhonemeQuality(phonemeData.score || 0),
              feedback: generatePhonemeFeedback(phonemeData),
            };
            
            phonemes.push(phoneme);
            allPhonemes.push(phoneme);
          }
        }

        const wordAnalysis: WordAnalysis = {
          word: wordData.word || wordData.text,
          score: wordData.score || 0,
          status: determineWordStatus(wordData),
          phonemes,
          errorType: wordData.errorType || 'none',
          feedback: wordData.feedback,
        };

        words.push(wordAnalysis);
      }
    }

    // Extract scores
    const overallScore = result.overall || result.score || 0;
    const accuracyScore = result.accuracy || result.accuracyScore || 0;
    const fluencyScore = result.fluency || result.fluencyScore || 0;
    const completenessScore = result.completeness || result.completenessScore || 0;

    // Generate practice suggestions
    const practiceSuggestions = generatePracticeSuggestions(allPhonemes);

    // Build debug info
    const debug: PronunciationDebugInfo = {
      recordingStatus: 'success',
      audioSize: audioData.length,
      audioFormat,
      uploadStatus: 'success',
      apiProvider: 'speechsuper',
      apiCallStatus: 'success',
      apiResponseStatus: response.status,
      apiResponseTime: apiCallDuration,
      recognitionStatus: 'success',
      languageDetected: result.language || 'fr-FR',
      recognitionConfidence: result.confidence,
      rawResponse,
      timestamp: new Date().toISOString(),
      processingSteps,
    };

    // Calculate text match
    const recognizedText = words.map(w => w.word).join(' ');
    const textMatch = calculateTextMatch(recognizedText, referenceText);

    // Generate feedback
    const strengths = identifyStrengths(words);
    const improvements = identifyImprovements(words);
    const overallFeedback = generateOverallFeedback(overallScore, strengths, improvements);

    const unifiedResult: UnifiedPronunciationResult = {
      provider: 'speechsuper',
      success: true,
      recognizedText,
      expectedText: referenceText,
      textMatch,
      scores: {
        overall: Math.round(overallScore),
        accuracy: Math.round(accuracyScore),
        fluency: Math.round(fluencyScore),
        completeness: Math.round(completenessScore),
        formula: `(${Math.round(accuracyScore)}×0.6 + ${Math.round(fluencyScore)}×0.2 + ${Math.round(completenessScore)}×0.2) = ${Math.round(overallScore)}`,
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
        provider_version: 'speechsuper-v1',
        scorer_version: '2026-01-04',
        prompt_version: '2026-01-04',
      },
    };

    processingSteps.push({
      step: 'build_result',
      status: 'success',
      duration: Date.now() - startTime,
    });

    return unifiedResult;

  } catch (error) {
    console.error('[SpeechSuper] Error:', error);
    
    // Return error result
    const debug: PronunciationDebugInfo = {
      recordingStatus: 'success',
      audioSize: audioData.length,
      audioFormat,
      uploadStatus: 'success',
      apiProvider: 'speechsuper',
      apiCallStatus: 'failed',
      apiErrorMessage: error instanceof Error ? error.message : 'Unknown error',
      recognitionStatus: 'failed',
      timestamp: new Date().toISOString(),
      processingSteps,
    };

    throw {
      provider: 'speechsuper',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug,
    };
  }
}

/**
 * Helper: Determine word status from API data
 */
function determineWordStatus(wordData: any): WordAnalysis['status'] {
  if (wordData.errorType === 'Omission') return 'omitted';
  if (wordData.errorType === 'Insertion') return 'inserted';
  if (wordData.score < 70) return 'incorrect';
  return 'correct';
}

/**
 * Helper: Get phoneme quality label
 */
function getPhonemeQuality(score: number): string {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 50) return 'needs_work';
  return 'incorrect';
}

/**
 * Helper: Generate phoneme-specific feedback
 */
function generatePhonemeFeedback(phonemeData: any): string {
  const score = phonemeData.score || 0;
  const expected = phonemeData.expected || phonemeData.ipa;
  const actual = phonemeData.actual || phonemeData.ipa;

  if (score >= 90) return 'Excellent pronunciation!';
  if (score >= 75) return 'Good, minor improvement possible';
  
  if (expected !== actual) {
    return `You said ${actual} instead of ${expected}`;
  }
  
  if (score < 50) {
    return `Needs significant work - review ${expected} pronunciation`;
  }
  
  return 'Needs practice';
}

/**
 * Helper: Calculate text match percentage
 */
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

/**
 * Helper: Identify strengths from word analysis
 */
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
  
  return strengths;
}

/**
 * Helper: Identify areas for improvement
 */
function identifyImprovements(words: WordAnalysis[]): string[] {
  const improvements: string[] = [];
  
  const weakPhonemes = words
    .flatMap(w => w.phonemes)
    .filter(p => p.score < 70);
  
  if (weakPhonemes.length > 0) {
    const phonemeList = [...new Set(weakPhonemes.map(p => p.phoneme))].slice(0, 3);
    improvements.push(`Practice ${phonemeList.join(', ')}`);
  }
  
  const incorrectWords = words.filter(w => w.status === 'incorrect');
  if (incorrectWords.length > 0) {
    improvements.push(`Review: ${incorrectWords.slice(0, 3).map(w => w.word).join(', ')}`);
  }
  
  return improvements;
}

/**
 * Helper: Generate overall feedback message
 */
function generateOverallFeedback(score: number, strengths: string[], improvements: string[]): string {
  if (score >= 85) {
    return `Excellent work! ${strengths[0] || 'Your pronunciation is very strong.'}`;
  } else if (score >= 70) {
    return `Good job! ${strengths[0] || 'You\'re on the right track.'} ${improvements[0] ? 'Focus on: ' + improvements[0] : ''}`;
  } else if (score >= 50) {
    return `Keep practicing. ${improvements[0] || 'Work on consistency.'}`;
  } else {
    return `Don't worry, pronunciation takes time. ${improvements[0] || 'Focus on the basics first.'}`;
  }
}

/**
 * Helper: Generate practice suggestions from problematic phonemes
 */
function generatePracticeSuggestions(phonemes: PhonemeDetail[]): PracticeSuggestion[] {
  const suggestions: PracticeSuggestion[] = [];
  const problematicPhonemes = phonemes.filter(p => p.score < 70);
  
  // Get unique phonemes with issues
  const uniqueIssues = new Map<string, PhonemeDetail[]>();
  for (const phoneme of problematicPhonemes) {
    if (!uniqueIssues.has(phoneme.phoneme)) {
      uniqueIssues.set(phoneme.phoneme, []);
    }
    uniqueIssues.get(phoneme.phoneme)!.push(phoneme);
  }

  // Generate suggestions for top 3 problematic phonemes
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

/**
 * Helper: Get practice instructions for a phoneme
 */
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
  };

  return instructions[phoneme] || `Practice the ${phoneme} sound`;
}

/**
 * Helper: Get example words for phoneme practice
 */
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
 * Main handler
 */
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

    const apiKey = Deno.env.get('SPEECHSUPER_API_KEY');
    if (!apiKey) {
      throw new Error('SpeechSuper API key not configured');
    }

    console.log(`[SpeechSuper] Processing item: ${itemId}`);
    console.log(`[SpeechSuper] Reference text: "${referenceText}"`);
    console.log(`[SpeechSuper] Audio format: ${audioFormat}`);

    // Process audio
    const binaryAudio = processBase64Chunks(audio);
    console.log(`[SpeechSuper] Audio size: ${binaryAudio.length} bytes`);

    // Call SpeechSuper
    const result = await assessWithSpeechSuper(
      binaryAudio,
      referenceText,
      apiKey,
      audioFormat || 'audio/webm'
    );

    console.log(`[SpeechSuper] Assessment complete - Score: ${result.scores.overall}`);

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[SpeechSuper] Error:', errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        provider: 'speechsuper',
        error: errorMessage,
        debug: (error as any).debug || {},
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

