/**
 * Assist Level Utilities
 * Generates progressive hints based on assist level (0-4)
 * Speech-first, whole phrase recall approach
 */

import type { Phrase } from '../types';

// French stop words (function words to protect from blanking)
const FRENCH_STOP_WORDS = new Set([
  'je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles',
  'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'à', 'au', 'aux',
  'en', 'y', 'ne', 'pas', 'ce', 'ça', 'se', 'me', 'te', 'lui', 'leur',
  'qui', 'que', 'quoi', 'dont', 'où',
  'est', 'sont', 'a', 'ont', 'être', 'avoir',
  'pour', 'par', 'avec', 'sans', 'sous', 'sur',
]);

// Check if word is a stop word
export function isStopWord(word: string): boolean {
  const normalized = word.toLowerCase().trim();
  return FRENCH_STOP_WORDS.has(normalized);
}

// Tokenize French text (simple tokenizer)
export function tokenizeFrench(text: string): string[] {
  if (!text) return [];
  
  // Remove punctuation, normalize spaces
  const cleaned = text
    .replace(/[.,!?;:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Split on spaces and apostrophes
  const tokens: string[] = [];
  let current = '';
  
  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    if (char === ' ' || char === "'") {
      if (current) {
        tokens.push(current);
        current = '';
      }
      if (char === "'") {
        tokens.push("'");
      }
    } else {
      current += char;
    }
  }
  
  if (current) {
    tokens.push(current);
  }
  
  return tokens.filter(t => t.trim().length > 0);
}

// Get content words (non-stop words)
function getContentWords(tokens: string[]): { word: string; index: number }[] {
  return tokens
    .map((word, index) => ({ word, index }))
    .filter(({ word }) => !isStopWord(word));
}

// Assist Level Hint Interface
export interface AssistHint {
  level: number;
  type: 'none' | 'first_chunk' | 'skeleton';
  hint?: string; // The hint text to display
  fullPhrase?: string; // Full phrase for reference
}

// Get assist hint for a phrase
export function getAssistHint(phrase: Phrase, assistLevel: number): AssistHint {
  const frenchText = phrase.canonical_fr || phrase.transcript_fr || '';
  
  if (!frenchText || assistLevel === 0) {
    return { level: 0, type: 'none' };
  }
  
  // Check for scaffold overrides
  if (phrase.scaffold_overrides) {
    const overrides = phrase.scaffold_overrides as Record<string, string>;
    if (assistLevel === 2 && overrides.level2) {
      return {
        level: 2,
        type: 'skeleton',
        hint: overrides.level2,
        fullPhrase: frenchText,
      };
    }
    if (assistLevel === 3 && overrides.level3) {
      return {
        level: 3,
        type: 'skeleton',
        hint: overrides.level3,
        fullPhrase: frenchText,
      };
    }
  }
  
  const tokens = tokenizeFrench(frenchText);
  
  if (assistLevel === 1) {
    // First chunk hint (1-3 words)
    const firstChunk = tokens.slice(0, Math.min(3, tokens.length)).join(' ');
    return {
      level: 1,
      type: 'first_chunk',
      hint: `${firstChunk}...`,
      fullPhrase: frenchText,
    };
  }
  
  if (assistLevel === 2 || assistLevel === 3) {
    // Skeleton with blanks
    const skeleton = generateSkeleton(phrase, assistLevel);
    return {
      level: assistLevel,
      type: 'skeleton',
      hint: skeleton,
      fullPhrase: frenchText,
    };
  }
  
  // Level 4: Full phrase shown (no blanks), but emphasis on speech feedback
  return {
    level: 4,
    type: 'skeleton',
    hint: frenchText, // Full phrase
    fullPhrase: frenchText,
  };
}

// Generate skeleton with blanks
export function generateSkeleton(phrase: Phrase, level: number): string {
  const frenchText = phrase.canonical_fr || phrase.transcript_fr || '';
  if (!frenchText) return '';
  
  const tokens = tokenizeFrench(frenchText);
  const contentWords = getContentWords(tokens);
  
  if (contentWords.length === 0) {
    // Fallback: blank first non-stop word
    const firstNonStop = tokens.findIndex(t => !isStopWord(t));
    if (firstNonStop >= 0) {
      const result = [...tokens];
      result[firstNonStop] = '___';
      return result.join(' ');
    }
    return frenchText;
  }
  
  if (level === 2) {
    // Level 2: Blank first content word
    const firstContent = contentWords[0];
    const result = [...tokens];
    result[firstContent.index] = '___';
    return result.join(' ');
  }
  
  if (level === 3) {
    // Level 3: Blank 2-3 content words, spaced across phrase
    const numBlanks = Math.min(3, Math.max(2, Math.floor(contentWords.length / 2)));
    const indicesToBlank = new Set<number>();
    
    // Select spaced indices
    if (contentWords.length <= numBlanks) {
      // Blank all content words
      contentWords.forEach(({ index }) => indicesToBlank.add(index));
    } else {
      // Space them out
      const step = Math.floor(contentWords.length / (numBlanks + 1));
      for (let i = 1; i <= numBlanks; i++) {
        const idx = Math.min(i * step, contentWords.length - 1);
        indicesToBlank.add(contentWords[idx].index);
      }
    }
    
    const result = [...tokens];
    indicesToBlank.forEach(idx => {
      result[idx] = '___';
    });
    return result.join(' ');
  }
  
  return frenchText;
}

// Get first chunk hint text
export function getFirstChunkHint(phrase: Phrase): string {
  const frenchText = phrase.canonical_fr || phrase.transcript_fr || '';
  if (!frenchText) return '';
  
  const tokens = tokenizeFrench(frenchText);
  const firstChunk = tokens.slice(0, Math.min(3, tokens.length)).join(' ');
  return `${firstChunk}...`;
}

