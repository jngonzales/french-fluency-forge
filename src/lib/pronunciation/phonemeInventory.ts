/**
 * French Phoneme Inventory
 * Master list of all French phonemes (39 total)
 */

export interface PhonemeInfo {
  phoneme: string; // IPA symbol
  category: 'oral_vowel' | 'nasal_vowel' | 'semivowel' | 'consonant';
  description: string;
  exampleWords: string[];
  difficulty: 1 | 2 | 3 | 4 | 5; // 1=easy, 5=very hard for English speakers
  commonMistakes?: string[];
}

/**
 * Complete French phoneme inventory (39 phonemes)
 */
export const FRENCH_PHONEMES: PhonemeInfo[] = [
  // ORAL VOWELS (11)
  { phoneme: 'i', category: 'oral_vowel', description: 'High front unrounded', exampleWords: ['lit', 'vie', 'si'], difficulty: 1 },
  { phoneme: 'y', category: 'oral_vowel', description: 'High front rounded', exampleWords: ['tu', 'rue', 'vue'], difficulty: 4, commonMistakes: ['Confusing with /u/'] },
  { phoneme: 'u', category: 'oral_vowel', description: 'High back rounded', exampleWords: ['tout', 'vous', 'roue'], difficulty: 2, commonMistakes: ['Confusing with /y/'] },
  { phoneme: 'e', category: 'oral_vowel', description: 'Mid front unrounded (closed)', exampleWords: ['été', 'les', 'chez'], difficulty: 2 },
  { phoneme: 'ø', category: 'oral_vowel', description: 'Mid front rounded (closed)', exampleWords: ['peu', 'deux', 'feu'], difficulty: 4 },
  { phoneme: 'o', category: 'oral_vowel', description: 'Mid back rounded (closed)', exampleWords: ['eau', 'beau', 'tôt'], difficulty: 2 },
  { phoneme: 'ɛ', category: 'oral_vowel', description: 'Mid front unrounded (open)', exampleWords: ['père', 'mère', 'mais'], difficulty: 2 },
  { phoneme: 'œ', category: 'oral_vowel', description: 'Mid front rounded (open)', exampleWords: ['peur', 'sœur', 'fleur'], difficulty: 4, commonMistakes: ['Confusing with /ø/'] },
  { phoneme: 'ɔ', category: 'oral_vowel', description: 'Mid back rounded (open)', exampleWords: ['mort', 'porte', 'sort'], difficulty: 2 },
  { phoneme: 'a', category: 'oral_vowel', description: 'Low front unrounded', exampleWords: ['chat', 'la', 'ma'], difficulty: 1 },
  { phoneme: 'ə', category: 'oral_vowel', description: 'Schwa (mid central)', exampleWords: ['le', 'je', 'ce'], difficulty: 2 },

  // NASAL VOWELS (4)
  { phoneme: 'ɛ̃', category: 'nasal_vowel', description: 'Nasal mid front', exampleWords: ['vin', 'pain', 'bien'], difficulty: 4, commonMistakes: ['Not nasalizing', 'Confusing with /ɑ̃/'] },
  { phoneme: 'ɑ̃', category: 'nasal_vowel', description: 'Nasal low back', exampleWords: ['sans', 'temps', 'banc'], difficulty: 4, commonMistakes: ['Not nasalizing', 'Confusing with /ɔ̃/'] },
  { phoneme: 'ɔ̃', category: 'nasal_vowel', description: 'Nasal mid back', exampleWords: ['bon', 'mon', 'son'], difficulty: 4, commonMistakes: ['Not nasalizing'] },
  { phoneme: 'œ̃', category: 'nasal_vowel', description: 'Nasal mid front rounded', exampleWords: ['un', 'brun', 'parfum'], difficulty: 5, commonMistakes: ['Often merged with /ɛ̃/ by speakers'] },

  // SEMIVOWELS (3)
  { phoneme: 'j', category: 'semivowel', description: 'Palatal approximant', exampleWords: ['hier', 'pied', 'yeux'], difficulty: 2 },
  { phoneme: 'ɥ', category: 'semivowel', description: 'Labial-palatal approximant', exampleWords: ['huit', 'nuit', 'lui'], difficulty: 4 },
  { phoneme: 'w', category: 'semivowel', description: 'Labial-velar approximant', exampleWords: ['oui', 'moi', 'voiture'], difficulty: 2 },

  // CONSONANTS (21)
  { phoneme: 'p', category: 'consonant', description: 'Voiceless bilabial plosive', exampleWords: ['papa', 'pas', 'pont'], difficulty: 1 },
  { phoneme: 'b', category: 'consonant', description: 'Voiced bilabial plosive', exampleWords: ['bon', 'beau', 'boire'], difficulty: 1 },
  { phoneme: 't', category: 'consonant', description: 'Voiceless alveolar plosive', exampleWords: ['tu', 'tout', 'temps'], difficulty: 1 },
  { phoneme: 'd', category: 'consonant', description: 'Voiced alveolar plosive', exampleWords: ['dans', 'de', 'deux'], difficulty: 1 },
  { phoneme: 'k', category: 'consonant', description: 'Voiceless velar plosive', exampleWords: ['qui', 'coup', 'café'], difficulty: 1 },
  { phoneme: 'g', category: 'consonant', description: 'Voiced velar plosive', exampleWords: ['grand', 'gare', 'gâteau'], difficulty: 1 },
  { phoneme: 'f', category: 'consonant', description: 'Voiceless labiodental fricative', exampleWords: ['feu', 'faire', 'fille'], difficulty: 1 },
  { phoneme: 'v', category: 'consonant', description: 'Voiced labiodental fricative', exampleWords: ['vous', 'voir', 'ville'], difficulty: 1 },
  { phoneme: 's', category: 'consonant', description: 'Voiceless alveolar fricative', exampleWords: ['sans', 'saison', 'poisson'], difficulty: 1 },
  { phoneme: 'z', category: 'consonant', description: 'Voiced alveolar fricative', exampleWords: ['zéro', 'maison', 'poison'], difficulty: 2 },
  { phoneme: 'ʃ', category: 'consonant', description: 'Voiceless postalveolar fricative', exampleWords: ['chat', 'chaud', 'chercher'], difficulty: 2 },
  { phoneme: 'ʒ', category: 'consonant', description: 'Voiced postalveolar fricative', exampleWords: ['je', 'jour', 'garage'], difficulty: 2 },
  { phoneme: 'm', category: 'consonant', description: 'Bilabial nasal', exampleWords: ['mon', 'mais', 'mère'], difficulty: 1 },
  { phoneme: 'n', category: 'consonant', description: 'Alveolar nasal', exampleWords: ['non', 'nous', 'une'], difficulty: 1 },
  { phoneme: 'ɲ', category: 'consonant', description: 'Palatal nasal', exampleWords: ['montagne', 'gagne', 'oignon'], difficulty: 3 },
  { phoneme: 'ŋ', category: 'consonant', description: 'Velar nasal', exampleWords: ['parking', 'camping'], difficulty: 2, commonMistakes: ['Rare, mainly in loanwords'] },
  { phoneme: 'l', category: 'consonant', description: 'Alveolar lateral', exampleWords: ['le', 'la', 'livre'], difficulty: 1 },
  { phoneme: 'ʁ', category: 'consonant', description: 'Uvular fricative/approximant', exampleWords: ['rue', 'rouge', 'partir'], difficulty: 5, commonMistakes: ['Using English /r/', 'Not using throat'] },
];

/**
 * Get all phoneme symbols as a set
 */
export function getAllPhonemes(): Set<string> {
  return new Set(FRENCH_PHONEMES.map(p => p.phoneme));
}

/**
 * Get phoneme info by symbol
 */
export function getPhonemeInfo(phoneme: string): PhonemeInfo | undefined {
  return FRENCH_PHONEMES.find(p => p.phoneme === phoneme);
}

/**
 * Get phonemes by category
 */
export function getPhonemesByCategory(category: PhonemeInfo['category']): PhonemeInfo[] {
  return FRENCH_PHONEMES.filter(p => p.category === category);
}

/**
 * Get phonemes by difficulty
 */
export function getPhonemesByDifficulty(minDifficulty: number, maxDifficulty: number): PhonemeInfo[] {
  return FRENCH_PHONEMES.filter(p => p.difficulty >= minDifficulty && p.difficulty <= maxDifficulty);
}

/**
 * Count total phonemes in inventory
 */
export const TOTAL_PHONEMES = FRENCH_PHONEMES.length; // 39

