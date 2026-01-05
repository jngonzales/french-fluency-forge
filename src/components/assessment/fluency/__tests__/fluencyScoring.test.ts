/**
 * Fluency Scoring Tests
 * Tests determinism and correctness of fluency scoring algorithm
 */

import { describe, it, expect } from 'vitest';
import { calculateSpeedSubscore, calculatePauseSubscore } from '../fluencyScoring';

describe('Fluency Scoring - Determinism', () => {
  it('should return same speed score for same WPM (100× test)', () => {
    const wpm = 95;
    const scores = new Set<number>();
    
    for (let i = 0; i < 100; i++) {
      const score = calculateSpeedSubscore(wpm);
      scores.add(score);
    }
    
    expect(scores.size).toBe(1);
    expect(Array.from(scores)[0]).toBeGreaterThan(0);
  });

  it('should return same pause score for same metrics (100× test)', () => {
    const longPauseCount = 2;
    const maxPause = 1.8;
    const pauseRatio = 0.25;
    const scores = new Set<number>();
    
    for (let i = 0; i < 100; i++) {
      const score = calculatePauseSubscore(longPauseCount, maxPause, pauseRatio);
      scores.add(score);
    }
    
    expect(scores.size).toBe(1);
    expect(Array.from(scores)[0]).toBeGreaterThan(0);
  });
});

describe('Fluency Scoring - Speed Subscore', () => {
  it('should return 0 for 0 WPM', () => {
    expect(calculateSpeedSubscore(0)).toBe(0);
  });

  it('should return 60 for 140+ WPM', () => {
    expect(calculateSpeedSubscore(140)).toBe(60);
    expect(calculateSpeedSubscore(150)).toBe(60);
    expect(calculateSpeedSubscore(200)).toBe(60);
  });

  it('should score 45 WPM in first band (10 points)', () => {
    expect(calculateSpeedSubscore(45)).toBeLessThanOrEqual(10);
  });

  it('should score 110 WPM highly (55 points)', () => {
    const score = calculateSpeedSubscore(110);
    expect(score).toBeGreaterThanOrEqual(54);
    expect(score).toBeLessThanOrEqual(56);
  });

  it('should interpolate within bands', () => {
    const score1 = calculateSpeedSubscore(50);
    const score2 = calculateSpeedSubscore(60);
    const score3 = calculateSpeedSubscore(65);
    
    // Scores should increase
    expect(score2).toBeGreaterThan(score1);
    expect(score3).toBeGreaterThan(score2);
    
    // Should be within expected range
    expect(score1).toBeGreaterThanOrEqual(10);
    expect(score3).toBeLessThanOrEqual(25);
  });
});

describe('Fluency Scoring - Pause Subscore', () => {
  it('should return 40 for perfect (no penalties)', () => {
    expect(calculatePauseSubscore(0, 0.5, 0.1)).toBe(40);
  });

  it('should penalize long pauses (-5 each, cap at -20)', () => {
    expect(calculatePauseSubscore(1, 0.5, 0.1)).toBe(35); // -5
    expect(calculatePauseSubscore(2, 0.5, 0.1)).toBe(30); // -10
    expect(calculatePauseSubscore(5, 0.5, 0.1)).toBe(20); // -20 (capped)
    expect(calculatePauseSubscore(10, 0.5, 0.1)).toBe(20); // -20 (capped)
  });

  it('should penalize max pause > 2.5s (-10)', () => {
    expect(calculatePauseSubscore(0, 3.0, 0.1)).toBe(30); // -10
    expect(calculatePauseSubscore(0, 2.6, 0.1)).toBe(30); // -10
    expect(calculatePauseSubscore(0, 2.5, 0.1)).toBe(40); // No penalty at threshold
  });

  it('should penalize high pause ratio > 0.35 (-10)', () => {
    expect(calculatePauseSubscore(0, 0.5, 0.4)).toBe(30); // -10
    expect(calculatePauseSubscore(0, 0.5, 0.5)).toBe(30); // -10
    expect(calculatePauseSubscore(0, 0.5, 0.35)).toBe(40); // No penalty at threshold
  });

  it('should combine penalties correctly', () => {
    // 2 long pauses (-10), max > 2.5s (-10), ratio > 0.35 (-10)
    expect(calculatePauseSubscore(2, 3.0, 0.4)).toBe(10);
    
    // 4 long pauses (-20 cap), max > 2.5s (-10), ratio > 0.35 (-10)
    // Would be -40 but max penalty is 40, so minimum is 0
    expect(calculatePauseSubscore(5, 3.0, 0.4)).toBe(0);
  });

  it('should never go below 0', () => {
    expect(calculatePauseSubscore(10, 5.0, 0.9)).toBeGreaterThanOrEqual(0);
  });
});

