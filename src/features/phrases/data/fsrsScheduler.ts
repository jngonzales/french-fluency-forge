/**
 * FSRS-6 Scheduler Implementation
 * Uses ts-fsrs library for state-of-the-art spaced repetition
 */

import { fsrs, Rating, State, type Card, type CardInput, type FSRSParameters, type Grade } from 'ts-fsrs';
import type { MemberPhraseCard, Rating as SolvRating, PhraseSettings } from '../types';

// Map SOLV ratings to FSRS ratings
const RATING_MAP: Record<SolvRating, Rating> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

// Map FSRS ratings to SOLV ratings
const FSRS_TO_SOLV_RATING: Record<Rating, SolvRating> = {
  [Rating.Manual]: 'good', // fallback
  [Rating.Again]: 'again',
  [Rating.Hard]: 'hard',
  [Rating.Good]: 'good',
  [Rating.Easy]: 'easy',
};

// Convert FSRS state to SOLV state
function fsrsStateToSolvState(fsrsState: State): 'new' | 'learning' | 'review' | 'relearning' {
  if (fsrsState === State.New) return 'new';
  if (fsrsState === State.Learning) return 'learning';
  if (fsrsState === State.Review) return 'review';
  if (fsrsState === State.Relearning) return 'relearning';
  return 'review'; // fallback
}

// Convert SOLV state to FSRS state
function solvStateToFSRSState(solvState: string): State {
  if (solvState === 'new') return State.New;
  if (solvState === 'learning') return State.Learning;
  if (solvState === 'review') return State.Review;
  if (solvState === 'relearning') return State.Relearning;
  return State.New; // fallback
}

// FSRS configuration from settings
export interface FSRSConfig {
  requestRetention: number; // 0.75-0.95, default 0.90
  learningSteps: string[]; // e.g., ["1m", "10m"]
  relearningSteps: string[]; // e.g., ["10m"]
  enableFuzz: boolean; // default false for QA
  enableShortTerm: boolean; // default true
}

// Default configuration
const DEFAULT_CONFIG: FSRSConfig = {
  requestRetention: 0.90,
  learningSteps: ['1m', '10m'],
  relearningSteps: ['10m'],
  enableFuzz: false,
  enableShortTerm: true,
};

// Create FSRS instance with config
function createFSRS(config: FSRSConfig = DEFAULT_CONFIG): ReturnType<typeof fsrs> {
  const params: Partial<FSRSParameters> = {
    request_retention: config.requestRetention,
    enable_fuzz: config.enableFuzz,
    enable_short_term: config.enableShortTerm,
    learning_steps: config.learningSteps as any,
    relearning_steps: config.relearningSteps as any,
  };
  
  return fsrs(params);
}

