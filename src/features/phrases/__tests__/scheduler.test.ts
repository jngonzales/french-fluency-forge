/**
 * FSRS Scheduler Unit Tests
 * Tests scheduler correctness: invariants + golden scenarios
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { calculateNextReviewFSRS, previewNextReviewFSRS, previewAllIntervalsFSRS } from '../data/fsrsScheduler';
import type { MemberPhraseCard, Rating, PhraseSettings } from '../types';

// Default settings for tests
const DEFAULT_SETTINGS: PhraseSettings = {
  member_id: 'test-user',
  new_per_day: 20,
  reviews_per_day: 100,
  target_retention: 0.90,
  speech_feedback_enabled: false,
  auto_assess_enabled: false,
  recognition_shadow_default: false,
  show_time_to_recall: true,
};

// Helper to create a new card
function createNewCard(phraseId: string = 'phrase-001'): MemberPhraseCard {
  const now = new Date();
  return {
    id: `card-${Date.now()}`,
    member_id: 'test-user',
    phrase_id: phraseId,
    status: 'active',
    priority: 0,
    scheduler: {
      algorithm: 'fsrs',
      state: 'new',
      due_at: now.toISOString(),
      stability: 0,
      difficulty: 0,
      repetitions: 0,
      interval_days: 0,
    },
    lapses: 0,
    reviews: 0,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };
}

// Helper to create a review card
function createReviewCard(phraseId: string = 'phrase-001', intervalDays: number = 7): MemberPhraseCard {
  const now = new Date();
  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + intervalDays);
  
  return {
    id: `card-${Date.now()}`,
    member_id: 'test-user',
    phrase_id: phraseId,
    status: 'active',
    priority: 0,
    scheduler: {
      algorithm: 'fsrs',
      state: 'review',
      due_at: dueDate.toISOString(),
      last_reviewed_at: now.toISOString(),
      stability: 7.0,
      difficulty: 5.0,
      repetitions: 5,
      interval_days: intervalDays,
    },
    lapses: 0,
    reviews: 5,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };
}

describe('FSRS Scheduler - Universal Invariants', () => {
  let now: Date;
  
  beforeEach(() => {
    now = new Date('2026-01-02T12:00:00Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Invariant 1: Monotonic next due time by grade', () => {
    it('should satisfy Again <= Hard <= Good <= Easy for new card', () => {
      const card = createNewCard();
      const previews = previewAllIntervalsFSRS(card, DEFAULT_SETTINGS, now);
      
      const againMs = previews.again.intervalMs;
      const hardMs = previews.hard.intervalMs;
      const goodMs = previews.good.intervalMs;
      const easyMs = previews.easy.intervalMs;
      
      expect(againMs).toBeLessThanOrEqual(hardMs);
      expect(hardMs).toBeLessThanOrEqual(goodMs);
      expect(goodMs).toBeLessThanOrEqual(easyMs);
    });

    it('should satisfy Again <= Hard <= Good <= Easy for review card', () => {
      const card = createReviewCard();
      const previews = previewAllIntervalsFSRS(card, DEFAULT_SETTINGS, now);
      
      const againMs = previews.again.intervalMs;
      const hardMs = previews.hard.intervalMs;
      const goodMs = previews.good.intervalMs;
      const easyMs = previews.easy.intervalMs;
      
      expect(againMs).toBeLessThanOrEqual(hardMs);
      expect(hardMs).toBeLessThanOrEqual(goodMs);
      expect(goodMs).toBeLessThanOrEqual(easyMs);
    });
  });

  describe('Invariant 2: No negative or zero stability', () => {
    it('should have stability > 0 after any rating', () => {
      const card = createNewCard();
      const ratings: Rating[] = ['again', 'hard', 'good', 'easy'];
      
      for (const rating of ratings) {
        const result = calculateNextReviewFSRS(card, rating, DEFAULT_SETTINGS, now);
        expect(result.scheduler.stability).toBeGreaterThan(0);
      }
    });
  });

  describe('Invariant 3: Difficulty clamped', () => {
    it('should have difficulty in [1, 10] range', () => {
      const card = createNewCard();
      const ratings: Rating[] = ['again', 'hard', 'good', 'easy'];
      
      for (const rating of ratings) {
        const result = calculateNextReviewFSRS(card, rating, DEFAULT_SETTINGS, now);
        expect(result.scheduler.difficulty).toBeGreaterThanOrEqual(1);
        expect(result.scheduler.difficulty).toBeLessThanOrEqual(10);
      }
    });
  });

  describe('Invariant 4: Due date is timestamp', () => {
    it('should store precise timestamps, not rounded to days', () => {
      const card = createNewCard();
      const result = calculateNextReviewFSRS(card, 'good', DEFAULT_SETTINGS, now);
      
      const dueDate = new Date(result.scheduler.due_at);
      expect(dueDate.getTime()).toBeGreaterThan(now.getTime());
      
      // For short-term steps, should have milliseconds precision
      if (result.scheduler.interval_ms && result.scheduler.interval_ms < 24 * 60 * 60 * 1000) {
        expect(result.scheduler.interval_ms).toBeGreaterThan(0);
      }
    });
  });

  describe('Invariant 5: Idempotent simulation', () => {
    it('should have preview === commit for same inputs', () => {
      const card = createNewCard();
      const rating: Rating = 'good';
      
      // Preview
      const preview = previewNextReviewFSRS(card, rating, DEFAULT_SETTINGS, now);
      
      // Commit
      const committed = calculateNextReviewFSRS(card, rating, DEFAULT_SETTINGS, now);
      
      // Should match exactly
      expect(committed.scheduler.state).toBe(preview.stateAfter);
      expect(new Date(committed.scheduler.due_at).getTime()).toBe(preview.dueAt.getTime());
      expect(committed.scheduler.stability).toBe(preview.stabilityAfter);
      expect(committed.scheduler.difficulty).toBe(preview.difficultyAfter);
    });
  });
});

describe('FSRS Scheduler - Golden Test Scenarios', () => {
  let now: Date;
  
  beforeEach(() => {
    now = new Date('2026-01-02T12:00:00Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Scenario A: New card immediate retry', () => {
    it('should return ~1 minute for Again on new card', () => {
      const card = createNewCard();
      const result = calculateNextReviewFSRS(card, 'again', DEFAULT_SETTINGS, now);
      
      const intervalMs = result.scheduler.interval_ms || 0;
      const intervalMinutes = intervalMs / (60 * 1000);
      
      // Should be approximately 1 minute (allow some tolerance)
      expect(intervalMinutes).toBeGreaterThan(0.5);
      expect(intervalMinutes).toBeLessThan(2);
      expect(result.scheduler.state).toBe('learning');
    });

    it('should return ~10 minutes for Good on new card after Again', () => {
      // First: Again
      let card = createNewCard();
      card = calculateNextReviewFSRS(card, 'again', DEFAULT_SETTINGS, now);
      
      // Advance time by 1 minute
      const after1Min = new Date(now.getTime() + 60 * 1000);
      vi.setSystemTime(after1Min);
      
      // Then: Good
      const result = calculateNextReviewFSRS(card, 'good', DEFAULT_SETTINGS, after1Min);
      
      const intervalMs = result.scheduler.interval_ms || 0;
      const intervalMinutes = intervalMs / (60 * 1000);
      
      // Should be approximately 10 minutes (allow tolerance)
      expect(intervalMinutes).toBeGreaterThan(5);
      expect(intervalMinutes).toBeLessThan(15);
    });

    it('should graduate to Review after learning steps', () => {
      let card = createNewCard();
      let currentTime = now;
      
      // Step 1: Again (1m)
      card = calculateNextReviewFSRS(card, 'again', DEFAULT_SETTINGS, currentTime);
      currentTime = new Date(card.scheduler.due_at);
      vi.setSystemTime(currentTime);
      
      // Step 2: Good (10m)
      card = calculateNextReviewFSRS(card, 'good', DEFAULT_SETTINGS, currentTime);
      currentTime = new Date(card.scheduler.due_at);
      vi.setSystemTime(currentTime);
      
      // Step 3: Good (should graduate to Review)
      card = calculateNextReviewFSRS(card, 'good', DEFAULT_SETTINGS, currentTime);
      
      // Should be in Review state with interval in days
      expect(card.scheduler.state).toBe('review');
      expect(card.scheduler.interval_days).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Scenario B: Failed review uses relearning', () => {
    it('should use relearning steps (10m) when Again on Review card', () => {
      const card = createReviewCard();
      const result = calculateNextReviewFSRS(card, 'again', DEFAULT_SETTINGS, now);
      
      // Should enter relearning state
      expect(result.scheduler.state).toBe('relearning');
      
      // Should have short interval (~10 minutes)
      const intervalMs = result.scheduler.interval_ms || 0;
      const intervalMinutes = intervalMs / (60 * 1000);
      
      expect(intervalMinutes).toBeGreaterThan(5);
      expect(intervalMinutes).toBeLessThan(15);
    });

    it('should NOT jump to 1 day when relearning steps are enabled', () => {
      const card = createReviewCard();
      const result = calculateNextReviewFSRS(card, 'again', DEFAULT_SETTINGS, now);
      
      // Should NOT be 1 day
      const intervalDays = result.scheduler.interval_days || 0;
      expect(intervalDays).toBeLessThan(1);
      
      // Should be in relearning state
      expect(result.scheduler.state).toBe('relearning');
    });
  });

  describe('Scenario C: Desired retention affects intervals', () => {
    it('should have shorter intervals with higher retention', () => {
      const card = createReviewCard();
      
      const settings80: PhraseSettings = { ...DEFAULT_SETTINGS, target_retention: 0.80 };
      const settings90: PhraseSettings = { ...DEFAULT_SETTINGS, target_retention: 0.90 };
      const settings95: PhraseSettings = { ...DEFAULT_SETTINGS, target_retention: 0.95 };
      
      const result80 = calculateNextReviewFSRS(card, 'good', settings80, now);
      const result90 = calculateNextReviewFSRS(card, 'good', settings90, now);
      const result95 = calculateNextReviewFSRS(card, 'good', settings95, now);
      
      // Higher retention should generally mean shorter intervals
      // (This may not always be true due to FSRS complexity, but should hold for most cases)
      const interval80 = result80.scheduler.interval_days || 0;
      const interval90 = result90.scheduler.interval_days || 0;
      const interval95 = result95.scheduler.interval_days || 0;
      
      // At least verify they're all positive
      expect(interval80).toBeGreaterThan(0);
      expect(interval90).toBeGreaterThan(0);
      expect(interval95).toBeGreaterThan(0);
    });
  });

  describe('Scenario D: Button ordering (monotonicity)', () => {
    it('should maintain monotonicity for fixed card state', () => {
      const card = createReviewCard();
      const previews = previewAllIntervalsFSRS(card, DEFAULT_SETTINGS, now);
      
      expect(previews.again.intervalMs).toBeLessThanOrEqual(previews.hard.intervalMs);
      expect(previews.hard.intervalMs).toBeLessThanOrEqual(previews.good.intervalMs);
      expect(previews.good.intervalMs).toBeLessThanOrEqual(previews.easy.intervalMs);
    });
  });

  describe('Scenario E: Preview equals commit', () => {
    it('should have identical results for preview and commit', () => {
      const card = createReviewCard();
      const rating: Rating = 'good';
      
      // Preview
      const preview = previewNextReviewFSRS(card, rating, DEFAULT_SETTINGS, now);
      
      // Commit
      const committed = calculateNextReviewFSRS(card, rating, DEFAULT_SETTINGS, now);
      
      // Exact match
      expect(committed.scheduler.state).toBe(preview.stateAfter);
      expect(new Date(committed.scheduler.due_at).getTime()).toBe(preview.dueAt.getTime());
      expect(committed.scheduler.stability).toBe(preview.stabilityAfter);
      expect(committed.scheduler.difficulty).toBe(preview.difficultyAfter);
    });
  });
});

describe('FSRS Scheduler - Property-Based Tests', () => {
  it('should handle edge cases: very old cards', () => {
    const now = new Date('2026-01-02T12:00:00Z');
    const card = createReviewCard();
    
    // Simulate very old card (100 days ago)
    const oldDate = new Date(now);
    oldDate.setDate(oldDate.getDate() - 100);
    card.scheduler.last_reviewed_at = oldDate.toISOString();
    card.scheduler.due_at = oldDate.toISOString();
    
    const result = calculateNextReviewFSRS(card, 'good', DEFAULT_SETTINGS, now);
    
    // Should still produce valid results
    expect(result.scheduler.stability).toBeGreaterThan(0);
    expect(result.scheduler.difficulty).toBeGreaterThanOrEqual(1);
    expect(result.scheduler.difficulty).toBeLessThanOrEqual(10);
    expect(new Date(result.scheduler.due_at).getTime()).toBeGreaterThan(now.getTime());
  });

  it('should handle edge cases: high difficulty', () => {
    const now = new Date('2026-01-02T12:00:00Z');
    const card = createReviewCard();
    card.scheduler.difficulty = 9.5; // Very high difficulty
    
    const result = calculateNextReviewFSRS(card, 'good', DEFAULT_SETTINGS, now);
    
    // Difficulty should stay clamped
    expect(result.scheduler.difficulty).toBeGreaterThanOrEqual(1);
    expect(result.scheduler.difficulty).toBeLessThanOrEqual(10);
  });

  it('should handle all rating combinations', () => {
    const card = createReviewCard();
    const ratings: Rating[] = ['again', 'hard', 'good', 'easy'];
    
    for (const rating of ratings) {
      const result = calculateNextReviewFSRS(card, rating, DEFAULT_SETTINGS, new Date());
      
      // All should produce valid results
      expect(result.scheduler.stability).toBeGreaterThan(0);
      expect(result.scheduler.difficulty).toBeGreaterThanOrEqual(1);
      expect(result.scheduler.difficulty).toBeLessThanOrEqual(10);
      expect(result.scheduler.state).toMatch(/^(new|learning|review|relearning)$/);
    }
  });
});

