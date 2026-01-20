/**
 * FSRS-6 Scheduler
 * Uses ts-fsrs library for state-of-the-art spaced repetition
 * Implements short-term learning steps (micro-steps) for same-session retries
 */

import { createEmptyCard, FSRS, Rating as FSRSRating, Card as FSRSCard, Grade } from 'ts-fsrs';
import type { MemberPhraseCard, Rating, SchedulerState, PhraseSettings } from '../types';

// FSRS Configuration
export interface FSRSConfig {
  request_retention: number; // 0.75-0.95, default 0.90
  learning_steps: string[]; // e.g., ["30s", "5m", "20m"]
  relearning_steps: string[]; // e.g., ["2m", "10m"]
  enable_fuzz: boolean; // false for v1 (deterministic)
  enable_short_term: boolean; // true to enable micro-steps
}

// Default config (SOLV v1)
export const DEFAULT_FSRS_CONFIG: FSRSConfig = {
  request_retention: 0.90,
  learning_steps: ['30s', '5m', '20m'],
  relearning_steps: ['2m', '10m'],
  enable_fuzz: false,
  enable_short_term: true,
};

// Convert time string to milliseconds
function parseTimeString(timeStr: string): number {
  const match = timeStr.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid time string: ${timeStr}`);
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: throw new Error(`Unknown time unit: ${unit}`);
  }
}

// Convert milliseconds to time string
function formatTimeString(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60 * 1000) return `${Math.round(ms / 1000)}s`;
  if (ms < 60 * 60 * 1000) return `${Math.round(ms / (60 * 1000))}m`;
  if (ms < 24 * 60 * 60 * 1000) return `${Math.round(ms / (60 * 60 * 1000))}h`;
  const days = Math.round(ms / (24 * 60 * 60 * 1000));
  return `${days}d`;
}

// Convert SOLV Rating to FSRS Grade (not Rating, since Grade excludes Manual)
function ratingToFSRS(rating: Rating): Grade {
  switch (rating) {
    case 'again': return FSRSRating.Again;
    case 'hard': return FSRSRating.Hard;
    case 'good': return FSRSRating.Good;
    case 'easy': return FSRSRating.Easy;
  }
}

// Convert FSRS state to SOLV SchedulerState
function fsrsStateToSchedulerState(card: FSRSCard): SchedulerState {
  if (card.state === 0) return 'new';
  if (card.state === 1) return 'learning';
  if (card.state === 2) return 'review';
  if (card.state === 3) return 'relearning';
  return 'new';
}

// Safely parse a date string, returning fallback if invalid
function safeParseDate(dateStr: string | null | undefined, fallback: Date): Date {
  if (!dateStr) return fallback;
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? fallback : parsed;
}

// Convert MemberPhraseCard to FSRS Card
function cardToFSRS(card: MemberPhraseCard, now: Date): FSRSCard {
  const dueDate = safeParseDate(card.scheduler.due_at, now);
  const lastReviewDate = card.scheduler.last_reviewed_at 
    ? safeParseDate(card.scheduler.last_reviewed_at, undefined as unknown as Date)
    : undefined;
  
  // If card has FSRS state stored, use it
  if (card.scheduler.scheduler_state_jsonb && typeof card.scheduler.scheduler_state_jsonb === 'object') {
    const fsrsState = card.scheduler.scheduler_state_jsonb as any;
    return {
      due: dueDate,
      stability: card.scheduler.stability || 0,
      difficulty: card.scheduler.difficulty || 0,
      elapsed_days: lastReviewDate
        ? (now.getTime() - lastReviewDate.getTime()) / (1000 * 60 * 60 * 24)
        : 0,
      scheduled_days: 0,
      reps: card.reviews || 0,
      lapses: card.lapses || 0,
      state: card.scheduler.state === 'new' ? 0
        : card.scheduler.state === 'learning' ? 1
        : card.scheduler.state === 'review' ? 2
        : 3,
      last_review: lastReviewDate,
    } as FSRSCard;
  }
  
  // Otherwise, create from scratch
  const fsrsCard = createEmptyCard();
  fsrsCard.due = dueDate;
  fsrsCard.reps = card.reviews || 0;
  fsrsCard.lapses = card.lapses || 0;
  fsrsCard.state = card.scheduler.state === 'new' ? 0
    : card.scheduler.state === 'learning' ? 1
    : card.scheduler.state === 'review' ? 2
    : 3;
  fsrsCard.last_review = lastReviewDate;
  
  return fsrsCard;
}

// Convert FSRS Card to MemberPhraseCard update
function fsrsToCardUpdate(
  card: MemberPhraseCard,
  fsrsCard: FSRSCard,
  intervalMs: number,
  now: Date
): Partial<MemberPhraseCard> {
  // Safely get ISO string from a date, with fallback
  const safeDateToISOString = (date: Date | undefined): string | undefined => {
    if (!date) return undefined;
    if (isNaN(date.getTime())) return now.toISOString();
    return date.toISOString();
  };
  
  const dueIsoString = safeDateToISOString(fsrsCard.due) || now.toISOString();
  const lastReviewIsoString = safeDateToISOString(fsrsCard.last_review);
  
  return {
    scheduler: {
      ...card.scheduler,
      state: fsrsStateToSchedulerState(fsrsCard),
      due_at: dueIsoString,
      last_reviewed_at: now.toISOString(),
      stability: fsrsCard.stability,
      difficulty: fsrsCard.difficulty,
      interval_ms: intervalMs,
      scheduler_state_jsonb: {
        due: dueIsoString,
        stability: fsrsCard.stability,
        difficulty: fsrsCard.difficulty,
        elapsed_days: fsrsCard.elapsed_days,
        scheduled_days: fsrsCard.scheduled_days,
        reps: fsrsCard.reps,
        lapses: fsrsCard.lapses,
        state: fsrsCard.state,
        last_review: lastReviewIsoString,
      },
    },
    lapses: fsrsCard.lapses,
    reviews: fsrsCard.reps,
    updated_at: now.toISOString(),
  };
}

// Initialize FSRS instance
export function initializeFSRS(config: FSRSConfig = DEFAULT_FSRS_CONFIG): FSRS {
  const fsrs = new FSRS({
    request_retention: config.request_retention,
    enable_fuzz: config.enable_fuzz,
  });
  
  return fsrs;
}

// Calculate next review with FSRS
export function calculateNextReviewFSRS(
  card: MemberPhraseCard,
  rating: Rating,
  config: FSRSConfig = DEFAULT_FSRS_CONFIG,
  now: Date = new Date()
): {
  card: MemberPhraseCard;
  intervalMs: number;
  dueAt: Date;
} {
  const fsrs = initializeFSRS(config);
  const fsrsCard = cardToFSRS(card, now);
  const fsrsRating = ratingToFSRS(rating);
  
  // Handle short-term steps
  if (config.enable_short_term) {
    const isNew = card.scheduler.state === 'new';
    const isRelearning = card.scheduler.state === 'relearning';
    
    if (rating === 'again' && (isNew || isRelearning)) {
      // Reset to first step
      const steps = isNew ? config.learning_steps : config.relearning_steps;
      const firstStepMs = parseTimeString(steps[0]);
      const dueAt = new Date(now.getTime() + firstStepMs);
      
      return {
        card: {
          ...card,
          ...fsrsToCardUpdate(card, fsrsCard, firstStepMs, now),
          scheduler: {
            ...card.scheduler,
            state: isNew ? 'learning' : 'relearning',
            short_term_step_index: 0,
          },
        },
        intervalMs: firstStepMs,
        dueAt,
      };
    }
    
    // Check if we're in a learning/relearning step
    if (card.scheduler.short_term_step_index !== undefined && card.scheduler.short_term_step_index !== null) {
      const steps = card.scheduler.state === 'learning' ? config.learning_steps : config.relearning_steps;
      const currentStepIndex = card.scheduler.short_term_step_index;
      
      if (rating === 'good' || rating === 'easy') {
        // Advance to next step
        if (currentStepIndex < steps.length - 1) {
          const nextStepMs = parseTimeString(steps[currentStepIndex + 1]);
          const dueAt = new Date(now.getTime() + nextStepMs);
          
          return {
            card: {
              ...card,
              ...fsrsToCardUpdate(card, fsrsCard, nextStepMs, now),
              scheduler: {
                ...card.scheduler,
                short_term_step_index: currentStepIndex + 1,
              },
            },
            intervalMs: nextStepMs,
            dueAt,
          };
        } else {
          // Graduate to review
          const scheduled = fsrs.next(fsrsCard, now, fsrsRating);
          const intervalMs = scheduled.card.due.getTime() - now.getTime();
          
          return {
            card: {
              ...card,
              ...fsrsToCardUpdate(card, scheduled.card, intervalMs, now),
              scheduler: {
                ...card.scheduler,
                state: 'review',
                short_term_step_index: undefined,
              },
            },
            intervalMs,
            dueAt: scheduled.card.due,
          };
        }
      }
    }
  }
  
  // Standard FSRS scheduling (review state or no short-term)
  const scheduled = fsrs.next(fsrsCard, now, fsrsRating);
  const intervalMs = scheduled.card.due.getTime() - now.getTime();
  
  return {
    card: {
      ...card,
      ...fsrsToCardUpdate(card, scheduled.card, intervalMs, now),
    },
    intervalMs,
    dueAt: scheduled.card.due,
  };
}

// Preview all rating outcomes
export function previewAllIntervalsFSRS(
  card: MemberPhraseCard,
  config: FSRSConfig = DEFAULT_FSRS_CONFIG,
  now: Date = new Date()
): Record<Rating, { due_at: string; interval_ms: number; label: string }> {
  const ratings: Rating[] = ['again', 'hard', 'good', 'easy'];
  const result: Record<Rating, { due_at: string; interval_ms: number; label: string }> = {} as any;
  
  for (const rating of ratings) {
    const { dueAt, intervalMs } = calculateNextReviewFSRS(card, rating, config, now);
    // Safely convert to ISO string
    const dueAtIso = isNaN(dueAt.getTime()) ? now.toISOString() : dueAt.toISOString();
    result[rating] = {
      due_at: dueAtIso,
      interval_ms: intervalMs,
      label: formatIntervalFSRS(intervalMs),
    };
  }
  
  return result;
}

// Format interval for display
export function formatIntervalFSRS(intervalMs: number): string {
  if (intervalMs < 0) return 'overdue';
  if (intervalMs < 1000) return 'now';
  if (intervalMs < 60 * 1000) return `${Math.round(intervalMs / 1000)}s`;
  if (intervalMs < 60 * 60 * 1000) return `${Math.round(intervalMs / (60 * 1000))}m`;
  if (intervalMs < 24 * 60 * 60 * 1000) return `${Math.round(intervalMs / (60 * 60 * 1000))}h`;
  const days = Math.round(intervalMs / (24 * 60 * 60 * 1000));
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  if (days < 30) return `${Math.round(days / 7)} weeks`;
  if (days < 365) return `${Math.round(days / 30)} months`;
  return `${Math.round(days / 365)} years`;
}

// Get config from settings
export function getFSRSConfigFromSettings(settings: PhraseSettings): FSRSConfig {
  return {
    request_retention: settings.target_retention || DEFAULT_FSRS_CONFIG.request_retention,
    learning_steps: (settings as any).learning_steps || DEFAULT_FSRS_CONFIG.learning_steps,
    relearning_steps: (settings as any).relearning_steps || DEFAULT_FSRS_CONFIG.relearning_steps,
    enable_fuzz: (settings as any).enable_fuzz ?? DEFAULT_FSRS_CONFIG.enable_fuzz,
    enable_short_term: true, // Always enabled for v1
  };
}
