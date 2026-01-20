/**
 * Migration script to move localStorage phrase cards to Supabase
 * One-time, idempotent migration
 */

import type { MemberPhraseCard } from '../types';
import { upsertMemberCards } from '../services/phrasesApi';

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
    // Silently return empty array if parse fails
    return [];
  }
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
    const { error } = await upsertMemberCards(cards);
    if (error) {
      throw error;
    }

    markMigrationComplete(memberId);
    return { success: true, migrated: cards.length };
  } catch (error) {
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
    await migrateLocalStorageToSupabase(memberId);
  }
}

