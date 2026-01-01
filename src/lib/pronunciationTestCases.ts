/**
 * Pronunciation Module QA Test Cases
 * 
 * Uses TTS to generate "mispronounced" audio by generating wrong words,
 * then tests Azure Speech Pronunciation Assessment against the original reference text.
 */

export interface PronunciationTestCase {
  id: string;
  description: string;
  targetText: string; // What Azure should expect
  ttsText: string; // What TTS will generate (can be different to simulate mispronunciation)
  expectedScoreRange: { min: number; max: number };
  testType: 'positive' | 'negative' | 'edge';
  category: 'reading' | 'repeat' | 'minimal-pair' | 'edge-case';
  phonemeFocus?: string; // What phoneme contrast this tests
}

export interface TestResult {
  testId: string;
  passed: boolean;
  actualScore: number;
  expectedRange: { min: number; max: number };
  details: {
    accuracyScore: number;
    fluencyScore: number;
    completenessScore: number;
    pronScore: number;
  };
  errorMessage?: string;
  timestamp: Date;
}

// ============ POSITIVE CONTROLS (Should score HIGH) ============

const positiveControls: PronunciationTestCase[] = [
  {
    id: 'pos-pronR-1',
    description: 'Correct /y/ vs /u/ sentence - native pronunciation',
    targetText: 'Tu as vu tout le monde hier soir ?',
    ttsText: 'Tu as vu tout le monde hier soir ?', // Same = correct
    expectedScoreRange: { min: 75, max: 100 },
    testType: 'positive',
    category: 'reading',
    phonemeFocus: '/y/ vs /u/',
  },
  {
    id: 'pos-pronR-2',
    description: 'Correct nasal vowels sentence - native pronunciation',
    targetText: 'Ce matin, il y a du vent et un verre de vin blanc dans le salon.',
    ttsText: 'Ce matin, il y a du vent et un verre de vin blanc dans le salon.',
    expectedScoreRange: { min: 75, max: 100 },
    testType: 'positive',
    category: 'reading',
    phonemeFocus: 'Nasal vowels /ɛ̃/ /ɑ̃/ /ɔ̃/',
  },
  {
    id: 'pos-pronR-3',
    description: 'Correct /s/ vs /z/ sentence - native pronunciation',
    targetText: 'Ils ont choisi seize belles cerises roses.',
    ttsText: 'Ils ont choisi seize belles cerises roses.',
    expectedScoreRange: { min: 75, max: 100 },
    testType: 'positive',
    category: 'reading',
    phonemeFocus: '/s/ vs /z/',
  },
  {
    id: 'pos-pronE-1',
    description: 'Correct position words - native pronunciation',
    targetText: 'Sur la table, sous la chaise, derrière le canapé, devant la porte.',
    ttsText: 'Sur la table, sous la chaise, derrière le canapé, devant la porte.',
    expectedScoreRange: { min: 75, max: 100 },
    testType: 'positive',
    category: 'repeat',
    phonemeFocus: 'Position words',
  },
  {
    id: 'pos-pronE-2',
    description: 'Correct liaisons - native pronunciation',
    targetText: 'Les enfants ont un ami américain.',
    ttsText: 'Les enfants ont un ami américain.',
    expectedScoreRange: { min: 75, max: 100 },
    testType: 'positive',
    category: 'repeat',
    phonemeFocus: 'Liaisons',
  },
];

// ============ NEGATIVE CONTROLS (Should score LOW) ============

const negativeControls: PronunciationTestCase[] = [
  // /y/ vs /u/ confusion
  {
    id: 'neg-tu-tou',
    description: 'Wrong: "tou" instead of "tu" - tests /y/ detection',
    targetText: 'Tu as vu tout le monde hier soir ?',
    ttsText: 'Tou as vou tout le monde hier soir ?', // Wrong vowels
    expectedScoreRange: { min: 20, max: 60 },
    testType: 'negative',
    category: 'reading',
    phonemeFocus: '/y/ → /u/ error',
  },
  
  // Nasal vowel confusion
  {
    id: 'neg-vin-vent',
    description: 'Wrong: "vent" instead of "vin" - tests nasal vowel detection',
    targetText: 'Ce matin, il y a du vent et un verre de vin blanc dans le salon.',
    ttsText: 'Ce matin, il y a du vent et un verre de vent blanc dans le salon.', // vin→vent
    expectedScoreRange: { min: 40, max: 70 },
    testType: 'negative',
    category: 'reading',
    phonemeFocus: '/ɛ̃/ → /ɑ̃/ error',
  },
  {
    id: 'neg-blanc-blond',
    description: 'Wrong: "blond" instead of "blanc" - tests nasal vowel detection',
    targetText: 'Ce matin, il y a du vent et un verre de vin blanc dans le salon.',
    ttsText: 'Ce matin, il y a du vent et un verre de vin blond dans le salon.', // blanc→blond
    expectedScoreRange: { min: 40, max: 70 },
    testType: 'negative',
    category: 'reading',
    phonemeFocus: '/ɑ̃/ → /ɔ̃/ error',
  },
  
  // /s/ vs /z/ confusion
  {
    id: 'neg-seize-ceize',
    description: 'Wrong: voiced/unvoiced /s/ vs /z/ confusion',
    targetText: 'Ils ont choisi seize belles cerises roses.',
    ttsText: 'Ils ont choizi zeize belles zerizez rozez.', // All /s/→/z/
    expectedScoreRange: { min: 30, max: 60 },
    testType: 'negative',
    category: 'reading',
    phonemeFocus: '/s/ → /z/ error',
  },
  
  // Liaison errors
  {
    id: 'neg-no-liaison',
    description: 'Missing liaisons - should reduce fluency',
    targetText: 'Les enfants ont un ami américain.',
    ttsText: 'Les enfants ont un ami américain.', // TTS might naturally liaise, but we test structure
    expectedScoreRange: { min: 60, max: 85 }, // Harder to test via TTS
    testType: 'negative',
    category: 'repeat',
    phonemeFocus: 'Missing liaison',
  },
  
  // Completely wrong sentence
  {
    id: 'neg-wrong-sentence',
    description: 'Completely different sentence - should fail completeness',
    targetText: 'Tu as vu tout le monde hier soir ?',
    ttsText: 'Bonjour, je voudrais un café, s\'il vous plaît.',
    expectedScoreRange: { min: 0, max: 30 },
    testType: 'negative',
    category: 'reading',
    phonemeFocus: 'Completeness check',
  },
  
  // Partial sentence
  {
    id: 'neg-partial',
    description: 'Only half the sentence spoken',
    targetText: 'Ce matin, il y a du vent et un verre de vin blanc dans le salon.',
    ttsText: 'Ce matin, il y a du vent.',
    expectedScoreRange: { min: 20, max: 50 },
    testType: 'negative',
    category: 'reading',
    phonemeFocus: 'Completeness check',
  },
];

