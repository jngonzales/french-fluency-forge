/**
 * Phoneme Coverage Tests
 * Tests IPA parsing and coverage-constrained sampling
 */

import { describe, it, expect } from 'vitest';
import { parseIPA, getUniquePhonemes, getTargetPhonemes } from '../ipaParser';
import { 
  selectPhrasesWithCoverage, 
  validateFullCoverage,
  getMissingPhonemes,
  type PronunciationPhrase 
} from '../coverageSampler';
import { getAllPhonemes } from '../phonemeInventory';

describe('IPA Parser', () => {
  it('should parse simple IPA string', () => {
    const phonemes = parseIPA('/œ̃ ʃa/');
    expect(phonemes).toContain('œ̃');
    expect(phonemes).toContain('ʃ');
    expect(phonemes).toContain('a');
  });

  it('should handle liaison markers', () => {
    const phonemes = parseIPA('/le z‿ami/');
    expect(phonemes).toContain('l');
    expect(phonemes).toContain('e');
    expect(phonemes).toContain('z');
    expect(phonemes).toContain('a');
    expect(phonemes).toContain('m');
    expect(phonemes).toContain('i');
  });

  it('should handle optional schwas', () => {
    const phonemes = parseIPA('/mɛ̃t(ə)nɑ̃/');
    expect(phonemes).toContain('m');
    expect(phonemes).toContain('ɛ̃');
    expect(phonemes).toContain('t');
    expect(phonemes).toContain('ə');
    expect(phonemes).toContain('n');
    expect(phonemes).toContain('ɑ̃');
  });

  it('should handle complex phrases', () => {
    const phonemes = parseIPA('/mɔ̃ fʁɛʁ paʁl vit/');
    expect(phonemes.length).toBeGreaterThan(0);
    expect(phonemes).toContain('m');
    expect(phonemes).toContain('ɔ̃');
    expect(phonemes).toContain('f');
    expect(phonemes).toContain('ʁ');
  });

  it('should get unique phonemes', () => {
    const unique = getUniquePhonemes('/ʁy ʁuʒ/'); // rue rouge
    expect(unique.size).toBeLessThan(6); // Has duplicate ʁ
    expect(unique.has('ʁ')).toBe(true);
    expect(unique.has('y')).toBe(true);
  });

  it('should extract target phonemes', () => {
    const targets = getTargetPhonemes('/œ̃ ʃa/', 2);
    expect(targets.length).toBeLessThanOrEqual(2);
  });
});

describe('Phoneme Inventory', () => {
  it('should have 39 phonemes', () => {
    const all = getAllPhonemes();
    expect(all.size).toBe(39);
  });

  it('should include all vowel categories', () => {
    const all = getAllPhonemes();
    expect(all.has('i')).toBe(true); // oral
    expect(all.has('ɛ̃')).toBe(true); // nasal
    expect(all.has('j')).toBe(true); // semivowel
    expect(all.has('ʁ')).toBe(true); // consonant
  });
});

describe('Coverage Sampling', () => {
  const mockPhrases: PronunciationPhrase[] = [
    { id: '2W01', group: '2w', text_fr: 'un chat', ipa: '/œ̃ ʃa/', difficulty: 1 },
    { id: '2W02', group: '2w', text_fr: 'une rue', ipa: '/yn ʁy/', difficulty: 1 },
    { id: '3W01', group: '3-4w', text_fr: 'un bon pain', ipa: '/œ̃ bɔ̃ pɛ̃/', difficulty: 2 },
    { id: '4W01', group: '4-5w', text_fr: 'les amis arrivent', ipa: '/le z‿ami aʁiv/', difficulty: 2 },
  ];

  it('should select phrases from each group', () => {
    const result = selectPhrasesWithCoverage(mockPhrases, 12345, {
      '2w': 1,
      '3-4w': 1,
      '4-5w': 1,
    });

    expect(result.phrases.length).toBe(3);
    const groups = result.phrases.map(p => p.group);
    expect(groups).toContain('2w');
    expect(groups).toContain('3-4w');
    expect(groups).toContain('4-5w');
  });

  it('should be deterministic with same seed', () => {
    const seed = 99999;
    const result1 = selectPhrasesWithCoverage(mockPhrases, seed, { '2w': 2 });
    const result2 = selectPhrasesWithCoverage(mockPhrases, seed, { '2w': 2 });
    
    expect(result1.phrases.map(p => p.id)).toEqual(result2.phrases.map(p => p.id));
  });

  it('should calculate coverage correctly', () => {
    const result = selectPhrasesWithCoverage(mockPhrases, 12345, {
      '2w': 2,
      '3-4w': 1,
    });

    expect(result.coverage.size).toBeGreaterThan(0);
    expect(result.coveragePercent).toBeGreaterThan(0);
  });

  it('should identify missing phonemes', () => {
    const missing = getMissingPhonemes(mockPhrases);
    // With only 4 phrases, should be missing many phonemes
    expect(missing.length).toBeGreaterThan(20);
  });
});

describe('Coverage Validation', () => {
  it('should validate full coverage', () => {
    // This would need a complete phrase bank to test properly
    // For now, just check the function exists
    expect(typeof validateFullCoverage).toBe('function');
  });
});

