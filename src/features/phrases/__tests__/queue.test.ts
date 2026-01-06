/**
 * Queue Building Unit Tests
 * Tests session queue building logic
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getDueCards, getNewCards, buildSessionQueue } from '../data/schedulerMock';
import type { MemberPhraseCard } from '../types';

// Helper to create a card
function createCard(
  id: string,
  state: 'new' | 'learning' | 'review' | 'relearning',
  dueAt: Date,
  status: 'active' | 'buried' | 'suspended' | 'removed' = 'active'
): MemberPhraseCard {
  return {
    id,
    member_id: 'test-user',
    phrase_id: `phrase-${id}`,
    status,
    priority: 0,
    scheduler: {
      algorithm: 'fsrs',
      state,
      due_at: dueAt.toISOString(),
      last_reviewed_at: dueAt.toISOString(),
      stability: 7.0,
      difficulty: 5.0,
      repetitions: 1,
      interval_days: 7,
    },
    lapses: 0,
    reviews: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

describe('Queue Building', () => {
  let now: Date;
  
  beforeEach(() => {
    now = new Date('2026-01-02T12:00:00Z');
  });

  describe('getDueCards', () => {
    it('should return only active cards that are due', () => {
      const cards: MemberPhraseCard[] = [
        createCard('1', 'review', new Date(now.getTime() - 1000), 'active'), // Due (past)
        createCard('2', 'review', new Date(now.getTime() + 1000), 'active'), // Not due (future)
        createCard('3', 'review', now, 'active'), // Due (now)
        createCard('4', 'review', new Date(now.getTime() - 1000), 'suspended'), // Suspended (should be excluded)
        createCard('5', 'review', new Date(now.getTime() - 1000), 'buried'), // Buried (should be excluded)
      ];
      
      const dueCards = getDueCards(cards, now);
      
      expect(dueCards).toHaveLength(2);
      expect(dueCards.map(c => c.id)).toContain('1');
      expect(dueCards.map(c => c.id)).toContain('3');
    });

    it('should sort by due date (oldest first)', () => {
      const cards: MemberPhraseCard[] = [
        createCard('1', 'review', new Date(now.getTime() - 3000), 'active'),
        createCard('2', 'review', new Date(now.getTime() - 1000), 'active'),
        createCard('3', 'review', new Date(now.getTime() - 2000), 'active'),
      ];
      
      const dueCards = getDueCards(cards, now);
      
      expect(dueCards[0].id).toBe('1'); // Oldest
      expect(dueCards[1].id).toBe('3');
      expect(dueCards[2].id).toBe('2'); // Newest
    });
  });

  describe('getNewCards', () => {
    it('should return only new cards with active status', () => {
      const cards: MemberPhraseCard[] = [
        createCard('1', 'new', now, 'active'),
        createCard('2', 'new', now, 'active'),
        createCard('3', 'learning', now, 'active'), // Not new
        createCard('4', 'new', now, 'suspended'), // Suspended
        createCard('5', 'review', now, 'active'), // Not new
      ];
      
      const newCards = getNewCards(cards, 10);
      
      expect(newCards).toHaveLength(2);
      expect(newCards.map(c => c.id)).toContain('1');
      expect(newCards.map(c => c.id)).toContain('2');
    });

    it('should respect limit', () => {
      const cards: MemberPhraseCard[] = Array.from({ length: 10 }, (_, i) =>
        createCard(`card-${i}`, 'new', now, 'active')
      );
      
      const newCards = getNewCards(cards, 5);
      
      expect(newCards).toHaveLength(5);
    });
  });

  describe('buildSessionQueue', () => {
    it('should interleave due and new cards (2:1 ratio)', () => {
      const dueCards = Array.from({ length: 6 }, (_, i) =>
        createCard(`due-${i}`, 'review', new Date(now.getTime() - 1000), 'active')
      );
      const newCards = Array.from({ length: 3 }, (_, i) =>
        createCard(`new-${i}`, 'new', now, 'active')
      );
      const allCards = [...dueCards, ...newCards];
      
      const queue = buildSessionQueue(allCards, 10, 10, now);
      
      // Should interleave: 2 due, 1 new, 2 due, 1 new, etc.
      // First 3 should be: due, due, new
      expect(queue[0].id).toMatch(/^due-/);
      expect(queue[1].id).toMatch(/^due-/);
      expect(queue[2].id).toMatch(/^new-/);
    });

    it('should respect new_per_day limit', () => {
      const dueCards = Array.from({ length: 20 }, (_, i) =>
        createCard(`due-${i}`, 'review', new Date(now.getTime() - 1000), 'active')
      );
      const newCards = Array.from({ length: 20 }, (_, i) =>
        createCard(`new-${i}`, 'new', now, 'active')
      );
      const allCards = [...dueCards, ...newCards];
      
      const queue = buildSessionQueue(allCards, 5, 100, now); // Limit new to 5
      
      const newCardCount = queue.filter(c => c.scheduler.state === 'new').length;
      expect(newCardCount).toBeLessThanOrEqual(5);
    });

    it('should respect reviews_per_day limit', () => {
      const dueCards = Array.from({ length: 20 }, (_, i) =>
        createCard(`due-${i}`, 'review', new Date(now.getTime() - 1000), 'active')
      );
      const newCards = Array.from({ length: 5 }, (_, i) =>
        createCard(`new-${i}`, 'new', now, 'active')
      );
      const allCards = [...dueCards, ...newCards];
      
      const queue = buildSessionQueue(allCards, 10, 5, now); // Limit reviews to 5
      
      const dueCardCount = queue.filter(c => c.scheduler.state !== 'new').length;
      expect(dueCardCount).toBeLessThanOrEqual(5);
    });

    it('should handle empty queues gracefully', () => {
      const queue = buildSessionQueue([], 10, 10, now);
      expect(queue).toHaveLength(0);
    });

    it('should prioritize due cards over new cards', () => {
      const dueCards = Array.from({ length: 3 }, (_, i) =>
        createCard(`due-${i}`, 'review', new Date(now.getTime() - 1000), 'active')
      );
      const newCards = Array.from({ length: 10 }, (_, i) =>
        createCard(`new-${i}`, 'new', now, 'active')
      );
      const allCards = [...dueCards, ...newCards];
      
      const queue = buildSessionQueue(allCards, 10, 10, now);
      
      // First cards should be due (prioritized)
      expect(queue[0].scheduler.state).not.toBe('new');
      expect(queue[1].scheduler.state).not.toBe('new');
    });
  });
});

