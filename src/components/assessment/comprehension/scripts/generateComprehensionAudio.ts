/**
 * DEPRECATED: Use scripts/generate-comprehension-audio-local.ts instead
 * 
 * This file is kept for reference but audio files are now stored as static assets
 * in public/audio/comprehension/ and served directly from the CDN.
 * 
 * For generating new audio files, use:
 *   tsx scripts/generate-comprehension-audio-local.ts
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Generate audio blob using TTS edge function
 */
async function generateAudioBlob(text: string): Promise<Blob> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing');
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/french-tts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({
      text,
      speed: 1.2,  // Slightly fast, natural pace (matching ComprehensionModule)
      stability: 0.35,  // More natural variation (matching ComprehensionModule)
      outputFormat: 'mp3_44100_128', // MP3 format (more compatible with storage)
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`TTS generation failed: ${response.status} - ${errorText}`);
  }

  return await response.blob();
}

/**
 * DEPRECATED: Audio files are now stored as static assets
 * Use scripts/generate-comprehension-audio-local.ts to generate files locally
 */

/**
 * DEPRECATED: Use scripts/generate-comprehension-audio-local.ts instead
 * 
 * This function is kept for backward compatibility but does nothing.
 * Audio files are now generated locally and stored as static assets.
 */
export async function generateAllComprehensionAudio(): Promise<Array<{ itemId: string; success: boolean; audioUrl?: string; error?: string }>> {
  console.warn('⚠️  This function is deprecated. Use scripts/generate-comprehension-audio-local.ts instead.');
  console.warn('Audio files are now stored as static assets in public/audio/comprehension/');
  return [];
}

/**
 * DEPRECATED: Use scripts/generate-comprehension-audio-local.ts instead
 */
export async function generateSingleComprehensionAudio(
  itemId: string,
  text: string
): Promise<string> {
  console.warn('⚠️  This function is deprecated. Use scripts/generate-comprehension-audio-local.ts instead.');
  throw new Error('Use local generation script instead');
}

