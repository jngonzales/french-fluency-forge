/**
 * Unified Pronunciation Result Types
 * Shared interface for SpeechSuper and Azure Speech providers
 */

export type PronunciationProvider = 'speechsuper' | 'azure';

export type PhonemeStatus = 'correct' | 'incorrect' | 'missing';
export type WordStatus = 'correct' | 'incorrect' | 'omitted' | 'inserted';

/**
 * Phoneme-level detail
 */
export interface PhonemeDetail {
  phoneme: string; // IPA notation (e.g., "/u/", "/y/")
  score: number; // 0-100
  expected: string; // Expected IPA
  actual: string; // What was detected
  status: PhonemeStatus;
  quality?: string; // "excellent", "good", "needs_work", "incorrect"
  feedback?: string; // Specific feedback for this phoneme
}

/**
 * Word-level analysis
 */
export interface WordAnalysis {
  word: string; // The word
  score: number; // 0-100
  status: WordStatus;
  phonemes: PhonemeDetail[];
  errorType?: string; // "mispronunciation", "omission", "insertion", "none"
  feedback?: string; // Word-specific feedback
}

/**
 * Debug information for troubleshooting
 */
export interface PronunciationDebugInfo {
  // Recording stage
  recordingStatus: 'success' | 'failed';
  audioSize: number; // bytes
  audioFormat: string; // MIME type
  audioDuration?: number; // seconds
  
  // Upload stage
  uploadStatus: 'success' | 'failed';
  uploadSize?: number; // base64 size
  
  // API call stage
  apiProvider: PronunciationProvider;
  apiCallStatus: 'success' | 'failed';
  apiResponseStatus?: number; // HTTP status code
  apiResponseTime?: number; // milliseconds
  apiErrorMessage?: string;
  
  // Recognition stage
  recognitionStatus: 'success' | 'failed' | 'partial';
  languageDetected?: string;
  recognitionConfidence?: number; // 0-1
  
  // Raw data
  rawResponse?: unknown;
  rawRequest?: unknown;
  
  // Timestamps
  timestamp: string;
  processingSteps: Array<{
    step: string;
    status: 'success' | 'failed' | 'skipped';
    duration?: number;
    message?: string;
  }>;
}

/**
 * Score breakdown with explanation
 */
export interface ScoreBreakdown {
  overall: number; // 0-100
  accuracy: number; // 0-100 (phoneme correctness)
  fluency: number; // 0-100 (timing/rhythm)
  completeness: number; // 0-100 (all words spoken)
  
  // Formula explanation
  formula: string; // e.g., "(75×0.6 + 88×0.2 + 100×0.2) = 78"
  weights: {
    accuracy: number;
    fluency: number;
    completeness: number;
  };
}

/**
 * Practice suggestions
 */
export interface PracticeSuggestion {
  phoneme: string; // IPA
  issue: string; // What went wrong
  tip: string; // How to fix it
  exampleWords: string[]; // French words to practice
  difficulty: 'easy' | 'medium' | 'hard';
}

/**
 * Unified pronunciation result
 * Returned by both SpeechSuper and Azure providers
 */
export interface UnifiedPronunciationResult {
  // Provider info
  provider: PronunciationProvider;
  success: boolean;
  
  // What was said vs expected
  recognizedText: string; // What API understood
  expectedText: string; // Reference text
  textMatch: number; // 0-100 percentage match
  
  // Scores
  scores: ScoreBreakdown;
  
  // Detailed analysis
  words: WordAnalysis[];
  allPhonemes: PhonemeDetail[]; // Flat list of all phonemes
  
  // Feedback
  overallFeedback: string; // Human-readable summary
  strengths: string[]; // What user did well
  improvements: string[]; // What needs work
  practiceSuggestions: PracticeSuggestion[];
  
  // Debug
  debug: PronunciationDebugInfo;
  
  // Versions
  versions: {
    provider_version: string;
    scorer_version: string;
    prompt_version: string;
  };
}

/**
 * Provider interface
 */
export interface PronunciationProviderInterface {
  name: PronunciationProvider;
  isAvailable(): Promise<boolean>;
  assess(
    audio: Uint8Array,
    referenceText: string,
    options?: {
      language?: string;
      audioFormat?: string;
    }
  ): Promise<UnifiedPronunciationResult>;
}

/**
 * Error types for clear error handling
 */
export class PronunciationError extends Error {
  constructor(
    message: string,
    public provider: PronunciationProvider,
    public stage: 'recording' | 'upload' | 'api_call' | 'parsing' | 'unknown',
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'PronunciationError';
  }
}

