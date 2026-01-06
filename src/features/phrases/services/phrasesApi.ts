import { supabase } from '@/integrations/supabase/client';
import type { MemberPhraseCard, Phrase, PhraseReviewLog, PhraseSettings } from '../types';

type DbMemberPhraseCard = Record<string, any> & {
  phrase?: Record<string, any>;
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

function mapPhraseRow(row: Record<string, any>): Phrase {
  return {
    id: row.id,
    mode: row.mode,
    prompt_en: row.prompt_en ?? undefined,
    audio_url: row.audio_url ?? undefined,
    transcript_fr: row.transcript_fr ?? undefined,
    translation_en: row.translation_en ?? undefined,
    answers_fr: row.answers_fr ?? undefined,
    canonical_fr: row.canonical_fr ?? undefined,
    tags: row.tags ?? [],
    difficulty: row.difficulty ?? 3,
    scaffold_overrides: row.scaffold_overrides ?? undefined,
    created_at: row.created_at ?? new Date().toISOString(),
  };
}

export function mapDbCardToMemberCard(row: DbMemberPhraseCard): MemberPhraseCard {
  return {
    id: row.id,
    member_id: row.member_id,
    phrase_id: row.phrase_id,
    status: row.status,
    priority: row.priority ?? 0,
    scheduler: {
      algorithm: row.scheduler_algorithm || 'fsrs',
      state: row.scheduler_state || 'new',
      due_at: row.due_at,
      last_reviewed_at: row.last_reviewed_at ?? undefined,
      stability: row.stability ?? undefined,
      difficulty: row.difficulty ?? undefined,
      interval_ms: row.interval_ms ?? undefined,
      repetitions: row.repetitions ?? undefined,
      interval_days: row.interval_days ?? undefined,
      ease_factor: row.ease_factor ?? undefined,
      scheduler_state_jsonb: row.scheduler_state_jsonb ?? undefined,
      short_term_step_index: row.short_term_step_index ?? undefined,
    },
    assist_level: row.assist_level ?? 0,
    consecutive_again: row.consecutive_again ?? 0,
    again_count_24h: row.again_count_24h ?? 0,
    again_count_7d: row.again_count_7d ?? 0,
    paused_reason: row.paused_reason ?? undefined,
    paused_at: row.paused_at ?? undefined,
    lapses: row.lapses ?? 0,
    reviews: row.reviews ?? 0,
    note: row.note ?? undefined,
    flag_reason: row.flag_reason ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
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

export async function fetchMemberCardsWithPhrases(memberId: string): Promise<{
  cards: MemberPhraseCard[];
  phraseMap: Record<string, Phrase>;
}> {
  const { data, error } = await supabase
    .from('member_phrase_cards')
    .select('*, phrase:phrases(*)')
    .eq('member_id', memberId)
    .order('due_at', { ascending: true });

  if (error) {
    throw error;
  }

  const phraseMap: Record<string, Phrase> = {};
  const cards = (data || []).map((row) => {
    const typedRow = row as DbMemberPhraseCard;
    if (typedRow.phrase) {
      const phrase = mapPhraseRow(typedRow.phrase);
      phraseMap[phrase.id] = phrase;
    }
    return mapDbCardToMemberCard(typedRow);
  });

  return { cards, phraseMap };
}

export async function upsertMemberCards(cards: MemberPhraseCard[]) {
  const payload = cards.map(mapMemberCardToDb);
  return supabase.from('member_phrase_cards').upsert(payload, { onConflict: 'id' });
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

export async function insertReviewLog(log: PhraseReviewLog) {
  const payload = mapLogToDb(log);
  return supabase.from('phrase_review_logs').insert(payload);
}

export async function fetchMemberPhraseSettings(memberId: string): Promise<PhraseSettings> {
  const { data, error } = await supabase
    .from('member_phrase_settings')
    .select('*')
    .eq('member_id', memberId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = row not found
    throw error;
  }

  if (!data) {
    return {
      member_id: memberId,
      ...DEFAULT_SETTINGS,
    };
  }

  return {
    member_id: memberId,
    new_per_day: data.new_per_day,
    reviews_per_day: data.reviews_per_day,
    target_retention: data.target_retention,
    speech_feedback_enabled: data.speech_feedback_enabled,
    auto_assess_enabled: data.auto_assess_enabled,
    recognition_shadow_default: data.recognition_shadow_default,
    show_time_to_recall: data.show_time_to_recall,
    learning_steps: data.learning_steps ?? DEFAULT_SETTINGS.learning_steps,
    relearning_steps: data.relearning_steps ?? DEFAULT_SETTINGS.relearning_steps,
    enable_fuzz: data.enable_fuzz ?? DEFAULT_SETTINGS.enable_fuzz,
  };
}

export async function upsertMemberPhraseSettings(settings: PhraseSettings) {
  const { member_id, ...rest } = settings;
  return supabase.from('member_phrase_settings').upsert(
    {
      member_id,
      ...rest,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'member_id' }
  );
}