// Convert SOLV card to FSRS card input
function solvCardToFSRS(card: MemberPhraseCard, now: Date): CardInput {
  const lastReviewDate = card.scheduler.last_reviewed_at 
    ? new Date(card.scheduler.last_reviewed_at)
    : now;
  
  // Calculate elapsed_days since last review
  const elapsedDays = Math.floor((now.getTime() - lastReviewDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const cardInput: CardInput = {
    due: new Date(card.scheduler.due_at),
    stability: card.scheduler.stability ?? 0,
    difficulty: card.scheduler.difficulty ?? 0,
    elapsed_days: Math.max(0, elapsedDays),
    scheduled_days: card.scheduler.interval_days || 0,
    learning_steps: 0,
    reps: card.scheduler.repetitions || 0,
    lapses: card.lapses,
    state: solvStateToFSRSState(card.scheduler.state),
    last_review: lastReviewDate,
  };
  
  return cardInput;
}

// Convert FSRS card result to SOLV card
function fsrsResultToSolvCard(
  originalCard: MemberPhraseCard,
  fsrsCard: Card,
  now: Date
): MemberPhraseCard {
  const newState = fsrsStateToSolvState(fsrsCard.state);
  
  // Calculate interval in milliseconds
  const dueTime = fsrsCard.due.getTime();
  const nowTime = now.getTime();
  const intervalMs = dueTime - nowTime;
  
  // Convert to days for display (if >= 1 day)
  const intervalDays = intervalMs >= 24 * 60 * 60 * 1000 
    ? Math.floor(intervalMs / (24 * 60 * 60 * 1000))
    : 0;
  
  // Check if this is a lapse (state changed to relearning)
  const isLapse = newState === 'relearning' && originalCard.scheduler.state !== 'relearning';
  
  return {
    ...originalCard,
    scheduler: {
      algorithm: 'fsrs',
      state: newState,
      due_at: fsrsCard.due.toISOString(),
      last_reviewed_at: now.toISOString(),
      stability: fsrsCard.stability,
      difficulty: fsrsCard.difficulty,
      interval_days: intervalDays,
      interval_ms: intervalMs,
      repetitions: fsrsCard.reps,
    },
    lapses: isLapse ? originalCard.lapses + 1 : originalCard.lapses,
    reviews: originalCard.reviews + 1,
    updated_at: now.toISOString(),
  };
}

/**
 * Calculate next review using FSRS-6
 */
export function calculateNextReviewFSRS(
  card: MemberPhraseCard,
  rating: SolvRating,
  settings: PhraseSettings,
  now: Date = new Date(),
  config?: Partial<FSRSConfig>
): MemberPhraseCard {
  const fullConfig: FSRSConfig = {
    ...DEFAULT_CONFIG,
    requestRetention: settings.target_retention,
    ...config,
  };
  
  const fsrsInstance = createFSRS(fullConfig);
  const fsrsCard = solvCardToFSRS(card, now);
  const fsrsRating = RATING_MAP[rating] as Grade;
  
  // Review the card with FSRS
  const result = fsrsInstance.next(fsrsCard, now, fsrsRating);
  
  // Convert result back to SOLV card
  return fsrsResultToSolvCard(card, result.card, now);
}

/**
 * Preview next review without persisting
 */
export function previewNextReviewFSRS(
  card: MemberPhraseCard,
  rating: SolvRating,
  settings: PhraseSettings,
  now: Date = new Date(),
  config?: Partial<FSRSConfig>
): {
  stateAfter: 'new' | 'learning' | 'review' | 'relearning';
  dueAt: Date;
  intervalMs: number;
  stabilityAfter: number;
  difficultyAfter: number;
} {
  const result = calculateNextReviewFSRS(card, rating, settings, now, config);
  
  return {
    stateAfter: result.scheduler.state,
    dueAt: new Date(result.scheduler.due_at),
    intervalMs: result.scheduler.interval_ms || 0,
    stabilityAfter: result.scheduler.stability || 0,
    difficultyAfter: result.scheduler.difficulty || 0,
  };
}

/**
 * Preview intervals for all ratings (for UI)
 */
export function previewAllIntervalsFSRS(
  card: MemberPhraseCard,
  settings: PhraseSettings,
  now: Date = new Date()
): Record<SolvRating, { intervalMs: number; dueAt: Date; stateAfter: string }> {
  const ratings: SolvRating[] = ['again', 'hard', 'good', 'easy'];
  const previews: Record<SolvRating, { intervalMs: number; dueAt: Date; stateAfter: string }> = {} as any;
  
  for (const rating of ratings) {
    const preview = previewNextReviewFSRS(card, rating, settings, now);
    previews[rating] = {
      intervalMs: preview.intervalMs,
      dueAt: preview.dueAt,
      stateAfter: preview.stateAfter,
    };
  }
  
  return previews;
}

/**
 * Format interval for display
 */
export function formatIntervalFSRS(intervalMs: number): string {
  if (intervalMs < 60 * 1000) {
    // Less than 1 minute: show seconds
    const seconds = Math.floor(intervalMs / 1000);
    return seconds === 1 ? '1s' : `${seconds}s`;
  }
  
  if (intervalMs < 60 * 60 * 1000) {
    // Less than 1 hour: show minutes
    const minutes = Math.floor(intervalMs / (60 * 1000));
    return minutes === 1 ? '1m' : `${minutes}m`;
  }
  
  if (intervalMs < 24 * 60 * 60 * 1000) {
    // Less than 1 day: show hours and minutes
    const hours = Math.floor(intervalMs / (60 * 60 * 1000));
    const minutes = Math.floor((intervalMs % (60 * 60 * 1000)) / (60 * 1000));
    if (minutes === 0) {
      return hours === 1 ? '1h' : `${hours}h`;
    }
    return `${hours}h ${minutes}m`;
  }
  
  // 1 day or more: show days
  const days = Math.floor(intervalMs / (24 * 60 * 60 * 1000));
  return days === 1 ? '1 day' : `${days} days`;
}

/**
 * Get retrievability (probability of recall) for a card at a given time
 */
export function getRetrievabilityFSRS(
  card: MemberPhraseCard,
  now: Date = new Date(),
  settings: PhraseSettings
): number {
  const config: FSRSConfig = {
    ...DEFAULT_CONFIG,
    requestRetention: settings.target_retention,
  };
  
  const fsrsInstance = createFSRS(config);
  const fsrsCard = solvCardToFSRS(card, now);
  
  return fsrsInstance.get_retrievability(fsrsCard, now, false) as number;
}
