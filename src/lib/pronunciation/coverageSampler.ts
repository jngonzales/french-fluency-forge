/**
 * Coverage-Constrained Phrase Sampler
 * Selects phrases to guarantee 100% phoneme coverage
 */

import { seededSelect, seededShuffle } from '../random/seededShuffle';
import { parseIPA } from './ipaParser';
import { getAllPhonemes } from './phonemeInventory';

export interface PronunciationPhrase {
  id: string;
  group: string;
  text_fr: string;
  ipa: string;
  difficulty: number;
  phonemes?: string[]; // Auto-derived
}

export interface SamplingResult {
  phrases: PronunciationPhrase[];
  coverage: Set<string>;
  coveragePercent: number;
  missingPhonemes: string[];
  swapsMade: number;
}

/**
 * Select phrases with guaranteed 100% phoneme coverage
 * 
 * @param phrases - Full phrase bank
 * @param seed - Random seed for deterministic selection
 * @param quotas - How many phrases to select per group
 * @returns Selected phrases with coverage info
 */
export function selectPhrasesWithCoverage(
  phrases: PronunciationPhrase[],
  seed: number,
  quotas: Record<string, number> = {
    '2w': 2,
    '3-4w': 3,
    '4-5w': 3,
    '5-10w': 2,
  }
): SamplingResult {
  console.log('[Coverage Sampler] Starting selection with seed:', seed);
  
  // Ensure all phrases have phonemes derived
  const phrasesWithPhonemes = phrases.map(p => ({
    ...p,
    phonemes: p.phonemes || parseIPA(p.ipa),
  }));

  // Step 1: Sample per-group quotas (seeded)
  const selected: PronunciationPhrase[] = [];
  const remaining: Map<string, PronunciationPhrase[]> = new Map();

  for (const [group, quota] of Object.entries(quotas)) {
    const groupPhrases = phrasesWithPhonemes.filter(p => p.group === group);
    const sampled = seededSelect(groupPhrases, quota, seed + group.charCodeAt(0));
    selected.push(...sampled);
    
    // Store remaining phrases for swapping
    remaining.set(group, groupPhrases.filter(p => !sampled.includes(p)));
  }

  console.log('[Coverage Sampler] Initial selection:', selected.length, 'phrases');

  // Step 2: Extract phonemes from selection
  let coverage = extractPhonemes(selected);
  console.log('[Coverage Sampler] Initial coverage:', coverage.size, '/ 39 phonemes');

  // Step 3: Check for missing phonemes
  const targetPhonemes = getAllPhonemes();
  let missingPhonemes = Array.from(targetPhonemes).filter(p => !coverage.has(p));

  // Step 4: Greedy swap to achieve 100% coverage
  let swapsMade = 0;
  const maxIterations = 50;
  let iteration = 0;

  while (missingPhonemes.length > 0 && iteration < maxIterations) {
    iteration++;
    console.log(`[Coverage Sampler] Iteration ${iteration}: Missing ${missingPhonemes.length} phonemes`);

    const swapped = greedySwap(selected, remaining, missingPhonemes);
    
    if (!swapped) {
      console.warn('[Coverage Sampler] Could not find swap to improve coverage');
      break;
    }

    swapsMade++;
    coverage = extractPhonemes(selected);
    missingPhonemes = Array.from(targetPhonemes).filter(p => !coverage.has(p));
  }

  const coveragePercent = Math.round((coverage.size / targetPhonemes.size) * 100);

  console.log('[Coverage Sampler] Final coverage:', coverage.size, '/', targetPhonemes.size, `(${coveragePercent}%)`);
  console.log('[Coverage Sampler] Swaps made:', swapsMade);
  
  if (missingPhonemes.length > 0) {
    console.warn('[Coverage Sampler] Missing phonemes:', missingPhonemes);
  }

  return {
    phrases: selected,
    coverage,
    coveragePercent,
    missingPhonemes,
    swapsMade,
  };
}

/**
 * Extract all unique phonemes from selected phrases
 */
function extractPhonemes(phrases: PronunciationPhrase[]): Set<string> {
  const phonemes = new Set<string>();
  for (const phrase of phrases) {
    const phrasePhonemes = phrase.phonemes || parseIPA(phrase.ipa);
    phrasePhonemes.forEach(p => phonemes.add(p));
  }
  return phonemes;
}

/**
 * Greedy swap algorithm to maximize coverage
 * Finds a phrase to swap that covers missing phonemes
 * 
 * @returns true if a swap was made, false if no improvement possible
 */
function greedySwap(
  selected: PronunciationPhrase[],
  remaining: Map<string, PronunciationPhrase[]>,
  missingPhonemes: string[]
): boolean {
  let bestSwap: {
    removeIndex: number;
    addPhrase: PronunciationPhrase;
    coverageGain: number;
  } | null = null;

  // Try swapping each selected phrase
  for (let i = 0; i < selected.length; i++) {
    const current = selected[i];
    const group = current.group;
    const candidatesInGroup = remaining.get(group) || [];

    // Try each candidate from the same group
    for (const candidate of candidatesInGroup) {
      const candidatePhonemes = candidate.phonemes || parseIPA(candidate.ipa);
      
      // How many missing phonemes does this candidate cover?
      const coverageGain = missingPhonemes.filter(p => 
        candidatePhonemes.includes(p)
      ).length;

      if (coverageGain > 0) {
        if (!bestSwap || coverageGain > bestSwap.coverageGain) {
          bestSwap = {
            removeIndex: i,
            addPhrase: candidate,
            coverageGain,
          };
        }
      }
    }
  }

  // Execute best swap if found
  if (bestSwap) {
    const removed = selected[bestSwap.removeIndex];
    selected[bestSwap.removeIndex] = bestSwap.addPhrase;
    
    // Update remaining lists
    const group = bestSwap.addPhrase.group;
    const remainingInGroup = remaining.get(group) || [];
    remaining.set(group, [
      ...remainingInGroup.filter(p => p.id !== bestSwap.addPhrase.id),
      removed,
    ]);

    console.log(`[Coverage Sampler] Swapped ${removed.id} → ${bestSwap.addPhrase.id} (gain: ${bestSwap.coverageGain})`);
    return true;
  }

  return false;
}

/**
 * Validate that phrases achieve 100% coverage
 */
export function validateFullCoverage(phrases: PronunciationPhrase[]): boolean {
  const coverage = extractPhonemes(phrases);
  const target = getAllPhonemes();
  return coverage.size === target.size;
}

/**
 * Get missing phonemes from a selection
 */
export function getMissingPhonemes(phrases: PronunciationPhrase[]): string[] {
  const coverage = extractPhonemes(phrases);
  const target = getAllPhonemes();
  return Array.from(target).filter(p => !coverage.has(p));
}

/**
 * Analyze coverage of phrase bank
 */
export function analyzePhraseBank(phrases: PronunciationPhrase[]): {
  totalPhrases: number;
  coveragePercent: number;
  covered: Set<string>;
  notCovered: string[];
} {
  const covered = extractPhonemes(phrases);
  const target = getAllPhonemes();
  const notCovered = Array.from(target).filter(p => !covered.has(p));
  const coveragePercent = Math.round((covered.size / target.size) * 100);

  return {
    totalPhrases: phrases.length,
    coveragePercent,
    covered,
    notCovered,
  };
}

