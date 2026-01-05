/**
 * Speech Recognition Service
 * Transcribes user audio and calculates similarity to target phrase
 */

import { supabase } from '@/integrations/supabase/client';
import { calculateSimilarity, type SimilarityResult } from '../utils/similarityCalculation';

export interface SpeechRecognitionResult {
  transcript: string;
  similarity: number;
  similarityDetails: SimilarityResult;
}

/**
 * Convert audio blob to base64 string
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Transcribe audio using transcribe-pronunciation Edge Function
 */
export async function transcribePhraseAudio(
  audioBlob: Blob,
  targetText: string | string[]
): Promise<SpeechRecognitionResult> {
  // Convert blob to base64
  const audioBase64 = await blobToBase64(audioBlob);
  
  // Get the primary target text for transcription context
  const primaryTarget = Array.isArray(targetText) ? targetText[0] : targetText;

  // Call transcribe-pronunciation Edge Function
  const { data, error } = await supabase.functions.invoke('transcribe-pronunciation', {
    body: {
      audio: audioBase64,
      targetText: primaryTarget,
      audioFormat: audioBlob.type || 'audio/webm',
    },
  });

  if (error) {
    throw new Error(`Transcription failed: ${error.message}`);
  }

  const transcript = data?.transcript || '';
  
  // Calculate similarity with all acceptable answers
  const similarityDetails = calculateSimilarity(transcript, targetText);

  return {
    transcript,
    similarity: similarityDetails.similarity,
    similarityDetails,
  };
}

/**
 * Alternative: Use Web Speech API if available (browser-native)
 * Falls back to Edge Function if not available
 */
export async function transcribePhraseAudioWithWebSpeech(
  audioBlob: Blob,
  targetText: string | string[]
): Promise<SpeechRecognitionResult> {
  // Check if Web Speech API is available
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    // Note: Web Speech API doesn't work with audio blobs directly
    // It requires real-time microphone input
    // So we'll use the Edge Function approach instead
    return transcribePhraseAudio(audioBlob, targetText);
  }

  // Fallback to Edge Function
  return transcribePhraseAudio(audioBlob, targetText);
}

