/**
 * SRS Lab Helper Functions
 * Utilities for creating test cards and running simulations
 */

import type { MemberPhraseCard } from '@/features/phrases/types';

export function createNewCard(phraseId: string = 'phrase-001'): MemberPhraseCard {
  const now = new Date();
  return {
    id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

export function createReviewCard(
  phraseId: string = 'phrase-001',
  intervalDays: number = 7
): MemberPhraseCard {
  const now = new Date();
  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + intervalDays);
  
  return {
    id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

