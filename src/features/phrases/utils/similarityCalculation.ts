/**
 * Similarity Calculation Utility
 * Calculates similarity between user transcript and target French phrases
 * Handles French-specific variations and accents
 */

export interface TokenMatch {
  text: string;
  matched: boolean;
  index: number;
}

export interface SimilarityResult {
  similarity: number; // 0-1
  wordSimilarity: number; // 0-1
  characterSimilarity: number; // 0-1
  matchedTokens: TokenMatch[];
  missingTokens: string[];
  extraTokens: string[];
}

/**
 * Normalize French text for comparison
 * - Removes accents (é → e, à → a, etc.)
 * - Converts to lowercase
 * - Normalizes whitespace
 * - Handles common variations (ça → ca, etc.)
 */
function normalizeFrench(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[.,!?;:]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Tokenize French text into words
 */
function tokenize(text: string): string[] {
  return normalizeFrench(text)
    .split(/\s+/)
    .filter(word => word.length > 0);
}

/**
 * Calculate similarity between two French texts
 */
export function calculateSimilarity(
  userTranscript: string,
  targetText: string | string[]
): SimilarityResult {
  const targets = Array.isArray(targetText) ? targetText : [targetText];
  
  // Try each target and return the best match
  let bestResult: SimilarityResult | null = null;
  let bestSimilarity = 0;

  for (const target of targets) {
    const result = calculateSimilaritySingle(userTranscript, target);
    if (result.similarity > bestSimilarity) {
      bestSimilarity = result.similarity;
      bestResult = result;
    }
  }

  return bestResult || {
    similarity: 0,
    wordSimilarity: 0,
    characterSimilarity: 0,
    matchedTokens: [],
    missingTokens: [],
    extraTokens: [],
  };
}

/**
 * Calculate similarity for a single target text
 */
function calculateSimilaritySingle(
  userTranscript: string,
  targetText: string
): SimilarityResult {
  const userTokens = tokenize(userTranscript);
  const targetTokens = tokenize(targetText);

  // Word-level matching
  const matchedWords = new Set<string>();
  const matchedTokens: TokenMatch[] = [];
  const missingTokens: string[] = [];
  const extraTokens: string[] = [];

  // Check each target token
  for (let i = 0; i < targetTokens.length; i++) {
    const targetToken = targetTokens[i];
    const matched = userTokens.some((userToken, userIndex) => {
      if (matchedWords.has(userToken)) return false; // Already matched
      
      // Exact match or normalized match
      if (targetToken === userToken || 
          normalizeFrench(targetToken) === normalizeFrench(userToken)) {
        matchedWords.add(userToken);
        matchedTokens.push({
          text: targetToken,
          matched: true,
          index: i,
        });
        return true;
      }
      return false;
    });

    if (!matched) {
      missingTokens.push(targetToken);
      matchedTokens.push({
        text: targetToken,
        matched: false,
        index: i,
      });
    }
  }

  // Find extra tokens (in user but not in target)
  for (const userToken of userTokens) {
    if (!matchedWords.has(userToken)) {
      const isInTarget = targetTokens.some(targetToken => 
        normalizeFrench(targetToken) === normalizeFrench(userToken)
      );
      if (!isInTarget) {
        extraTokens.push(userToken);
      }
    }
  }

  // Calculate word similarity
  const wordSimilarity = targetTokens.length > 0
    ? matchedWords.size / targetTokens.length
    : 0;

  // Calculate character similarity (Levenshtein-like)
  const userNormalized = normalizeFrench(userTranscript);
  const targetNormalized = normalizeFrench(targetText);
  const characterSimilarity = calculateCharacterSimilarity(
    userNormalized,
    targetNormalized
  );

  // Combined similarity (weighted average)
  const similarity = (wordSimilarity * 0.7) + (characterSimilarity * 0.3);

  return {
    similarity: Math.min(1, Math.max(0, similarity)),
    wordSimilarity,
    characterSimilarity,
    matchedTokens,
    missingTokens,
    extraTokens,
  };
}

/**
 * Calculate character-level similarity using a simple algorithm
 */
function calculateCharacterSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (str1.length === 0 || str2.length === 0) return 0;

  // Simple longest common subsequence approach
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  let matches = 0;
  let shorterIndex = 0;

  for (let i = 0; i < longer.length && shorterIndex < shorter.length; i++) {
    if (longer[i] === shorter[shorterIndex]) {
      matches++;
      shorterIndex++;
    }
  }

  // Account for length difference
  const lengthPenalty = Math.abs(str1.length - str2.length) / Math.max(str1.length, str2.length);
  const baseSimilarity = matches / longer.length;
  
  return Math.max(0, baseSimilarity - lengthPenalty * 0.3);
}

/**
 * Check if similarity is "good enough" for auto-assessment
 */
export function isSimilarityGoodEnough(
  similarity: number,
  threshold: number = 0.85
): boolean {
  return similarity >= threshold;
}

