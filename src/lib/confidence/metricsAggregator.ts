/**
 * Metrics Aggregator
 * 
 * Aggregates timing and silence metrics across multiple turns
 * for confidence dimension scoring (D1-D5).
 */

import type { TurnMetrics } from './audioMetrics';

export interface AggregateMetrics {
  // D1 - Response Initiation
  start_latency_ms_median: number;
  start_latency_ms_values: number[];
  
  // D2 - Silence Management
  speech_ratio_avg: number;
  longest_silence_ms: number; // Longest across all turns
  total_silence_ms: number;
  total_speech_ms: number;
  
  // Additional stats
  turn_count: number;
  total_duration_ms: number;
}

/**
 * Calculate median of an array of numbers
 */
function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * Aggregate metrics across multiple turns
 * @param turnMetrics Array of metrics from each turn
 * @returns Aggregated metrics for scoring
 */
export function aggregateTurnMetrics(turnMetrics: TurnMetrics[]): AggregateMetrics {
  if (turnMetrics.length === 0) {
    return {
      start_latency_ms_median: 0,
      start_latency_ms_values: [],
      speech_ratio_avg: 0,
      longest_silence_ms: 0,
      total_silence_ms: 0,
      total_speech_ms: 0,
      turn_count: 0,
      total_duration_ms: 0
    };
  }
  
  // Collect latencies
  const latencies = turnMetrics.map(m => m.start_latency_ms);
  const start_latency_ms_median = calculateMedian(latencies);
  
  // Calculate average speech ratio
  let totalSpeechMs = 0;
  let totalSilenceMs = 0;
  let totalDurationMs = 0;
  
  for (const metrics of turnMetrics) {
    totalSpeechMs += metrics.speech_ms;
    totalSilenceMs += metrics.silence_ms;
    totalDurationMs += metrics.answer_duration_ms;
  }
  
  const speech_ratio_avg = totalSpeechMs / (totalSpeechMs + totalSilenceMs);
  
  // Find longest silence across all turns
  const longest_silence_ms = Math.max(
    ...turnMetrics.map(m => m.longest_silence_ms)
  );
  
  return {
    start_latency_ms_median,
    start_latency_ms_values: latencies,
    speech_ratio_avg: Math.min(1, Math.max(0, speech_ratio_avg)), // Clamp 0-1
    longest_silence_ms,
    total_silence_ms: totalSilenceMs,
    total_speech_ms: totalSpeechMs,
    turn_count: turnMetrics.length,
    total_duration_ms: totalDurationMs
  };
}

/**
 * Score D1 - Response Initiation based on median latency
 * Spec §5 D1 scoring table
 * @param medianLatencyMs Median start latency across turns
 * @returns Score 0-5
 */
export function scoreD1ResponseInitiation(medianLatencyMs: number): number {
  if (medianLatencyMs <= 900) return 5;
  if (medianLatencyMs <= 1400) return 4;
  if (medianLatencyMs <= 2200) return 3;
  if (medianLatencyMs <= 3200) return 2;
  if (medianLatencyMs <= 5000) return 1;
  return 0;
}

/**
 * Score D2 - Silence Management based on speech ratio and longest silence
 * Spec §5 D2 scoring table (both conditions must be met for each tier)
 * @param speechRatio Average speech ratio across turns
 * @param longestSilenceMs Longest single silence across all turns
 * @returns Score 0-5
 */
export function scoreD2SilenceManagement(
  speechRatio: number,
  longestSilenceMs: number
): number {
  if (speechRatio >= 0.85 && longestSilenceMs < 1200) return 5;
  if (speechRatio >= 0.78 && longestSilenceMs < 1800) return 4;
  if (speechRatio >= 0.70 && longestSilenceMs < 2500) return 3;
  if (speechRatio >= 0.60 && longestSilenceMs < 3500) return 2;
  if (speechRatio >= 0.50 || longestSilenceMs < 5000) return 1;
  return 0;
}

/**
 * Calculate overall speaking confidence score (0-100) from D1-D5
 * Spec §6.1 weighted scoring
 */
export function calculateSpeakingConfidenceScore(
  d1: number,
  d2: number,
  d3: number,
  d4: number,
  d5: number
): number {
  const weights = {
    d1: 0.20, // Response Initiation: 20%
    d2: 0.25, // Silence Management: 25%
    d3: 0.25, // Ownership/Assertiveness: 25%
    d4: 0.15, // Emotional Engagement: 15%
    d5: 0.15  // Clarity/Control: 15%
  };
  
  const d1Pct = (d1 / 5) * 100;
  const d2Pct = (d2 / 5) * 100;
  const d3Pct = (d3 / 5) * 100;
  const d4Pct = (d4 / 5) * 100;
  const d5Pct = (d5 / 5) * 100;
  
  const score = 
    weights.d1 * d1Pct +
    weights.d2 * d2Pct +
    weights.d3 * d3Pct +
    weights.d4 * d4Pct +
    weights.d5 * d5Pct;
  
  return Math.round(score);
}

