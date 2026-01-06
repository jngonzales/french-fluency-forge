/**
 * Script to generate audio for all comprehension items missing audio
 * 
 * Usage:
 *   tsx scripts/generate-comprehension-audio.ts
 * 
 * Requires:
 *   - VITE_SUPABASE_URL environment variable
 *   - VITE_SUPABASE_PUBLISHABLE_KEY environment variable
 *   - ELEVENLABS_API_KEY in Supabase Edge Function environment
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables:');
  console.error('  - VITE_SUPABASE_URL');
  console.error('  - VITE_SUPABASE_PUBLISHABLE_KEY');
  console.error('\nSet these in your .env file or as environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const STORAGE_BUCKET = 'comprehension-audio';

/**
 * Generate audio blob using TTS edge function
 */
async function generateAudioBlob(text: string): Promise<Blob> {
  const response = await fetch(`${supabaseUrl}/functions/v1/french-tts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({
      text,
      speed: 1.2,
      stability: 0.35,
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
 * Upload audio blob to Supabase Storage and update database
 */
async function uploadComprehensionAudio(
  itemId: string,
  audioBlob: Blob
): Promise<{ audioUrl: string; storagePath: string }> {
  const fileName = `${itemId}.mp3`;
  const storagePath = `comprehension/${fileName}`;
  
  // Upload file
  // Try without explicit content type - let Supabase detect it
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, audioBlob, {
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to upload audio: ${uploadError.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(storagePath);

  if (!urlData?.publicUrl) {
    throw new Error('Failed to get public URL for uploaded audio');
  }

  // Update database record (only audio_url - audio_storage_path may not exist yet)
  const { error: updateError } = await supabase
    .from('comprehension_items' as any)
    .update({
      audio_url: urlData.publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId);

  if (updateError) {
    console.warn(`Failed to update database for ${itemId}:`, updateError);
    // Try without updated_at in case that column doesn't exist either
    const { error: retryError } = await supabase
      .from('comprehension_items' as any)
      .update({
        audio_url: urlData.publicUrl,
      })
      .eq('id', itemId);
    
    if (retryError) {
      console.warn(`Retry also failed for ${itemId}:`, retryError);
    }
  }

  return {
    audioUrl: urlData.publicUrl,
    storagePath,
  };
}

async function main() {
  console.log('🚀 Starting comprehension audio generation...\n');

  // Fetch items from database that don't have audio yet
  const { data: items, error: fetchError } = await supabase
    .from('comprehension_items' as any)
    .select('id, transcript_fr, audio_url, cefr_level')
    .is('audio_url', null)
    .order('cefr_level', { ascending: true })
    .order('id', { ascending: true });

  if (fetchError) {
    console.error('❌ Failed to fetch items:', fetchError.message);
    process.exit(1);
  }

  if (!items || items.length === 0) {
    console.log('✅ All items already have audio!');
    return;
  }

  console.log(`📋 Found ${items.length} items without audio:\n`);
  items.forEach(item => {
    console.log(`  - ${item.id} (${item.cefr_level})`);
  });
  console.log('');

  const results: Array<{ itemId: string; success: boolean; audioUrl?: string; error?: string }> = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const progress = `[${i + 1}/${items.length}]`;
    
    try {
      console.log(`${progress} Processing ${item.id} (${item.cefr_level})...`);
      console.log(`  Text: "${item.transcript_fr.substring(0, 60)}..."`);

      // Generate audio
      const audioBlob = await generateAudioBlob(item.transcript_fr);

      // Upload to storage and update database
      const { audioUrl } = await uploadComprehensionAudio(item.id, audioBlob);

      console.log(`  ✅ Generated and uploaded: ${audioUrl}\n`);
      results.push({ itemId: item.id, success: true, audioUrl });
      
      // Small delay to avoid rate limiting
      if (i < items.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`  ❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
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

  console.log('\n' + '='.repeat(50));
  console.log('📊 Audio Generation Summary');
  console.log('='.repeat(50));
  console.log(`Total processed: ${results.length}`);
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);

  if (successful > 0) {
    console.log('\n✅ Successful items:');
    results
      .filter(r => r.success)
      .forEach(r => console.log(`  - ${r.itemId}`));
  }

  if (failed > 0) {
    console.log('\n❌ Failed items:');
    results
      .filter(r => !r.success)
      .forEach(r => console.log(`  - ${r.itemId}: ${r.error}`));
  }

  console.log('\n✅ Done!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

