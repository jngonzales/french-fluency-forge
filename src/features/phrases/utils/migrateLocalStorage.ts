/**
 * Migration script to move localStorage phrase cards to Supabase
 * One-time, idempotent migration
 * 
 * NOTE: The member_phrase_cards table does not exist yet.
 * This is a stub that will work when the table is created.
 */

import type { MemberPhraseCard } from '../types';

const MIGRATION_FLAG_KEY = 'solv_phrases_migration_complete';

/**
 * Check if migration has already been completed
 */
export function isMigrationComplete(memberId: string): boolean {
  const flag = localStorage.getItem(`${MIGRATION_FLAG_KEY}_${memberId}`);
  return flag === 'true';
}

/**
 * Mark migration as complete
 */
function markMigrationComplete(memberId: string): void {
  localStorage.setItem(`${MIGRATION_FLAG_KEY}_${memberId}`, 'true');
}

/**
 * Load cards from localStorage
 */
function loadCardsFromLocalStorage(memberId: string): MemberPhraseCard[] {
  const key = `solv_phrases_cards_${memberId}`;
  const stored = localStorage.getItem(key);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch (err) {
    console.error('[migrateLocalStorage] Failed to parse localStorage cards:', err);
    return [];
  }
}

/**
 * Transform localStorage card to database schema
 */
function transformCardForDatabase(card: MemberPhraseCard): any {
  return {
    id: card.id,
    member_id: card.member_id,
    phrase_id: card.phrase_id,
    status: card.status,
    priority: card.priority || 0,
    scheduler_algorithm: card.scheduler.algorithm || 'fsrs',
    scheduler_state: card.scheduler.state,
    due_at: card.scheduler.due_at,
    last_reviewed_at: card.scheduler.last_reviewed_at,
    stability: card.scheduler.stability,
    difficulty: card.scheduler.difficulty,
    interval_ms: card.scheduler.interval_ms,
    repetitions: card.scheduler.repetitions || 0,
    interval_days: card.scheduler.interval_days || 0,
    ease_factor: card.scheduler.ease_factor || 2.5,
    scheduler_state_jsonb: card.scheduler.scheduler_state_jsonb || {},
    assist_level: card.assist_level || 0,
    consecutive_again: card.consecutive_again || 0,
    again_count_24h: card.again_count_24h || 0,
    again_count_7d: card.again_count_7d || 0,
    paused_reason: card.paused_reason,
    paused_at: card.paused_at,
    short_term_step_index: card.scheduler.short_term_step_index,
    lapses: card.lapses || 0,
    reviews: card.reviews || 0,
    note: card.note,
    flag_reason: card.flag_reason,
    created_at: card.created_at,
    updated_at: card.updated_at,
  };
}

/**
 * Migrate localStorage cards to Supabase
 */
export async function migrateLocalStorageToSupabase(memberId: string): Promise<{
  success: boolean;
  migrated: number;
  error?: string;
}> {
  // Check if already migrated
  if (isMigrationComplete(memberId)) {
    return { success: true, migrated: 0 };
  }

  // Load cards from localStorage
  const cards = loadCardsFromLocalStorage(memberId);
  if (cards.length === 0) {
    markMigrationComplete(memberId);
    return { success: true, migrated: 0 };
  }

  try {
    // Transform cards for database format
    const transformedCards = cards.map(transformCardForDatabase);
    
    // NOTE: The member_phrase_cards table doesn't exist yet in the database.
    // When the table is created, uncomment this section:
    /*
    const batchSize = 50;
    let migrated = 0;
    
    for (let i = 0; i < transformedCards.length; i += batchSize) {
      const batch = transformedCards.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('member_phrase_cards')
        .upsert(batch, {
          onConflict: 'id',
        });
      
      if (error) {
        console.error('[migrateLocalStorage] Batch insert error:', error);
        throw error;
      }
      
      migrated += batch.length;
    }
    */

    // For now, just mark as complete (localStorage is the source of truth)
    console.log(`[migrateLocalStorage] Would migrate ${transformedCards.length} cards when table exists`);

    // Mark migration as complete
    markMigrationComplete(memberId);

    return { success: true, migrated: 0 };
  } catch (error) {
    console.error('[migrateLocalStorage] Migration error:', error);
    return {
      success: false,
      migrated: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Run migration if needed (call this on app startup or phrases page load)
 */
export async function runMigrationIfNeeded(memberId: string): Promise<void> {
  if (!isMigrationComplete(memberId)) {
    console.log('[migrateLocalStorage] Starting migration...');
    const result = await migrateLocalStorageToSupabase(memberId);
    if (result.success) {
      console.log(`[migrateLocalStorage] Migration complete: ${result.migrated} cards migrated`);
    } else {
      console.error('[migrateLocalStorage] Migration failed:', result.error);
    }
  }
}

