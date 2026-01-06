/**
 * One-time script to pre-generate audio for all comprehension exercises
 * 
 * Usage:
 * 1. Ensure ELEVENLABS_API_KEY is set in Supabase Edge Function environment
 * 2. Ensure comprehension-audio storage bucket exists in Supabase (or use phrases-audio)
 * 3. Run this script from browser console or as a one-time migration
 * 
 * This script:
 * - Reads all comprehension items from comprehensionItems.ts
 * - Generates audio for each transcript_fr
 * - Uploads to Supabase Storage
 * - Can be called to regenerate all audio files
 */

import { comprehensionItems } from '../comprehensionItems';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_BUCKET = 'comprehension-audio'; // Or 'phrases-audio' if reusing

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
      outputFormat: 'mp3_44100_128',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`TTS generation failed: ${response.status} - ${errorText}`);
  }

  return await response.blob();
}

/**
 * Upload audio blob to Supabase Storage
 */
async function uploadComprehensionAudio(
  itemId: string,
  audioBlob: Blob
): Promise<string> {
  const fileName = `${itemId}.mp3`;
  
  // Upload file
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, audioBlob, {
      contentType: 'audio/mpeg',
      upsert: true, // Overwrite if exists
    });

  if (error) {
    throw new Error(`Failed to upload audio: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(fileName);

  if (!urlData?.publicUrl) {
    throw new Error('Failed to get public URL for uploaded audio');
  }

  return urlData.publicUrl;
}

/**
 * Ensure storage bucket exists
 */
async function ensureStorageBucket(): Promise<void> {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    throw new Error(`Failed to list buckets: ${listError.message}`);
  }

  const bucketExists = buckets?.some(b => b.name === STORAGE_BUCKET);
  
  if (!bucketExists) {
    console.warn(`Storage bucket "${STORAGE_BUCKET}" does not exist. Please create it in Supabase dashboard.`);
    console.warn(`Or update STORAGE_BUCKET constant to use an existing bucket like 'phrases-audio'`);
  }
}

/**
 * Generate and upload audio for all comprehension items
 */
export async function generateAllComprehensionAudio(): Promise<void> {
  console.log('Starting audio generation for all comprehension items...');
  console.log(`Total items: ${comprehensionItems.length}`);

  // Ensure storage bucket exists
  try {
    await ensureStorageBucket();
  } catch (error) {
    console.error('Storage bucket check failed:', error);
    throw error;
  }

  const results: Array<{ itemId: string; success: boolean; audioUrl?: string; error?: string }> = [];

  for (const item of comprehensionItems) {
    try {
      console.log(`Processing item ${item.id}...`);
      console.log(`  Text: "${item.transcript_fr.substring(0, 50)}..."`);

      // Generate audio
      const audioBlob = await generateAudioBlob(item.transcript_fr);

      // Upload to storage
      const audioUrl = await uploadComprehensionAudio(item.id, audioBlob);

      console.log(`✓ Generated and uploaded audio for ${item.id}`);
      console.log(`  URL: ${audioUrl}`);
      results.push({ itemId: item.id, success: true, audioUrl });
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`✗ Failed to generate audio for ${item.id}:`, error);
      results.push({
        itemId: item.id,
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

  if (successful > 0) {
    console.log('\nSuccessful items:');
    results
      .filter(r => r.success)
      .forEach(r => console.log(`  ✓ ${r.itemId}: ${r.audioUrl}`));
  }

  if (failed > 0) {
    console.log('\nFailed items:');
    results
      .filter(r => !r.success)
      .forEach(r => console.log(`  ✗ ${r.itemId}: ${r.error}`));
  }

  return;
}

/**
 * Generate audio for a single comprehension item (helper function)
 */
export async function generateSingleComprehensionAudio(
  itemId: string,
  text: string
): Promise<string> {
  const audioBlob = await generateAudioBlob(text);
  const audioUrl = await uploadComprehensionAudio(itemId, audioBlob);
  return audioUrl;
}

/**
 * Get public URL for a comprehension audio file
 */
export function getComprehensionAudioUrl(itemId: string): string {
  const fileName = `${itemId}.mp3`;
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(fileName);
  
  return data?.publicUrl || '';
}

