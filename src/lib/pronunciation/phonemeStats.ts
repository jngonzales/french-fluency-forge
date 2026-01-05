/**
 * Phoneme Statistics Calculator
 * Handles per-user phoneme accuracy tracking
 * 
 * NOTE: The user_phoneme_stats table does not exist yet.
 * All functions return mock/empty data until the table is created.
 */

export interface PhonemeScore {
  phoneme: string;
  score: number; // 0-100
}

export interface UserPhonemestat {
  id: string;
  user_id: string;
  phoneme: string;
  attempts: number;
  mean_accuracy: number;
  confidence: number;
  last_tested_at: string;
}

// Re-export with correct casing for backward compatibility
export type UserPhonemeStat = UserPhonemestat;

/**
 * Calculate confidence based on number of attempts
 * Formula: 1 - exp(-attempts / 12)
 * 
 * @param attempts - Number of times tested
 * @returns Confidence score 0-1
 */
export function calculateConfidence(attempts: number): number {
  return 1 - Math.exp(-attempts / 12);
}

/**
 * Calculate new mean using online/incremental algorithm
 * 
 * @param oldMean - Previous mean
 * @param oldAttempts - Previous number of attempts
 * @param newScore - New score to add
 * @returns New mean
 */
export function calculateOnlineMean(
  oldMean: number,
  oldAttempts: number,
  newScore: number
): number {
  return (oldMean * oldAttempts + newScore) / (oldAttempts + 1);
}

/**
 * Update phoneme stats for a user after a pronunciation test
 * 
 * NOTE: Stubbed - user_phoneme_stats table does not exist yet
 * 
 * @param userId - User ID
 * @param phonemeScores - Array of phoneme scores from test
 */
export async function updatePhonemeStats(
  userId: string,
  phonemeScores: PhonemeScore[]
): Promise<void> {
  console.log('[Phoneme Stats] Stats update skipped - table not yet created. Would update', phonemeScores.length, 'phonemes for user', userId);
  // TODO: Implement when user_phoneme_stats table is created
}

/**
 * Get user's phoneme stats
 * 
 * NOTE: Stubbed - returns empty array
 */
export async function getUserPhonemeStats(userId: string): Promise<UserPhonemestat[]> {
  console.log('[Phoneme Stats] getUserPhonemeStats stubbed for user:', userId);
  return [];
}

/**
 * Get hardest phonemes for user
 * Low accuracy + high confidence = needs practice
 * 
 * NOTE: Stubbed - returns empty array
 */
export async function getHardestPhonemes(
  userId: string,
  limit: number = 5,
  minConfidence: number = 0.5
): Promise<UserPhonemestat[]> {
  console.log('[Phoneme Stats] getHardestPhonemes stubbed for user:', userId);
  return [];
}

/**
 * Get uncertain phonemes (low confidence = need more testing)
 * 
 * NOTE: Stubbed - returns empty array
 */
export async function getUncertainPhonemes(
  userId: string,
  maxConfidence: number = 0.5
): Promise<UserPhonemestat[]> {
  console.log('[Phoneme Stats] getUncertainPhonemes stubbed for user:', userId);
  return [];
}

/**
 * Get strongest phonemes (high accuracy + high confidence)
 * 
 * NOTE: Stubbed - returns empty array
 */
export async function getStrongestPhonemes(
  userId: string,
  limit: number = 5,
  minConfidence: number = 0.5
): Promise<UserPhonemestat[]> {
  console.log('[Phoneme Stats] getStrongestPhonemes stubbed for user:', userId);
  return [];
}

/**
 * Get phoneme coverage for user
 * 
 * NOTE: Stubbed - returns 0 coverage
 */
export async function getPhonemeCoverage(userId: string): Promise<{
  tested: number;
  total: number;
  percentage: number;
}> {
  console.log('[Phoneme Stats] getPhonemeCoverage stubbed for user:', userId);
  return { tested: 0, total: 39, percentage: 0 };
}

/**
 * Extract phoneme scores from Azure/SpeechSuper response
 * 
 * @param result - Pronunciation assessment result
 * @returns Array of phoneme scores
 */
export function extractPhonemeScores(result: any): PhonemeScore[] {
  const scores: PhonemeScore[] = [];

  // Handle unified format
  if (result.allPhonemes && Array.isArray(result.allPhonemes)) {
    for (const phoneme of result.allPhonemes) {
      scores.push({
        phoneme: phoneme.phoneme.replace(/\//g, ''), // Remove slashes
        score: phoneme.score || 0,
      });
    }
  }
  // Handle old Azure format
  else if (result.phonemes && Array.isArray(result.phonemes)) {
    for (const phoneme of result.phonemes) {
      scores.push({
        phoneme: phoneme.phoneme || '',
        score: phoneme.accuracyScore || 0,
      });
    }
  }

  return scores;
}

/**
 * Get phoneme stats summary for user
 * 
 * NOTE: Stubbed - returns empty arrays
 */
export async function getPhonemeStatsSummary(userId: string): Promise<{
  hardest: UserPhonemestat[];
  uncertain: UserPhonemestat[];
  strongest: UserPhonemestat[];
  coverage: { tested: number; total: number; percentage: number };
}> {
  console.log('[Phoneme Stats] getPhonemeStatsSummary stubbed for user:', userId);
  return {
    hardest: [],
    uncertain: [],
    strongest: [],
    coverage: { tested: 0, total: 39, percentage: 0 },
  };
}
