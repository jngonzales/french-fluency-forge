/**
 * Generate comprehension audio files and save to public/audio/comprehension/
 * 
 * Usage:
 *   tsx scripts/generate-comprehension-audio-local.ts
 * 
 * This script:
 * - Generates MP3 audio for all 12 comprehension items
 * - Saves files to public/audio/comprehension/
 * - No database updates, no storage uploads - just saves files locally
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mjqykgcvfteihqmgeufb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qcXlrZ2N2ZnRlaWhxbWdldWZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MTM1ODMsImV4cCI6MjA4MjM4OTU4M30.d084bXB6DnyUry4JkdWh7_ff05SxeOfPonhCA75JwWw';

const supabase = createClient(supabaseUrl, supabaseKey);

const OUTPUT_DIR = join(process.cwd(), 'public', 'audio', 'comprehension');

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
 * Save audio blob to local file system
 */
async function saveAudioFile(itemId: string, audioBlob: Blob): Promise<string> {
  // Ensure directory exists
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const fileName = `${itemId}.mp3`;
  const filePath = join(OUTPUT_DIR, fileName);

  // Convert blob to buffer and save
  const arrayBuffer = await audioBlob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  writeFileSync(filePath, buffer);

  return `/audio/comprehension/${fileName}`;
}

async function main() {
  console.log('🚀 Generating comprehension audio files locally...\n');

  // Fetch items from database
  const { data: items, error: fetchError } = await supabase
    .from('comprehension_items' as any)
    .select('id, transcript_fr, cefr_level')
    .order('cefr_level', { ascending: true })
    .order('id', { ascending: true });

  if (fetchError) {
    console.error('❌ Failed to fetch items:', fetchError.message);
    process.exit(1);
  }

  if (!items || items.length === 0) {
    console.log('❌ No items found in database');
    process.exit(1);
  }

  console.log(`📋 Found ${items.length} items to process:\n`);
  items.forEach(item => {
    console.log(`  - ${item.id} (${item.cefr_level})`);
  });
  console.log('');

  const results: Array<{ itemId: string; success: boolean; filePath?: string; error?: string }> = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const progress = `[${i + 1}/${items.length}]`;
    
    try {
      console.log(`${progress} Processing ${item.id} (${item.cefr_level})...`);
      console.log(`  Text: "${item.transcript_fr.substring(0, 60)}..."`);

      // Generate audio
      const audioBlob = await generateAudioBlob(item.transcript_fr);

      // Save to local file system
      const filePath = await saveAudioFile(item.id, audioBlob);

      console.log(`  ✅ Saved: ${filePath}\n`);
      results.push({ itemId: item.id, success: true, filePath });
      
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
  console.log(`\n📁 Files saved to: ${OUTPUT_DIR}`);

  if (successful > 0) {
    console.log('\n✅ Generated files:');
    results
      .filter(r => r.success)
      .forEach(r => console.log(`  - ${r.filePath}`));
  }

  if (failed > 0) {
    console.log('\n❌ Failed items:');
    results
      .filter(r => !r.success)
      .forEach(r => console.log(`  - ${r.itemId}: ${r.error}`));
  }

  console.log('\n📝 Next steps:');
  console.log('1. Review generated files in public/audio/comprehension/');
  console.log('2. Commit files to git');
  console.log('3. Update database with static URLs (or hardcode in TypeScript)');
  console.log('\n✅ Done!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

