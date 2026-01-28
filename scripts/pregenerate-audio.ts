/**
 * Pre-generate TTS Audio Script
 * 
 * This script pre-generates all TTS audio and stores it in Supabase Storage.
 * Run this once to cache all audio - future users get instant playback!
 * 
 * Usage: npm run pregenerate:audio
 * 
 * Rate limiting: 1 request per 2 seconds to stay within ElevenLabs free tier limits
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file manually
function loadEnv(): Record<string, string> {
  // Go up one level from scripts/ to project root
  const envPath = path.resolve(__dirname, '..', '.env');
  const env: Record<string, string> = {};
  
  console.log(`Looking for .env at: ${envPath}`);
  
  try {
    const content = fs.readFileSync(envPath, 'utf-8');
    // Handle both Windows (\r\n) and Unix (\n) line endings
    content.split(/\r?\n/).forEach(line => {
      // Skip empty lines and comments
      if (!line.trim() || line.trim().startsWith('#')) return;
      
      const eqIndex = line.indexOf('=');
      if (eqIndex > 0) {
        const key = line.substring(0, eqIndex).trim();
        let value = line.substring(eqIndex + 1).trim();
        // Remove quotes
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        env[key] = value;
      }
    });
    console.log(`Loaded ${Object.keys(env).length} env variables`);
    console.log(`Keys found: ${Object.keys(env).join(', ')}`);
  } catch (e) {
    console.log('Failed to read .env file:', e);
  }
  
  // Merge with process.env (process.env takes precedence)
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

// Check for --force flag to regenerate all audio
const FORCE_REGENERATE = process.argv.includes('--force');

// Rate limiting: 2 seconds between requests (ElevenLabs free tier)
const DELAY_BETWEEN_REQUESTS = 2000;

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

// Check if audio already exists in storage
async function checkStorageExists(cacheKey: string, bucketName: string): Promise<boolean> {
  if (FORCE_REGENERATE) return false;  // Force regeneration skips cache check
  const storageUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucketName}/${cacheKey}.mp3`;
  try {
    const response = await fetch(storageUrl, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

// Generate and cache audio via TTS Edge Function
async function generateAudio(
  text: string,
  cacheKey: string,
  bucketName: string,
  options: { speed?: number; stability?: number } = {}
): Promise<{ success: boolean; cached: boolean; url?: string; error?: string }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/french-tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY!,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        text,
        speed: options.speed ?? 0.9,
        stability: options.stability ?? 0.5,
        cacheKey,
        bucketName,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, cached: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const data = await response.json();
      if (data.cachedUrl) {
        return { success: true, cached: data.cached, url: data.cachedUrl };
      }
      if (data.error) {
        return { success: false, cached: false, error: data.error };
      }
    }

    // Raw audio was returned (and hopefully cached on the server)
    return { success: true, cached: false, url: `${SUPABASE_URL}/storage/v1/object/public/${bucketName}/${cacheKey}.mp3` };
  } catch (error) {
    return { success: false, cached: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// =====================
// PHRASES DATA (from mockPhrasesData.ts - EXACT MATCH)
// Each phrase needs either canonical_fr (for recall) or transcript_fr (for recognition)
// =====================
function getPhraseUUID(num: number): string {
  const paddedNum = String(num).padStart(12, '0');
  return `00000000-0000-4000-8001-${paddedNum}`;
}

// EXACT phrases from mockPhrasesData.ts
const PHRASES_TO_GENERATE = [
  // Pack 1: Small talk starter (15 phrases)
  { id: getPhraseUUID(1), text: 'Comment ça va ?' },  // canonical_fr
  { id: getPhraseUUID(2), text: 'Je vais bien, merci' },  // canonical_fr
  { id: getPhraseUUID(3), text: 'Comment tu t\'appelles ?' },  // canonical_fr
  { id: getPhraseUUID(4), text: 'Enchanté' },  // canonical_fr
  { id: getPhraseUUID(5), text: 'D\'où viens-tu ?' },  // canonical_fr
  { id: getPhraseUUID(6), text: 'Qu\'est-ce que tu fais dans la vie ?' },  // transcript_fr (recognition)
  { id: getPhraseUUID(7), text: 'Je travaille dans la tech' },  // canonical_fr
  { id: getPhraseUUID(8), text: 'Tu habites où ?' },  // transcript_fr (recognition)
  { id: getPhraseUUID(9), text: 'J\'habite à Paris' },  // canonical_fr
  { id: getPhraseUUID(10), text: 'Tu parles anglais ?' },  // canonical_fr - FIXED!
  { id: getPhraseUUID(11), text: 'Je parle un peu français' },  // transcript_fr (recognition) - FIXED!
  { id: getPhraseUUID(12), text: 'Qu\'est-ce que tu aimes faire ?' },  // canonical_fr - FIXED!
  { id: getPhraseUUID(13), text: 'J\'aime lire' },  // canonical_fr - FIXED!
  { id: getPhraseUUID(14), text: 'Quel temps fait-il aujourd\'hui ?' },  // transcript_fr (recognition) - FIXED!
  { id: getPhraseUUID(15), text: 'Il fait beau' },  // canonical_fr - FIXED!
  // Pack 2: Work + logistics (13 phrases)
  { id: getPhraseUUID(16), text: 'J\'ai une réunion à 15h' },  // canonical_fr - FIXED!
  { id: getPhraseUUID(17), text: 'On peut reporter à demain ?' },  // transcript_fr (recognition) - FIXED!
  { id: getPhraseUUID(18), text: 'Je dois finir ça avant vendredi' },  // canonical_fr - FIXED!
  { id: getPhraseUUID(19), text: 'Tu peux m\'envoyer le fichier ?' },  // canonical_fr - FIXED!
  { id: getPhraseUUID(20), text: 'Je te l\'envoie tout de suite' },  // transcript_fr (recognition) - FIXED!
  { id: getPhraseUUID(21), text: 'Où est la station de métro la plus proche ?' },  // canonical_fr - FIXED!
  { id: getPhraseUUID(22), text: 'Ça coûte combien ?' },  // canonical_fr - FIXED!
  { id: getPhraseUUID(23), text: 'C\'est vingt euros' },  // transcript_fr (recognition) - FIXED!
  { id: getPhraseUUID(24), text: 'Je voudrais réserver une table' },  // canonical_fr - FIXED!
  { id: getPhraseUUID(25), text: 'Pour combien de personnes ?' },  // canonical_fr - FIXED!
  { id: getPhraseUUID(26), text: 'Vous acceptez les cartes de crédit ?' },  // transcript_fr (recognition) - FIXED!
  { id: getPhraseUUID(27), text: 'Où sont les toilettes ?' },  // canonical_fr - FIXED!
  { id: getPhraseUUID(28), text: 'L\'addition, s\'il vous plaît' },  // canonical_fr - FIXED!
  // Pack 3: Emotional reactions (12 phrases)
  { id: getPhraseUUID(29), text: 'Je suis tellement content !' },  // canonical_fr - FIXED!
  { id: getPhraseUUID(30), text: 'C\'est génial !' },  // transcript_fr (recognition)
  { id: getPhraseUUID(31), text: 'Je suis frustré' },  // canonical_fr - FIXED!
  { id: getPhraseUUID(32), text: 'Ça me rend triste' },  // canonical_fr - FIXED!
  { id: getPhraseUUID(33), text: 'Je suis désolé' },  // transcript_fr (recognition) - FIXED!
  { id: getPhraseUUID(34), text: 'T\'inquiète pas' },  // canonical_fr - FIXED!
  { id: getPhraseUUID(35), text: 'Je suis super excité' },  // canonical_fr - FIXED!
  { id: getPhraseUUID(36), text: 'Ça m\'énerve !' },  // transcript_fr (recognition) - FIXED!
  { id: getPhraseUUID(37), text: 'Je suis confus' },  // canonical_fr - FIXED!
  { id: getPhraseUUID(38), text: 'C\'est incroyable !' },  // canonical_fr - FIXED!
  { id: getPhraseUUID(39), text: 'Je m\'en fiche' },  // transcript_fr (recognition) - FIXED!
  { id: getPhraseUUID(40), text: 'Je me sens mieux maintenant' },  // canonical_fr - FIXED!
  // Pack 4: School & Learning (10 phrases)
  { id: getPhraseUUID(41), text: 'Tu peux réexpliquer ?' },  // canonical_fr - FIXED!
  { id: getPhraseUUID(42), text: 'J\'ai une question' },  // canonical_fr - FIXED!
  { id: getPhraseUUID(43), text: 'À quelle heure commence le cours ?' },  // canonical_fr - FIXED!
  { id: getPhraseUUID(44), text: 'N\'oubliez pas vos devoirs' },  // transcript_fr (recognition) - FIXED!
  { id: getPhraseUUID(45), text: 'Je dois réviser pour l\'examen' },  // canonical_fr - FIXED!
  { id: getPhraseUUID(46), text: 'C\'est quoi les devoirs pour demain ?' },  // canonical_fr - FIXED!
  { id: getPhraseUUID(47), text: 'Le cours est annulé' },  // transcript_fr (recognition) - FIXED!
  { id: getPhraseUUID(48), text: 'Je peux emprunter tes notes ?' },  // canonical_fr - FIXED!
  { id: getPhraseUUID(49), text: 'J\'ai réussi l\'examen !' },  // canonical_fr - FIXED!
  { id: getPhraseUUID(50), text: 'La bibliothèque ferme à 20 heures' },  // canonical_fr - FIXED!
  // Pack 5: Workplace (10 phrases)
  { id: getPhraseUUID(51), text: 'Je travaille de chez moi aujourd\'hui' },  // canonical_fr - FIXED!
  { id: getPhraseUUID(52), text: 'C\'est quand la réunion ?' },  // canonical_fr - FIXED!
  { id: getPhraseUUID(53), text: 'Je vous envoie le document par email' },  // transcript_fr (recognition) - FIXED!
  { id: getPhraseUUID(54), text: 'J\'ai une deadline vendredi' },  // canonical_fr - FIXED!
  { id: getPhraseUUID(55), text: 'On peut décaler la réunion ?' },  // canonical_fr - FIXED!
  { id: getPhraseUUID(56), text: 'Je prends ma pause déjeuner' },  // transcript_fr (recognition) - FIXED!
  { id: getPhraseUUID(57), text: 'Je serai en vacances la semaine prochaine' },  // canonical_fr - FIXED!
  { id: getPhraseUUID(58), text: 'Qui s\'occupe de ce projet ?' },  // canonical_fr - FIXED!
  { id: getPhraseUUID(59), text: 'J\'ai besoin de plus de temps' },  // canonical_fr - FIXED!
  { id: getPhraseUUID(60), text: 'L\'imprimante est en panne' },  // canonical_fr - FIXED!
  // Pack 6: Daily Life (10 phrases)
  { id: getPhraseUUID(61), text: 'Quelle heure est-il ?' },  // canonical_fr - FIXED!
  { id: getPhraseUUID(62), text: 'Je dois faire les courses' },  // canonical_fr - FIXED!
  { id: getPhraseUUID(63), text: 'Tu veux prendre un café ?' },  // transcript_fr (recognition) - FIXED!
  { id: getPhraseUUID(64), text: 'Je suis en retard' },  // canonical_fr - FIXED!
  { id: getPhraseUUID(65), text: 'On mange quoi ce soir ?' },  // canonical_fr - FIXED!
  { id: getPhraseUUID(66), text: 'Je vais prendre une douche' },  // transcript_fr (recognition) - FIXED!
  { id: getPhraseUUID(67), text: 'Tu as bien dormi ?' },  // canonical_fr - FIXED!
  { id: getPhraseUUID(68), text: 'Je vais me coucher' },  // canonical_fr - FIXED!
  { id: getPhraseUUID(69), text: 'Bonne journée !' },  // canonical_fr
  { id: getPhraseUUID(70), text: 'À demain !' },  // canonical_fr - FIXED!
];

// =====================
// PRONUNCIATION DATA
// =====================
const PRONUNCIATION_ITEMS = [
  // Repeat items (TTS needed)
  { id: 'repeat/pronE-1', text: 'Je suis sous le pont, puis je passe dessus.' },
  { id: 'repeat/pronE-2', text: 'Je fais des pâtes, et le chat a mal à la patte.' },
  { id: 'repeat/pronE-3', text: 'Je cherche mon chien, mais je n\'entends rien.' },
  // Minimal pair items (TTS needed for target words)
  { id: 'minimalPairs/pronMP-1', text: 'tu' },
  { id: 'minimalPairs/pronMP-2', text: 'rue' },
  { id: 'minimalPairs/pronMP-3', text: 'vin' },
  { id: 'minimalPairs/pronMP-4', text: 'brun' },
  { id: 'minimalPairs/pronMP-5', text: 'poisson' },
  { id: 'minimalPairs/pronMP-6', text: 'pose' },
  { id: 'minimalPairs/pronMP-7', text: 'dessous' },
  { id: 'minimalPairs/pronMP-8', text: 'sur' },
  { id: 'minimalPairs/pronMP-9', text: 'rire' },
  { id: 'minimalPairs/pronMP-10', text: 'pâte' },
  { id: 'minimalPairs/pronMP-11', text: 'bon' },
  { id: 'minimalPairs/pronMP-12', text: 'chère' },
];

// =====================
// COMPREHENSION DATA - FETCH FROM DATABASE
// These are fetched dynamically since they're stored in Supabase
// =====================
async function fetchComprehensionItems(): Promise<Array<{ id: string; text: string }>> {
  try {
    console.log(colors.gray('  Fetching comprehension items from database...'));
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/comprehension_items?select=id,transcript_fr&order=id`,
      {
        headers: {
          'apikey': SUPABASE_KEY!,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    
    if (!response.ok) {
      console.log(colors.yellow('  Warning: Could not fetch comprehension items from database'));
      return [];
    }
    
    const items = await response.json() as Array<{ id: string; transcript_fr: string }>;
    
    // Filter to just the 6 assessment items (2 A1, 2 A2, 1 B1, 1 B2)
    const assessmentIds = [
      'lc_fr_a1_0001', 'lc_fr_a1_0002',  // 2 A1 items
      'lc_fr_a2_0003', 'lc_fr_a2_0004',  // 2 A2 items
      'lc_fr_b1_0007',                    // 1 B1 item
      'lc_fr_b2_0011'                     // 1 B2 item
    ];
    
    const assessmentItems = items
      .filter(item => assessmentIds.includes(item.id))
      .map(item => ({
        id: item.id,
        text: item.transcript_fr
      }));
    
    console.log(colors.gray(`  Found ${assessmentItems.length} assessment comprehension items`));
    return assessmentItems;
  } catch (error) {
    console.log(colors.yellow(`  Warning: Error fetching comprehension items: ${error}`));
    return [];
  }
}

// =====================
// MAIN SCRIPT
// =====================
async function main() {
  console.log('\n' + colors.blue('═══════════════════════════════════════════════════════════'));
  console.log(colors.blue('  📢 TTS Audio Pre-Generation Script'));
  console.log(colors.blue('  Rate limit: 1 request per 2 seconds (ElevenLabs free tier)'));
  if (FORCE_REGENERATE) {
    console.log(colors.yellow('  ⚠️  FORCE MODE: Regenerating ALL audio (overwriting cache)'));
  }
  console.log(colors.blue('═══════════════════════════════════════════════════════════') + '\n');

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  // 1. Generate Phrases Audio
  console.log(colors.yellow('\n📚 PHRASES (70 items)\n'));
  
  for (let i = 0; i < PHRASES_TO_GENERATE.length; i++) {
    const phrase = PHRASES_TO_GENERATE[i];
    const cacheKey = `phrases/${phrase.id}`;
    
    // Check if already cached
    const exists = await checkStorageExists(cacheKey, 'phrases-audio');
    if (exists) {
      console.log(colors.gray(`  [${i + 1}/${PHRASES_TO_GENERATE.length}] ⏭ Skipped (cached): ${phrase.text.substring(0, 40)}...`));
      skipped++;
      continue;
    }

    console.log(colors.blue(`  [${i + 1}/${PHRASES_TO_GENERATE.length}] 🔄 Generating: ${phrase.text.substring(0, 40)}...`));
    
    const result = await generateAudio(phrase.text, cacheKey, 'phrases-audio');
    
    if (result.success) {
      console.log(colors.green(`  [${i + 1}/${PHRASES_TO_GENERATE.length}] ✅ Generated: ${phrase.text.substring(0, 40)}...`));
      generated++;
    } else {
      console.log(colors.red(`  [${i + 1}/${PHRASES_TO_GENERATE.length}] ❌ Failed: ${result.error}`));
      failed++;
    }

    // Rate limiting delay
    if (i < PHRASES_TO_GENERATE.length - 1) {
      await sleep(DELAY_BETWEEN_REQUESTS);
    }
  }

  // 2. Generate Pronunciation Audio
  console.log(colors.yellow('\n🎤 PRONUNCIATION (15 items)\n'));
  
  for (let i = 0; i < PRONUNCIATION_ITEMS.length; i++) {
    const item = PRONUNCIATION_ITEMS[i];
    const cacheKey = `pronunciation/${item.id}`;
    
    const exists = await checkStorageExists(cacheKey, 'phrases-audio');
    if (exists) {
      console.log(colors.gray(`  [${i + 1}/${PRONUNCIATION_ITEMS.length}] ⏭ Skipped (cached): ${item.text.substring(0, 40)}...`));
      skipped++;
      continue;
    }

    console.log(colors.blue(`  [${i + 1}/${PRONUNCIATION_ITEMS.length}] 🔄 Generating: ${item.text.substring(0, 40)}...`));
    
    const result = await generateAudio(item.text, cacheKey, 'phrases-audio');
    
    if (result.success) {
      console.log(colors.green(`  [${i + 1}/${PRONUNCIATION_ITEMS.length}] ✅ Generated: ${item.text.substring(0, 40)}...`));
      generated++;
    } else {
      console.log(colors.red(`  [${i + 1}/${PRONUNCIATION_ITEMS.length}] ❌ Failed: ${result.error}`));
      failed++;
    }

    if (i < PRONUNCIATION_ITEMS.length - 1) {
      await sleep(DELAY_BETWEEN_REQUESTS);
    }
  }

  // 3. Generate Comprehension Audio (fetched from database)
  const COMPREHENSION_ITEMS = await fetchComprehensionItems();
  console.log(colors.yellow(`\n👂 COMPREHENSION (${COMPREHENSION_ITEMS.length} items)\n`));
  
  for (let i = 0; i < COMPREHENSION_ITEMS.length; i++) {
    const item = COMPREHENSION_ITEMS[i];
    const cacheKey = `comprehension/${item.id}`;
    
    const exists = await checkStorageExists(cacheKey, 'comprehension-audio');
    if (exists) {
      console.log(colors.gray(`  [${i + 1}/${COMPREHENSION_ITEMS.length}] ⏭ Skipped (cached): ${item.text.substring(0, 40)}...`));
      skipped++;
      continue;
    }

    console.log(colors.blue(`  [${i + 1}/${COMPREHENSION_ITEMS.length}] 🔄 Generating: ${item.text.substring(0, 40)}...`));
    
    // Slower speed and more natural variation for comprehension
    const result = await generateAudio(item.text, cacheKey, 'comprehension-audio', {
      speed: 0.9,
      stability: 0.35,
    });
    
    if (result.success) {
      console.log(colors.green(`  [${i + 1}/${COMPREHENSION_ITEMS.length}] ✅ Generated: ${item.text.substring(0, 40)}...`));
      generated++;
    } else {
      console.log(colors.red(`  [${i + 1}/${COMPREHENSION_ITEMS.length}] ❌ Failed: ${result.error}`));
      failed++;
    }

    if (i < COMPREHENSION_ITEMS.length - 1) {
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

  if (failed > 0) {
    console.log(colors.yellow('⚠️  Some items failed. Run the script again to retry.\n'));
    process.exit(1);
  } else {
    console.log(colors.green('🎉 All audio pre-generated! Users will get instant playback.\n'));
  }
}

main().catch(console.error);
