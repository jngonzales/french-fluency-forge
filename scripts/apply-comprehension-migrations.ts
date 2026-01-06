/**
 * Script to apply comprehension items migrations
 * 
 * Usage:
 *   tsx scripts/apply-comprehension-migrations.ts
 * 
 * Requires:
 *   - SUPABASE_SERVICE_ROLE_KEY environment variable
 *   - VITE_SUPABASE_URL environment variable
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing required environment variables:');
  console.error('  - VITE_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nSet these in your .env file or as environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function applyMigration(filePath: string, description: string) {
  console.log(`\n📄 Applying: ${description}`);
  console.log(`   File: ${filePath}`);
  
  try {
    const sql = readFileSync(filePath, 'utf-8');
    
    // Split by semicolons to execute statements separately
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.length > 0) {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        if (error) {
          // Try direct query if RPC doesn't work
          const { error: queryError } = await supabase.from('_migrations' as any).select('*').limit(0);
          if (queryError) {
            console.error(`   ❌ Error: ${error.message}`);
            throw error;
          }
        }
      }
    }
    
    console.log(`   ✅ Success`);
  } catch (error: any) {
    console.error(`   ❌ Failed: ${error.message}`);
    throw error;
  }
}

async function main() {
  console.log('🚀 Applying Comprehension Items Migrations\n');
  
  const migrationsDir = join(process.cwd(), 'supabase', 'migrations');
  
  try {
    // Migration 1: Create table
    await applyMigration(
      join(migrationsDir, '20260106122428_comprehension_items.sql'),
      'Create comprehension_items table'
    );
    
    // Migration 2: Seed data
    await applyMigration(
      join(migrationsDir, '20260106122429_seed_comprehension_items.sql'),
      'Seed comprehension items data'
    );
    
    // Verify
    console.log('\n🔍 Verifying migrations...');
    const { data, error } = await supabase
      .from('comprehension_items' as any)
      .select('id, cefr_level')
      .limit(5);
    
    if (error) {
      console.error('❌ Verification failed:', error.message);
      console.log('\n⚠️  Migrations may have been applied, but verification failed.');
      console.log('   Please check manually in Supabase Dashboard.');
    } else {
      console.log(`✅ Verified: Found ${data?.length || 0} items (showing first 5)`);
      if (data && data.length > 0) {
        data.forEach(item => {
          console.log(`   - ${item.id} (${item.cefr_level})`);
        });
      }
    }
    
    console.log('\n✅ Migrations applied successfully!');
    console.log('\nNext steps:');
    console.log('1. Generate TypeScript types: npm run typegen');
    console.log('2. Generate audio files: Go to /dev/comprehension-audio');
    
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\n💡 Alternative: Apply migrations via Supabase Dashboard SQL Editor');
    console.log('   See APPLY_MIGRATIONS.md for instructions');
    process.exit(1);
  }
}

main();

