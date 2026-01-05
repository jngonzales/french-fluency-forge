/**
 * Phoneme Statistics Calculator
 * Handles per-user phoneme accuracy tracking
 */

import { supabase } from '@/integrations/supabase/client';

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
 * @param userId - User ID
 * @param phonemeScores - Array of phoneme scores from test
 */
export async function updatePhonemeStats(
  userId: string,
  phonemeScores: PhonemeScore[]
): Promise<void> {
  console.log('[Phoneme Stats] Updating stats for', phonemeScores.length, 'phonemes');

  for (const { phoneme, score } of phonemeScores) {
    try {
      // Use the database function for atomic update
      const { error } = await supabase.rpc('update_user_phoneme_stat', {
        p_user_id: userId,
        p_phoneme: phoneme,
        p_accuracy: score,
      });

      if (error) {
        console.error(`[Phoneme Stats] Error updating ${phoneme}:`, error);
      }
    } catch (error) {
      console.error(`[Phoneme Stats] Exception updating ${phoneme}:`, error);
    }
  }

  console.log('[Phoneme Stats] Update complete');
}

/**
 * Get user's phoneme stats
 */
export async function getUserPhonemeStats(userId: string): Promise<UserPhonemestat[]> {
  const { data, error } = await supabase
    .from('user_phoneme_stats')
    .select('*')
    .eq('user_id', userId)
    .order('phoneme');

  if (error) {
    console.error('[Phoneme Stats] Error fetching stats:', error);
    return [];
  }

  return data || [];
}

/**
 * Get hardest phonemes for user
 * Low accuracy + high confidence = needs practice
 * 
 * @param userId - User ID
 * @param limit - Number of phonemes to return
 * @param minConfidence - Minimum confidence threshold
 * @returns Phonemes sorted by difficulty (hardest first)
 */
export async function getHardestPhonemes(
  userId: string,
  limit: number = 5,
  minConfidence: number = 0.5
): Promise<UserPhonemeStat[]> {
  const { data, error } = await supabase
    .from('user_phoneme_stats')
    .select('*')
    .eq('user_id', userId)
    .gte('confidence', minConfidence)
    .order('mean_accuracy', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[Phoneme Stats] Error fetching hardest phonemes:', error);
    return [];
  }

  return data || [];
}

/**
 * Get uncertain phonemes (low confidence = need more testing)
 * 
 * @param userId - User ID
 * @param maxConfidence - Maximum confidence threshold
 * @returns Phonemes that need more testing
 */
export async function getUncertainPhonemes(
  userId: string,
  maxConfidence: number = 0.5
): Promise<UserPhonemeStat[]> {
  const { data, error } = await supabase
    .from('user_phoneme_stats')
    .select('*')
    .eq('user_id', userId)
    .lt('confidence', maxConfidence)
    .order('attempts', { ascending: true });

  if (error) {
    console.error('[Phoneme Stats] Error fetching uncertain phonemes:', error);
    return [];
  }

  return data || [];
}

/**
 * Get strongest phonemes (high accuracy + high confidence)
 * 
 * @param userId - User ID
 * @param limit - Number of phonemes to return
 * @param minConfidence - Minimum confidence threshold
 * @returns Phonemes sorted by accuracy (strongest first)
 */
export async function getStrongestPhonemes(
  userId: string,
  limit: number = 5,
  minConfidence: number = 0.5
): Promise<UserPhonemeStat[]> {
  const { data, error } = await supabase
    .from('user_phoneme_stats')
    .select('*')
    .eq('user_id', userId)
    .gte('confidence', minConfidence)
    .order('mean_accuracy', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Phoneme Stats] Error fetching strongest phonemes:', error);
    return [];
  }

  return data || [];
}

/**
 * Get phoneme coverage for user
 * 
 * @param userId - User ID
 * @returns Number of phonemes tested out of 39
 */
export async function getPhonemeCoverage(userId: string): Promise<{
  tested: number;
  total: number;
  percentage: number;
}> {
  const { count, error } = await supabase
    .from('user_phoneme_stats')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    console.error('[Phoneme Stats] Error fetching coverage:', error);
    return { tested: 0, total: 39, percentage: 0 };
  }

  const tested = count || 0;
  const total = 39;
  const percentage = Math.round((tested / total) * 100);

  return { tested, total, percentage };
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
 */
export async function getPhonemeStatsSummary(userId: string): Promise<{
  hardest: UserPhonemeStat[];
  uncertain: UserPhonemeStat[];
  strongest: UserPhonemeStat[];
  coverage: { tested: number; total: number; percentage: number };
}> {
  const [hardest, uncertain, strongest, coverage] = await Promise.all([
    getHardestPhonemes(userId, 3),
    getUncertainPhonemes(userId),
    getStrongestPhonemes(userId, 3),
    getPhonemeCoverage(userId),
  ]);

  return {
    hardest,
    uncertain,
    strongest,
    coverage,
  };
}

