/**
 * Pre-generate Phrase Explanations Script
 * 
 * This script pre-generates all phrase explanations (Meaning, Grammar, etc.)
 * and stores them in the phrase_explanations table.
 * 
 * Usage: npm run pregenerate:explanations
 * 
 * This saves OpenAI credits by generating all explanations once upfront.
 * Subsequent user clicks will use cached explanations from the database.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file manually
function loadEnv(): Record<string, string> {
  const envPath = path.resolve(__dirname, '..', '.env');
  const env: Record<string, string> = {};
  
  console.log(`Looking for .env at: ${envPath}`);
  
  try {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split(/\r?\n/).forEach(line => {
      if (!line.trim() || line.trim().startsWith('#')) return;
      
      const eqIndex = line.indexOf('=');
      if (eqIndex > 0) {
        const key = line.substring(0, eqIndex).trim();
        let value = line.substring(eqIndex + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        env[key] = value;
      }
    });
    console.log(`Loaded ${Object.keys(env).length} env variables`);
  } catch (e) {
    console.log('Failed to read .env file:', e);
  }
  
  return { ...env, ...process.env } as Record<string, string>;
}

const env = loadEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log(`SUPABASE_URL: ${SUPABASE_URL ? 'Set' : 'Missing'}`);
console.log(`SUPABASE_KEY: ${SUPABASE_KEY ? 'Set' : 'Missing'}`);

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY');
  process.exit(1);
}

// Check for --force flag to regenerate all explanations
const FORCE_REGENERATE = process.argv.includes('--force');

// Rate limiting: 1 second between requests to avoid overwhelming the Edge Function
const DELAY_BETWEEN_REQUESTS = 1000;

// Color output for terminal
const colors = {
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  blue: (s: string) => `\x1b[34m${s}\x1b[0m`,
  gray: (s: string) => `\x1b[90m${s}\x1b[0m`,
};

// Sleep function
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to generate deterministic UUID for a phrase number (must match mockPhrasesData.ts)
function getPhraseUUID(num: number): string {
  const paddedNum = String(num).padStart(12, '0');
  return `00000000-0000-4000-8001-${paddedNum}`;
}

// Check if explanation already exists in database
async function checkExplanationExists(phraseId: string): Promise<boolean> {
  if (FORCE_REGENERATE) return false;
  
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/phrase_explanations?phrase_id=eq.${phraseId}&select=phrase_id`,
      {
        headers: {
          'apikey': SUPABASE_KEY!,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      return data.length > 0;
    }
    return false;
  } catch {
    return false;
  }
}

// Generate explanation via Edge Function
async function generateExplanation(
  phraseId: string,
  frenchText: string,
  englishText?: string
): Promise<{ success: boolean; cached: boolean; error?: string }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/phrase-explain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY!,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        phraseId,
        forceRegenerate: FORCE_REGENERATE,
        // Pass phrase data for pre-generation (in case phrases aren't in DB)
        phraseData: {
          frenchText,
          englishText,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, cached: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    const data = await response.json();
    if (data.success) {
      return { success: true, cached: data.cached || false };
    }
    return { success: false, cached: false, error: data.error || 'Unknown error' };
  } catch (error) {
    return { success: false, cached: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// =====================
// PHRASES DATA - Only the 40 phrases used in UI (4 starter packs x 10 each)
// Matches: pack-001, pack-004, pack-005, pack-006
// =====================
const PHRASES_TO_EXPLAIN = [
  // Pack 1: Small talk starter (10 phrases)
  { id: getPhraseUUID(1), french: 'Comment ça va ?', english: 'How are you?' },
  { id: getPhraseUUID(2), french: 'Je vais bien, merci', english: "I'm doing well, thanks" },
  { id: getPhraseUUID(3), french: 'Comment tu t\'appelles ?', english: "What's your name?" },
  { id: getPhraseUUID(4), french: 'Enchanté', english: 'Nice to meet you' },
  { id: getPhraseUUID(5), french: 'D\'où viens-tu ?', english: 'Where are you from?' },
  { id: getPhraseUUID(6), french: 'Qu\'est-ce que tu fais dans la vie ?', english: 'What do you do for a living?' },
  { id: getPhraseUUID(7), french: 'Je travaille dans la tech', english: 'I work in tech' },
  { id: getPhraseUUID(8), french: 'Tu habites où ?', english: 'Where do you live?' },
  { id: getPhraseUUID(9), french: 'J\'habite à Paris', english: 'I live in Paris' },
  { id: getPhraseUUID(10), french: 'Tu parles anglais ?', english: 'Do you speak English?' },
  // Pack 4: School & Learning (10 phrases)
  { id: getPhraseUUID(41), french: 'Tu peux réexpliquer ?', english: 'Can you explain again?' },
  { id: getPhraseUUID(42), french: 'J\'ai une question', english: 'I have a question' },
  { id: getPhraseUUID(43), french: 'À quelle heure commence le cours ?', english: 'What time does class start?' },
  { id: getPhraseUUID(44), french: 'N\'oubliez pas vos devoirs', english: "Don't forget your homework" },
  { id: getPhraseUUID(45), french: 'Je dois réviser pour l\'examen', english: 'I need to study for the exam' },
  { id: getPhraseUUID(46), french: 'C\'est quoi les devoirs pour demain ?', english: "What's the homework for tomorrow?" },
  { id: getPhraseUUID(47), french: 'Le cours est annulé', english: 'Class is cancelled' },
  { id: getPhraseUUID(48), french: 'Je peux emprunter tes notes ?', english: 'Can I borrow your notes?' },
  { id: getPhraseUUID(49), french: 'J\'ai réussi l\'examen !', english: 'I passed the exam!' },
  { id: getPhraseUUID(50), french: 'La bibliothèque ferme à 20 heures', english: 'The library closes at 8pm' },
  // Pack 5: Workplace (10 phrases)
  { id: getPhraseUUID(51), french: 'Je travaille de chez moi aujourd\'hui', english: "I'm working from home today" },
  { id: getPhraseUUID(52), french: 'C\'est quand la réunion ?', english: 'When is the meeting?' },
  { id: getPhraseUUID(53), french: 'Je vous envoie le document par email', english: "I'll send you the document by email" },
  { id: getPhraseUUID(54), french: 'J\'ai une deadline vendredi', english: 'I have a deadline on Friday' },
  { id: getPhraseUUID(55), french: 'On peut décaler la réunion ?', english: 'Can we push back the meeting?' },
  { id: getPhraseUUID(56), french: 'Je prends ma pause déjeuner', english: "I'm taking my lunch break" },
  { id: getPhraseUUID(57), french: 'Je serai en vacances la semaine prochaine', english: "I'll be on vacation next week" },
  { id: getPhraseUUID(58), french: 'Qui s\'occupe de ce projet ?', english: "Who's handling this project?" },
  { id: getPhraseUUID(59), french: 'J\'ai besoin de plus de temps', english: 'I need more time' },
  { id: getPhraseUUID(60), french: 'L\'imprimante est en panne', english: 'The printer is broken' },
  // Pack 6: Daily Life (10 phrases)
  { id: getPhraseUUID(61), french: 'Quelle heure est-il ?', english: 'What time is it?' },
  { id: getPhraseUUID(62), french: 'Je dois faire les courses', english: 'I need to go grocery shopping' },
  { id: getPhraseUUID(63), french: 'Tu veux prendre un café ?', english: 'Want to grab a coffee?' },
  { id: getPhraseUUID(64), french: 'Je suis en retard', english: "I'm late" },
  { id: getPhraseUUID(65), french: 'On mange quoi ce soir ?', english: "What's for dinner tonight?" },
  { id: getPhraseUUID(66), french: 'Je vais prendre une douche', english: "I'm going to take a shower" },
  { id: getPhraseUUID(67), french: 'Tu as bien dormi ?', english: 'Did you sleep well?' },
  { id: getPhraseUUID(68), french: 'Je vais me coucher', english: "I'm going to bed" },
  { id: getPhraseUUID(69), french: 'Bonne journée !', english: 'Have a good day!' },
  { id: getPhraseUUID(70), french: 'À demain !', english: 'See you tomorrow!' },
];

// =====================
// MAIN SCRIPT
// =====================
async function main() {
  console.log('\n' + colors.blue('═══════════════════════════════════════════════════════════'));
  console.log(colors.blue('  📚 Phrase Explanations Pre-Generation Script'));
  console.log(colors.blue('  Rate limit: 1 request per second'));
  if (FORCE_REGENERATE) {
    console.log(colors.yellow('  ⚠️  FORCE MODE: Regenerating ALL explanations'));
  }
  console.log(colors.blue('═══════════════════════════════════════════════════════════') + '\n');

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  console.log(colors.yellow(`\n📚 PHRASES (${PHRASES_TO_EXPLAIN.length} items)\n`));
  
  for (let i = 0; i < PHRASES_TO_EXPLAIN.length; i++) {
    const phrase = PHRASES_TO_EXPLAIN[i];
    
    // Check if already cached
    const exists = await checkExplanationExists(phrase.id);
    if (exists) {
      console.log(colors.gray(`  [${i + 1}/${PHRASES_TO_EXPLAIN.length}] ⏭ Skipped (cached): ${phrase.french.substring(0, 40)}...`));
      skipped++;
      continue;
    }

    console.log(colors.blue(`  [${i + 1}/${PHRASES_TO_EXPLAIN.length}] 🔄 Generating: ${phrase.french.substring(0, 40)}...`));
    
    const result = await generateExplanation(phrase.id, phrase.french, phrase.english);
    
    if (result.success) {
      console.log(colors.green(`  [${i + 1}/${PHRASES_TO_EXPLAIN.length}] ✅ Generated: ${phrase.french.substring(0, 40)}...`));
      generated++;
    } else {
      console.log(colors.red(`  [${i + 1}/${PHRASES_TO_EXPLAIN.length}] ❌ Failed: ${result.error}`));
      failed++;
    }

    // Rate limiting delay
    if (i < PHRASES_TO_EXPLAIN.length - 1) {
      await sleep(DELAY_BETWEEN_REQUESTS);
    }
  }

  // Summary
  console.log('\n' + colors.blue('═══════════════════════════════════════════════════════════'));
  console.log(colors.blue('  📊 SUMMARY'));
  console.log(colors.blue('═══════════════════════════════════════════════════════════'));
  console.log(colors.green(`  ✅ Generated: ${generated}`));
  console.log(colors.gray(`  ⏭ Skipped (already cached): ${skipped}`));
  if (failed > 0) {
    console.log(colors.red(`  ❌ Failed: ${failed}`));
  }
  console.log(colors.blue('═══════════════════════════════════════════════════════════') + '\n');

  console.log('🎉 All explanations pre-generated! Users will get instant explanations.\n');
}

main().catch(console.error);