describe('Fluency Scoring - Regression Tests (Fixtures)', () => {
  // Fixture 1: Excellent speaker
  it('should score high for excellent speaker', () => {
    const wpm = 120;
    const longPauses = 0;
    const maxPause = 0.8;
    const pauseRatio = 0.15;
    
    const speedScore = calculateSpeedSubscore(wpm);
    const pauseScore = calculatePauseSubscore(longPauses, maxPause, pauseRatio);
    const total = speedScore + pauseScore;
    
    expect(total).toBeGreaterThanOrEqual(90);
  });

  // Fixture 2: Good speaker with some hesitation
  it('should score medium for good speaker with hesitation', () => {
    const wpm = 85;
    const longPauses = 2;
    const maxPause = 1.5;
    const pauseRatio = 0.25;
    
    const speedScore = calculateSpeedSubscore(wpm);
    const pauseScore = calculatePauseSubscore(longPauses, maxPause, pauseRatio);
    const total = speedScore + pauseScore;
    
    expect(total).toBeGreaterThanOrEqual(60);
    expect(total).toBeLessThanOrEqual(80);
  });

  // Fixture 3: Beginner with many pauses
  it('should score low for beginner with many pauses', () => {
    const wpm = 45;
    const longPauses = 5;
    const maxPause = 3.5;
    const pauseRatio = 0.45;
    
    const speedScore = calculateSpeedSubscore(wpm);
    const pauseScore = calculatePauseSubscore(longPauses, maxPause, pauseRatio);
    const total = speedScore + pauseScore;
    
    expect(total).toBeLessThanOrEqual(30);
  });

  // Fixture 4: Fast but choppy
  it('should score medium for fast but choppy speaker', () => {
    const wpm = 130;
    const longPauses = 3;
    const maxPause = 2.8;
    const pauseRatio = 0.3;
    
    const speedScore = calculateSpeedSubscore(wpm);
    const pauseScore = calculatePauseSubscore(longPauses, maxPause, pauseRatio);
    const total = speedScore + pauseScore;
    
    // High speed but significant pause penalties
    expect(speedScore).toBeGreaterThanOrEqual(58);
    expect(pauseScore).toBeLessThanOrEqual(15);
    expect(total).toBeGreaterThanOrEqual(60);
    expect(total).toBeLessThanOrEqual(75);
  });

  // Fixture 5: Slow but smooth
  it('should score medium for slow but smooth speaker', () => {
    const wpm = 60;
    const longPauses = 0;
    const maxPause = 1.0;
    const pauseRatio = 0.18;
    
    const speedScore = calculateSpeedSubscore(wpm);
    const pauseScore = calculatePauseSubscore(longPauses, maxPause, pauseRatio);
    const total = speedScore + pauseScore;
    
    // Low speed but no pause penalties
    expect(speedScore).toBeLessThanOrEqual(25);
    expect(pauseScore).toBe(40);
    expect(total).toBeGreaterThanOrEqual(50);
    expect(total).toBeLessThanOrEqual(65);
  });

  // Fixture 6: Edge case - very slow
  it('should handle very slow speaker', () => {
    const wpm = 20;
    const longPauses = 8;
    const maxPause = 4.0;
    const pauseRatio = 0.6;
    
    const speedScore = calculateSpeedSubscore(wpm);
    const pauseScore = calculatePauseSubscore(longPauses, maxPause, pauseRatio);
    const total = speedScore + pauseScore;
    
    expect(total).toBeGreaterThanOrEqual(0);
    expect(total).toBeLessThanOrEqual(15);
  });
});

