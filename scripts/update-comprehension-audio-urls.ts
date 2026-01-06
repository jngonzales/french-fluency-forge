/**
 * Update comprehension_items database with static audio URLs
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mjqykgcvfteihqmgeufb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qcXlrZ2N2ZnRlaWhxbWdldWZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MTM1ODMsImV4cCI6MjA4MjM4OTU4M30.d084bXB6DnyUry4JkdWh7_ff05SxeOfPonhCA75JwWw';

const supabase = createClient(supabaseUrl, supabaseKey);

const items = [
  'lc_fr_a1_0001',
  'lc_fr_a1_0002',
  'lc_fr_a2_0003',
  'lc_fr_a2_0004',
  'lc_fr_a2_0005',
  'lc_fr_a2_0006',
  'lc_fr_a2_0009',
  'lc_fr_b1_0007',
  'lc_fr_b1_0008',
  'lc_fr_b1_0010',
  'lc_fr_b2_0011',
  'lc_fr_b2_0012',
];

async function main() {
  console.log('🔄 Updating database with static audio URLs...\n');

  for (const id of items) {
    const audioUrl = `/audio/comprehension/${id}.mp3`;
    const { error } = await supabase
      .from('comprehension_items' as any)
      .update({ audio_url: audioUrl })
      .eq('id', id);

    if (error) {
      console.error(`❌ Failed ${id}:`, error.message);
    } else {
      console.log(`✅ Updated ${id} -> ${audioUrl}`);
    }
  }

  console.log('\n✅ Done!');
}

main().catch(console.error);

