/**
 * Mock Scheduler - Simple interval-based SRS logic
 * For v0, this is a simplified version. v1 will use FSRS library.
 */

import type { MemberPhraseCard, Rating } from '../types';

// Simple interval rules for v0
const INTERVALS = {
  again: 1, // 1 day
  hard: 1, // 1 day
  good: 3, // 3 days
  easy: 7, // 7 days
};

// Multiplier for subsequent reviews
const EASE_MULTIPLIERS = {
  again: 1.0, // reset
  hard: 1.2,
  good: 2.5,
  easy: 3.0,
};

/**
 * Calculate next review date and update card state
 */
export function calculateNextReview(
  card: MemberPhraseCard,
  rating: Rating
): MemberPhraseCard {
  const now = new Date();
  const currentInterval = card.scheduler.interval_days || 0;
  const currentEaseFactor = card.scheduler.ease_factor || 2.5;
  
  let newInterval: number;
  let newEaseFactor: number;
  let newState = card.scheduler.state;
  let lapses = card.lapses;

  if (rating === 'again') {
    // Reset to learning
    newInterval = INTERVALS.again;
    newEaseFactor = Math.max(1.3, currentEaseFactor - 0.2);
    newState = currentInterval === 0 ? 'learning' : 'relearning';
    lapses += 1;
  } else {
    // Calculate new interval
    if (currentInterval === 0) {
      // First review
      newInterval = INTERVALS[rating];
      newEaseFactor = currentEaseFactor;
      newState = 'learning';
    } else {
      // Subsequent reviews
      const baseMultiplier = EASE_MULTIPLIERS[rating];
      newInterval = Math.round(currentInterval * baseMultiplier);
      newEaseFactor = currentEaseFactor + (rating === 'easy' ? 0.15 : rating === 'hard' ? -0.15 : 0);
      newState = newInterval >= 21 ? 'review' : 'learning';
    }

    // Clamp ease factor
    newEaseFactor = Math.max(1.3, Math.min(3.0, newEaseFactor));
  }

  // Calculate due date
  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + newInterval);

  return {
    ...card,
    scheduler: {
      ...card.scheduler,
      state: newState,
      due_at: dueDate.toISOString(),
      last_reviewed_at: now.toISOString(),
      interval_days: newInterval,
      ease_factor: newEaseFactor,
      repetitions: (card.scheduler.repetitions || 0) + 1,
    },
    lapses,
    reviews: card.reviews + 1,
    updated_at: now.toISOString(),
  };
}

/**
 * Preview intervals for each rating (for UI tooltips)
 */
export function previewIntervals(card: MemberPhraseCard): Record<Rating, string> {
  const currentInterval = card.scheduler.interval_days || 0;
  
  const getIntervalText = (rating: Rating): string => {
    let days: number;
    
    if (rating === 'again') {
      days = INTERVALS.again;
    } else if (currentInterval === 0) {
      days = INTERVALS[rating];
    } else {
      const baseMultiplier = EASE_MULTIPLIERS[rating];
      days = Math.round(currentInterval * baseMultiplier);
    }

    if (days === 0) return 'now';
    if (days === 1) return 'in 1 day';
    if (days < 7) return `in ${days} days`;
    if (days < 30) return `in ${Math.round(days / 7)} weeks`;
    if (days < 365) return `in ${Math.round(days / 30)} months`;
    return `in ${Math.round(days / 365)} years`;
  };

  return {
    again: getIntervalText('again'),
    hard: getIntervalText('hard'),
    good: getIntervalText('good'),
    easy: getIntervalText('easy'),
  };
}

/**
 * Get cards due for review (based on due_at and status)
 */
export function getDueCards(cards: MemberPhraseCard[]): MemberPhraseCard[] {
  const now = new Date();
  return cards
    .filter((card) => card.status === 'active')
    .filter((card) => new Date(card.scheduler.due_at) <= now)
    .sort((a, b) => {
      // Sort by due date (oldest first)
      return new Date(a.scheduler.due_at).getTime() - new Date(b.scheduler.due_at).getTime();
    });
}

/**
 * Get new cards (not yet reviewed)
 */
export function getNewCards(
  cards: MemberPhraseCard[],
  limit: number
): MemberPhraseCard[] {
  return cards
    .filter((card) => card.status === 'active')
    .filter((card) => card.scheduler.state === 'new')
    .slice(0, limit);
}

/**
 * Build session queue (due cards + new cards)
 */
export function buildSessionQueue(
  cards: MemberPhraseCard[],
  newPerDay: number,
  reviewsPerDay: number
): MemberPhraseCard[] {
  const dueCards = getDueCards(cards).slice(0, reviewsPerDay);
  const newCards = getNewCards(cards, newPerDay);
  
  // Interleave: 2 reviews, 1 new (if available)
  const queue: MemberPhraseCard[] = [];
  let dueIndex = 0;
  let newIndex = 0;

  while (dueIndex < dueCards.length || newIndex < newCards.length) {
    // Add 2 due cards
    if (dueIndex < dueCards.length) {
      queue.push(dueCards[dueIndex++]);
    }
    if (dueIndex < dueCards.length) {
      queue.push(dueCards[dueIndex++]);
    }

    // Add 1 new card
    if (newIndex < newCards.length) {
      queue.push(newCards[newIndex++]);
    }
  }

  return queue;
}

/**
 * Format interval for display
 */
export function formatInterval(days: number): string {
  if (days === 0) return 'now';
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  if (days < 30) return `${Math.round(days / 7)} weeks`;
  if (days < 365) return `${Math.round(days / 30)} months`;
  return `${Math.round(days / 365)} years`;
}

