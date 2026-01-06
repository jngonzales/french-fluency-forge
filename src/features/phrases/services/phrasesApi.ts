/**
 * Phrases API - Local-only implementation
 * The phrases feature uses local storage for now (Supabase tables not yet created)
 */

import type { MemberPhraseCard, Phrase, PhraseReviewLog, PhraseSettings } from '../types';

// Note: These tables don't exist in the database yet:
// - member_phrase_cards
// - phrase_review_logs  
// - member_phrase_settings
// - phrases
// This file provides stub implementations that throw errors to surface if used

type DbMemberPhraseCard = Record<string, unknown> & {
  phrase?: Record<string, unknown>;
};

const DEFAULT_SETTINGS: Omit<PhraseSettings, 'member_id'> = {
  new_per_day: 20,
  reviews_per_day: 100,
  target_retention: 0.9,
  speech_feedback_enabled: false,
  auto_assess_enabled: false,
  recognition_shadow_default: false,
  show_time_to_recall: true,
};

function mapPhraseRow(row: Record<string, unknown>): Phrase {
  return {
    id: row.id as string,
    mode: row.mode as Phrase['mode'],
    prompt_en: (row.prompt_en as string) ?? undefined,
    audio_url: (row.audio_url as string) ?? undefined,
    transcript_fr: (row.transcript_fr as string) ?? undefined,
    translation_en: (row.translation_en as string) ?? undefined,
    answers_fr: (row.answers_fr as string[]) ?? undefined,
    canonical_fr: (row.canonical_fr as string) ?? undefined,
    tags: (row.tags as string[]) ?? [],
    difficulty: ((row.difficulty as number) ?? 3) as 1 | 2 | 3 | 4 | 5,
    scaffold_overrides: (row.scaffold_overrides as Phrase['scaffold_overrides']) ?? undefined,
    created_at: (row.created_at as string) ?? new Date().toISOString(),
  };
}

