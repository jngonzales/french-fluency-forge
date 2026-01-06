/**
 * Check available storage buckets
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mjqykgcvfteihqmgeufb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qcXlrZ2N2ZnRlaWhxbWdldWZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MTM1ODMsImV4cCI6MjA4MjM4OTU4M30.d084bXB6DnyUry4JkdWh7_ff05SxeOfPonhCA75JwWw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Checking storage buckets...\n');
  
  const { data: buckets, error } = await supabase.storage.listBuckets();
  
  if (error) {
    console.error('Error listing buckets:', error);
    return;
  }
  
  if (!buckets || buckets.length === 0) {
    console.log('No buckets found. You need to create a bucket.');
  } else {
    console.log(`Found ${buckets.length} bucket(s):\n`);
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (public: ${bucket.public})`);
    });
  }
}

main();

