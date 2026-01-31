/**
 * Mock Scheduler - Simple interval-based SRS logic
 * For v0, this is a simplified version. v1 will use FSRS library.
 * 
 * SAFEGUARD: Always validates dates to prevent NaN/Invalid Date
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
 * SAFEGUARD: Validate and fix date to prevent NaN/Invalid Date
 * If date is invalid, returns tomorrow as default
 */
function validateAndFixDate(date: Date | string | null | undefined): Date {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (!date) {
    console.warn('[Scheduler] Invalid date (null/undefined), defaulting to tomorrow');
    return tomorrow;
  }
  
  const parsed = typeof date === 'string' ? new Date(date) : date;
  
  // Check for NaN or Invalid Date
  if (isNaN(parsed.getTime())) {
    console.warn('[Scheduler] Invalid date (NaN), defaulting to tomorrow:', date);
    return tomorrow;
  }
  
  // Check for unreasonably far future dates (> 10 years)
  const tenYearsFromNow = new Date(now);
  tenYearsFromNow.setFullYear(tenYearsFromNow.getFullYear() + 10);
  
  if (parsed.getTime() > tenYearsFromNow.getTime()) {
    console.warn('[Scheduler] Date too far in future (>10 years), defaulting to 1 year:', date);
    const oneYearFromNow = new Date(now);
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    return oneYearFromNow;
  }
  
  return parsed;
}

/**
 * Calculate next review date and update card state
 * SAFEGUARD: Always validates intervals and dates to prevent NaN
 */
export function calculateNextReview(
  card: MemberPhraseCard,
  rating: Rating
): MemberPhraseCard {
  const now = new Date();
  
  // SAFEGUARD: Ensure interval is a valid number
  const currentInterval = typeof card.scheduler.interval_days === 'number' && 
    !isNaN(card.scheduler.interval_days) ? card.scheduler.interval_days : 0;
  
  const currentEaseFactor = typeof card.scheduler.ease_factor === 'number' && 
    !isNaN(card.scheduler.ease_factor) ? card.scheduler.ease_factor : 2.5;
  
  let newInterval: number;
  let newEaseFactor: number;
  let newState = card.scheduler.state;
  let lapses = typeof card.lapses === 'number' && !isNaN(card.lapses) ? card.lapses : 0;

  if (rating === 'again') {
    // Reset to learning
    newInterval = INTERVALS.again;
    newEaseFactor = Math.max(1.3, currentEaseFactor - 0.2);
    newState = currentInterval === 0 ? 'learning' : 'relearning';
    lapses += 1;
  } else if (rating === 'easy') {
    // EASY: Graduate immediately to long-term review
    // Force minimum 7 days, graduate to 'review' state
    if (currentInterval === 0) {
      // First review - jump straight to 7 days
      newInterval = 7;
    } else {
      // Subsequent reviews - multiply by ease multiplier but ensure minimum 7 days
      const baseMultiplier = EASE_MULTIPLIERS.easy;
      newInterval = Math.max(7, Math.round(currentInterval * baseMultiplier));
    }
    // Increase ease factor by 0.2, max 3.0
    newEaseFactor = Math.min(3.0, currentEaseFactor + 0.2);
    // Always graduate to 'review' state for Easy rating
    newState = 'review';
  } else {
    // Calculate new interval for Hard/Good
    if (currentInterval === 0) {
      // First review
      newInterval = INTERVALS[rating];
      newEaseFactor = currentEaseFactor;
      newState = 'learning';
    } else {
      // Subsequent reviews
      const baseMultiplier = EASE_MULTIPLIERS[rating];
      newInterval = Math.round(currentInterval * baseMultiplier);
      newEaseFactor = currentEaseFactor + (rating === 'hard' ? -0.15 : 0);
      newState = newInterval >= 21 ? 'review' : 'learning';
    }

    // Clamp ease factor
    newEaseFactor = Math.max(1.3, Math.min(3.0, newEaseFactor));
  }

  // SAFEGUARD: Ensure newInterval is valid and reasonable
  if (isNaN(newInterval) || !isFinite(newInterval) || newInterval < 0) {
    console.warn('[Scheduler] Invalid interval calculated, defaulting to 1 day:', newInterval);
    newInterval = 1;
  }
  
  // Cap maximum interval at 365 days (1 year)
  if (newInterval > 365) {
    newInterval = 365;
  }

  // Calculate due date with validation
  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + newInterval);
  
  // SAFEGUARD: Final validation of due date
  const validatedDueDate = validateAndFixDate(dueDate);

  return {
    ...card,
    scheduler: {
      ...card.scheduler,
      state: newState,
      due_at: validatedDueDate.toISOString(),
      last_reviewed_at: now.toISOString(),
      interval_days: newInterval,
      ease_factor: newEaseFactor,
      repetitions: (card.scheduler.repetitions || 0) + 1,
    },
    lapses,
    reviews: (typeof card.reviews === 'number' && !isNaN(card.reviews) ? card.reviews : 0) + 1,
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
    } else if (rating === 'easy') {
      // Easy always shows minimum 7 days (will be 10+ in practice after first review)
      if (currentInterval === 0) {
        days = 7;
      } else {
        const baseMultiplier = EASE_MULTIPLIERS.easy;
        days = Math.max(7, Math.round(currentInterval * baseMultiplier));
      }
      // Show "in 10+ days" for Easy to set user expectations
      if (days >= 7) return 'in 10+ days';
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
 * Get cards due for review (based on due_at, status, and state)
 * `now` parameter is injectable to keep tests deterministic.
 */
export function getDueCards(cards: MemberPhraseCard[], now: Date = new Date()): MemberPhraseCard[] {
  const nowTime = now.getTime();
  return cards
    .filter((card) => card.status === 'active')
    // New cards are governed by new_per_day, not due logic
    .filter((card) => card.scheduler.state !== 'new')
    .filter((card) => new Date(card.scheduler.due_at).getTime() <= nowTime)
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
  reviewsPerDay: number,
  now: Date = new Date()
): MemberPhraseCard[] {
  const dueCards = getDueCards(cards, now).slice(0, reviewsPerDay);
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