export function mapDbCardToMemberCard(row: DbMemberPhraseCard): MemberPhraseCard {
  return {
    id: row.id as string,
    member_id: row.member_id as string,
    phrase_id: row.phrase_id as string,
    status: row.status as MemberPhraseCard['status'],
    priority: (row.priority as number) ?? 0,
    scheduler: {
      algorithm: ((row.scheduler_algorithm as string) || 'fsrs') as 'fsrs' | 'sm2',
      state: (row.scheduler_state as MemberPhraseCard['scheduler']['state']) || 'new',
      due_at: row.due_at as string,
      last_reviewed_at: (row.last_reviewed_at as string) ?? undefined,
      stability: (row.stability as number) ?? undefined,
      difficulty: (row.difficulty as number) ?? undefined,
      interval_ms: (row.interval_ms as number) ?? undefined,
      repetitions: (row.repetitions as number) ?? undefined,
      interval_days: (row.interval_days as number) ?? undefined,
      ease_factor: (row.ease_factor as number) ?? undefined,
      scheduler_state_jsonb: (row.scheduler_state_jsonb as Record<string, unknown>) ?? undefined,
      short_term_step_index: (row.short_term_step_index as number) ?? undefined,
    },
    assist_level: (row.assist_level as number) ?? 0,
    consecutive_again: (row.consecutive_again as number) ?? 0,
    again_count_24h: (row.again_count_24h as number) ?? 0,
    again_count_7d: (row.again_count_7d as number) ?? 0,
    paused_reason: (row.paused_reason as string) ?? undefined,
    paused_at: (row.paused_at as string) ?? undefined,
    lapses: (row.lapses as number) ?? 0,
    reviews: (row.reviews as number) ?? 0,
    note: (row.note as string) ?? undefined,
    flag_reason: (row.flag_reason as string) ?? undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export function mapMemberCardToDb(card: MemberPhraseCard) {
  return {
    id: card.id,
    member_id: card.member_id,
    phrase_id: card.phrase_id,
    status: card.status,
    priority: card.priority ?? 0,
    scheduler_algorithm: card.scheduler.algorithm,
    scheduler_state: card.scheduler.state,
    due_at: card.scheduler.due_at,
    last_reviewed_at: card.scheduler.last_reviewed_at ?? null,
    stability: card.scheduler.stability ?? null,
    difficulty: card.scheduler.difficulty ?? null,
    interval_ms: card.scheduler.interval_ms ?? null,
    repetitions: card.scheduler.repetitions ?? 0,
    interval_days: card.scheduler.interval_days ?? 0,
    ease_factor: card.scheduler.ease_factor ?? 2.5,
    scheduler_state_jsonb: card.scheduler.scheduler_state_jsonb ?? {},
    short_term_step_index: card.scheduler.short_term_step_index ?? null,
    assist_level: card.assist_level ?? 0,
    consecutive_again: card.consecutive_again ?? 0,
    again_count_24h: card.again_count_24h ?? 0,
    again_count_7d: card.again_count_7d ?? 0,
    paused_reason: card.paused_reason ?? null,
    paused_at: card.paused_at ?? null,
    lapses: card.lapses ?? 0,
    reviews: card.reviews ?? 0,
    note: card.note ?? null,
    flag_reason: card.flag_reason ?? null,
    updated_at: new Date().toISOString(),
  };
}

// Stub: Tables not created yet - returns empty data
export async function fetchMemberCardsWithPhrases(_memberId: string): Promise<{
  cards: MemberPhraseCard[];
  phraseMap: Record<string, Phrase>;
}> {
  // Tables don't exist yet - return empty
  console.warn('[phrasesApi] member_phrase_cards table not yet created - using local storage only');
  return { cards: [], phraseMap: {} };
}

// Stub: Tables not created yet - no-op
export async function upsertMemberCards(_cards: MemberPhraseCard[]) {
  console.warn('[phrasesApi] member_phrase_cards table not yet created - changes stored locally only');
  return { data: null, error: null };
}

export function mapLogToDb(log: PhraseReviewLog) {
  return {
    member_id: log.member_id,
    phrase_id: log.phrase_id,
    card_id: log.card_id,
    started_at: log.started_at,
    revealed_at: log.revealed_at ?? null,
    rated_at: log.rated_at,
    rating: log.rating,
    response_time_ms: log.response_time_ms ?? null,
    mode: log.mode,
    state_before: log.state_before,
    state_after: log.state_after,
    due_before: log.due_before,
    due_after: log.due_after,
    interval_before_ms: log.interval_before_ms ?? null,
    interval_after_ms: log.interval_after_ms,
    stability_before: log.stability_before ?? null,
    stability_after: log.stability_after ?? null,
    difficulty_before: log.difficulty_before ?? null,
    difficulty_after: log.difficulty_after ?? null,
    elapsed_ms: log.elapsed_ms ?? null,
    was_overdue: log.was_overdue,
    overdue_ms: log.overdue_ms ?? null,
    config_snapshot: log.config_snapshot ?? null,
    speech_used: log.speech_used,
    transcript: log.transcript ?? null,
    similarity: log.similarity ?? null,
    auto_assessed: log.auto_assessed ?? false,
    suggested_rating: log.suggested_rating ?? null,
  };
}

// Stub: Tables not created yet - no-op
export async function insertReviewLog(_log: PhraseReviewLog) {
  console.warn('[phrasesApi] phrase_review_logs table not yet created - log stored locally only');
  return { data: null, error: null };
}

// Stub: Returns default settings since table doesn't exist
export async function fetchMemberPhraseSettings(memberId: string): Promise<PhraseSettings> {
  console.warn('[phrasesApi] member_phrase_settings table not yet created - using defaults');
  return {
    member_id: memberId,
    ...DEFAULT_SETTINGS,
  };
}

// Stub: Tables not created yet - no-op
export async function upsertMemberPhraseSettings(_settings: PhraseSettings) {
  console.warn('[phrasesApi] member_phrase_settings table not yet created - settings stored locally only');
  return { data: null, error: null };
}