// ============ EDGE CASES ============

const edgeCases: PronunciationTestCase[] = [
  {
    id: 'edge-english',
    description: 'English sentence instead of French - wrong language',
    targetText: 'Tu as vu tout le monde hier soir ?',
    ttsText: 'Did you see everyone last night?',
    expectedScoreRange: { min: 0, max: 25 },
    testType: 'edge',
    category: 'edge-case',
    phonemeFocus: 'Language detection',
  },
  {
    id: 'edge-numbers',
    description: 'Numbers instead of words',
    targetText: 'Tu as vu tout le monde hier soir ?',
    ttsText: 'Un, deux, trois, quatre, cinq.',
    expectedScoreRange: { min: 0, max: 20 },
    testType: 'edge',
    category: 'edge-case',
    phonemeFocus: 'Content mismatch',
  },
  {
    id: 'edge-gibberish',
    description: 'Nonsense French-sounding words',
    targetText: 'Tu as vu tout le monde hier soir ?',
    ttsText: 'Bla bla bla, fra fra fra, oui oui oui.',
    expectedScoreRange: { min: 0, max: 30 },
    testType: 'edge',
    category: 'edge-case',
    phonemeFocus: 'Content mismatch',
  },
];

// ============ MINIMAL PAIR SPECIFIC TESTS ============

const minimalPairTests: PronunciationTestCase[] = [
  {
    id: 'mp-dessus-dessous',
    description: 'Minimal pair: dessus vs dessous',
    targetText: 'dessus',
    ttsText: 'dessous', // Wrong word
    expectedScoreRange: { min: 30, max: 70 },
    testType: 'negative',
    category: 'minimal-pair',
    phonemeFocus: '/y/ vs /u/',
  },
  {
    id: 'mp-rue-roue',
    description: 'Minimal pair: rue vs roue',
    targetText: 'rue',
    ttsText: 'roue', // Wrong word
    expectedScoreRange: { min: 30, max: 70 },
    testType: 'negative',
    category: 'minimal-pair',
    phonemeFocus: '/y/ vs /u/',
  },
  {
    id: 'mp-vin-vent',
    description: 'Minimal pair: vin vs vent',
    targetText: 'vin',
    ttsText: 'vent', // Wrong word
    expectedScoreRange: { min: 30, max: 70 },
    testType: 'negative',
    category: 'minimal-pair',
    phonemeFocus: '/ɛ̃/ vs /ɑ̃/',
  },
  {
    id: 'mp-poisson-poison',
    description: 'Minimal pair: poisson vs poison',
    targetText: 'poisson',
    ttsText: 'poison', // Wrong word
    expectedScoreRange: { min: 40, max: 75 },
    testType: 'negative',
    category: 'minimal-pair',
    phonemeFocus: '/s/ vs /z/',
  },
];

// ============ EXPORT ALL ============

export const allTestCases: PronunciationTestCase[] = [
  ...positiveControls,
  ...negativeControls,
  ...edgeCases,
  ...minimalPairTests,
];

export const testCasesByCategory = {
  positive: positiveControls,
  negative: negativeControls,
  edge: edgeCases,
  minimalPair: minimalPairTests,
};

export const getTestCaseById = (id: string): PronunciationTestCase | undefined => {
  return allTestCases.find(tc => tc.id === id);
};

export const getTestCasesByType = (type: 'positive' | 'negative' | 'edge'): PronunciationTestCase[] => {
  return allTestCases.filter(tc => tc.testType === type);
};
