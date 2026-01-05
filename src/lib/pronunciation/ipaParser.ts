/**
 * IPA Parser
 * Extracts phonemes from IPA notation strings
 */

/**
 * Parse IPA string and extract individual phonemes
 * 
 * Handles:
 * - Slashes: /œ̃ ʃa/ → ["œ̃", "ʃ", "a"]
 * - Liaison markers: /le z‿ami/ → ["l", "e", "z", "a", "m", "i"]
 * - Optional schwas: /mɛ̃t(ə)nɑ̃/ → ["m", "ɛ̃", "t", "ə", "n", "ɑ̃"]
 * - Diacritics: /ɛ̃/ treated as single phoneme
 * - Spaces (ignored)
 */
export function parseIPA(ipa: string): string[] {
  // Remove leading/trailing slashes
  let cleaned = ipa.replace(/^\/|\/$/g, '').trim();
  
  // Remove liaison marker
  cleaned = cleaned.replace(/‿/g, '');
  
  // Remove optional markers (parentheses)
  cleaned = cleaned.replace(/[()]/g, '');
  
  // Remove spaces
  cleaned = cleaned.replace(/\s+/g, '');
  
  // Tokenize into phonemes
  const phonemes: string[] = [];
  let i = 0;
  
  while (i < cleaned.length) {
    // Check for multi-character phonemes (with diacritics)
    // Nasal vowels: ɛ̃ ɔ̃ ɑ̃ œ̃
    if (i + 1 < cleaned.length && cleaned[i + 1] === '\u0303') { // combining tilde
      phonemes.push(cleaned[i] + cleaned[i + 1]);
      i += 2;
    }
    // Two-character phonemes (digraphs)
    else if (i + 1 < cleaned.length) {
      const twoChar = cleaned.substring(i, i + 2);
      // Check common two-character IPA symbols
      if (['ʃ', 'ʒ', 'ɲ', 'ŋ'].includes(twoChar[0]) && twoChar[1] !== ' ') {
        phonemes.push(twoChar[0]);
        i++;
      } else {
        phonemes.push(cleaned[i]);
        i++;
      }
    }
    // Single character phoneme
    else {
      phonemes.push(cleaned[i]);
      i++;
    }
  }
  
  return phonemes.filter(p => p && p.trim());
}

/**
 * Get unique phonemes from IPA string
 */
export function getUniquePhonemes(ipa: string): Set<string> {
  const phonemes = parseIPA(ipa);
  return new Set(phonemes);
}

/**
 * Get unique phonemes from multiple IPA strings
 */
export function getUniquePhonemesFromPhrases(ipas: string[]): Set<string> {
  const allPhonemes = new Set<string>();
  for (const ipa of ipas) {
    const phonemes = parseIPA(ipa);
    phonemes.forEach(p => allPhonemes.add(p));
  }
  return allPhonemes;
}

/**
 * Validate IPA string format
 */
export function validateIPA(ipa: string): boolean {
  // Should start and end with slashes (optional)
  // Should contain only valid IPA characters
  const validIPA = /^\/?.+\/?$/;
  return validIPA.test(ipa);
}

/**
 * Count phonemes in IPA string
 */
export function countPhonemes(ipa: string): number {
  return parseIPA(ipa).length;
}

/**
 * Extract target phonemes (for display/teaching)
 * Returns most important/rare phonemes in the phrase
 */
export function getTargetPhonemes(ipa: string, limit: number = 3): string[] {
  const phonemes = parseIPA(ipa);
  const unique = Array.from(new Set(phonemes));
  
  // Prioritize difficult phonemes
  const difficultPhonemes = ['ʁ', 'œ̃', 'ɥ', 'ø', 'œ', 'ɲ', 'ŋ'];
  const targets = unique.filter(p => difficultPhonemes.includes(p));
  
  // Add other unique phonemes if needed
  unique.forEach(p => {
    if (targets.length < limit && !targets.includes(p)) {
      targets.push(p);
    }
  });
  
  return targets.slice(0, limit);
}

