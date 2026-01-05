/**
 * Stable Score Calculation
 * Implements conservative score algorithm that naturally rises with practice
 */

export interface AttemptScore {
  attempt_number: number;
  score: number;
  timestamp: string;
}

export interface StableScore {
  stable: number; // Conservative lower bound
  mean: number; // Average score
  stddev: number; // Standard deviation
  confidence: number; // Confidence in the score (0-1)
  raw_scores: number[]; // All raw scores
  trend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
}

/**
 * Calculate standard deviation
 */
function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  
  return Math.sqrt(variance);
}

/**
 * Calculate stable score using conservative algorithm
 * Formula: stable = mean - k * stddev
 * Where k decreases as sample size increases
 * 
 * @param scores - Array of attempt scores
 * @param k - Conservative factor (default: 1.0)
 */
export function calculateStableScore(
  scores: AttemptScore[],
  k: number = 1.0
): StableScore {
  if (scores.length === 0) {
    return {
      stable: 0,
      mean: 0,
      stddev: 0,
      confidence: 0,
      raw_scores: [],
      trend: 'insufficient_data',
    };
  }

  const rawScores = scores.map(s => s.score);
  const mean = rawScores.reduce((sum, val) => sum + val, 0) / rawScores.length;
  const stddev = calculateStdDev(rawScores);

  // Adaptive k: decreases as we have more samples
  // More attempts = more confidence = less conservative
  const adaptiveK = scores.length === 1 ? k * 1.5 :
                     scores.length === 2 ? k * 1.2 :
                     scores.length >= 5 ? k * 0.7 :
                     k;

  // Conservative stable score (lower bound)
  const stable = Math.max(0, Math.round(mean - adaptiveK * stddev));

  // Confidence: inversely related to stddev, increases with sample size
  const sampleSizeFactor = Math.min(1, scores.length / 5);
  const variabilityFactor = Math.max(0, 1 - (stddev / 100));
  const confidence = sampleSizeFactor * variabilityFactor;

  // Trend detection
  let trend: StableScore['trend'] = 'insufficient_data';
  if (scores.length >= 3) {
    const recent = rawScores.slice(-3);
    const earlier = rawScores.slice(0, -3);
    
    if (earlier.length > 0) {
      const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
      const earlierAvg = earlier.reduce((sum, val) => sum + val, 0) / earlier.length;
      
      if (recentAvg > earlierAvg + 5) {
        trend = 'improving';
      } else if (recentAvg < earlierAvg - 5) {
        trend = 'declining';
      } else {
        trend = 'stable';
      }
    }
  }

  return {
    stable,
    mean: Math.round(mean),
    stddev: Math.round(stddev * 10) / 10,
    confidence: Math.round(confidence * 100) / 100,
    raw_scores: rawScores,
    trend,
  };
}

/**
 * Get display score (returns stable score for early attempts, mean for later)
 */
export function getDisplayScore(stableScore: StableScore): number {
  // Once we have 5+ attempts and low stddev, show mean instead of conservative
  if (stableScore.raw_scores.length >= 5 && stableScore.stddev < 5) {
    return stableScore.mean;
  }
  
  return stableScore.stable;
}

/**
 * Get confidence band (for visualization)
 * Returns [lower, upper] bounds
 */
export function getConfidenceBand(stableScore: StableScore): [number, number] {
  const lower = Math.max(0, Math.round(stableScore.mean - stableScore.stddev));
  const upper = Math.min(100, Math.round(stableScore.mean + stableScore.stddev));
  
  return [lower, upper];
}

/**
 * Get trend description for UI
 */
export function getTrendDescription(stableScore: StableScore): string {
  switch (stableScore.trend) {
    case 'improving':
      return 'Your scores are improving! Keep practicing.';
    case 'stable':
      return 'Your performance is consistent.';
    case 'declining':
      return 'Consider reviewing the fundamentals.';
    case 'insufficient_data':
      return 'Complete more attempts to see your progress.';
  }
}

/**
 * Calculate module scores from all attempts
 * Returns map of module -> stable score
 */
export function calculateModuleScores(
  recordings: Array<{
    module_type: string;
    attempt_number: number;
    ai_score?: number;
    created_at: string;
  }>
): Record<string, StableScore> {
  const moduleScores: Record<string, StableScore> = {};
  
  // Group by module
  const byModule: Record<string, AttemptScore[]> = {};
  for (const rec of recordings) {
    if (rec.ai_score == null) continue;
    
    if (!byModule[rec.module_type]) {
      byModule[rec.module_type] = [];
    }
    
    byModule[rec.module_type].push({
      attempt_number: rec.attempt_number,
      score: rec.ai_score,
      timestamp: rec.created_at,
    });
  }
  
  // Calculate stable scores
  for (const [module, attempts] of Object.entries(byModule)) {
    moduleScores[module] = calculateStableScore(attempts);
  }
  
  return moduleScores;
}

