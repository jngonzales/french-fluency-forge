/**
 * One-time script to pre-generate audio for all phrases
 * 
 * Usage:
 * 1. Ensure ELEVENLABS_API_KEY is set in Supabase Edge Function environment
 * 2. Ensure phrases-audio storage bucket exists in Supabase
 * 3. Run this script (can be called from browser console or as a one-time migration)
 * 
 * This script:
 * - Reads all phrases from mockPhrasesData
 * - Generates audio for recognition phrases (from transcript_fr or canonical_fr)
 * - Generates audio for recall phrases (from canonical_fr, for shadow mode)
 * - Uploads to Supabase Storage
 * - Updates phrase data with audio_url
 */

import { MOCK_PHRASES } from '../data/mockPhrasesData';
import { generatePhraseAudio } from '../utils/audioGeneration';
import { uploadPhraseAudio, ensureStorageBucket } from '../services/audioStorage';

/**
 * Generate and upload audio for all phrases
 */
export async function generateAllPhraseAudio(): Promise<void> {
  console.log('Starting audio generation for all phrases...');
  console.log(`Total phrases: ${MOCK_PHRASES.length}`);

  // Ensure storage bucket exists
  try {
    await ensureStorageBucket();
  } catch (error) {
    console.error('Storage bucket check failed:', error);
    throw error;
  }

  const results: Array<{ phraseId: string; success: boolean; error?: string }> = [];

  for (const phrase of MOCK_PHRASES) {
    try {
      console.log(`Processing phrase ${phrase.id}...`);

      // Determine text to generate audio from
      let textToGenerate: string | null = null;

      if (phrase.mode === 'recognition') {
        // Recognition: use transcript_fr or canonical_fr
        textToGenerate = phrase.transcript_fr || phrase.canonical_fr || null;
      } else {
        // Recall: generate audio from canonical_fr (for shadow mode)
        textToGenerate = phrase.canonical_fr || null;
      }

      if (!textToGenerate) {
        console.warn(`Skipping phrase ${phrase.id}: No French text available`);
        results.push({ phraseId: phrase.id, success: false, error: 'No French text' });
        continue;
      }

      // Generate audio
      const audioBlob = await generatePhraseAudio(textToGenerate, {
        outputFormat: 'mp3_44100_128', // MP3 for storage
      });

      // Upload to storage
      const audioUrl = await uploadPhraseAudio(phrase.id, audioBlob, 'mp3');

      console.log(`✓ Generated and uploaded audio for ${phrase.id}: ${audioUrl}`);
      results.push({ phraseId: phrase.id, success: true });
    } catch (error) {
      console.error(`✗ Failed to generate audio for ${phrase.id}:`, error);
      results.push({
        phraseId: phrase.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log('\n=== Audio Generation Summary ===');
  console.log(`Total: ${results.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.log('\nFailed phrases:');
    results
      .filter(r => !r.success)
      .forEach(r => console.log(`  - ${r.phraseId}: ${r.error}`));
  }

  return;
}

/**
 * Generate audio for a single phrase (helper function)
 */
export async function generateSinglePhraseAudio(
  phraseId: string,
  text: string
): Promise<string> {
  const audioBlob = await generatePhraseAudio(text, {
    outputFormat: 'mp3_44100_128',
  });

  const audioUrl = await uploadPhraseAudio(phraseId, audioBlob, 'mp3');
  return audioUrl;
}

