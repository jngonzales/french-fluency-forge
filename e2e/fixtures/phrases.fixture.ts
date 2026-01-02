/**
 * Phrases Test Fixtures
 * Helpers for E2E tests
 */

import { Page } from '@playwright/test';
import type { MemberPhraseCard } from '@/features/phrases/types';

/**
 * Seed phrases in localStorage for testing
 */
export async function seedPhrases(page: Page, count: number = 10): Promise<void> {
  const now = new Date();
  const cards: MemberPhraseCard[] = Array.from({ length: count }, (_, i) => ({
    id: `card-test-${i}`,
    member_id: 'test-user',
    phrase_id: `phrase-${String(i + 1).padStart(3, '0')}`,
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
  }));

  await page.evaluate((cards) => {
    localStorage.setItem('solv_phrases_cards_test-user', JSON.stringify(cards));
  }, cards);
}

/**
 * Create a card with specific state for testing
 */
export async function createTestCard(
  page: Page,
  card: MemberPhraseCard
): Promise<void> {
  await page.evaluate((card) => {
    const key = `solv_phrases_cards_${card.member_id}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.push(card);
    localStorage.setItem(key, JSON.stringify(existing));
  }, card);
}

/**
 * Get cards from localStorage
 */
export async function getCards(page: Page, memberId: string = 'test-user'): Promise<MemberPhraseCard[]> {
  return await page.evaluate((memberId) => {
    const key = `solv_phrases_cards_${memberId}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  }, memberId);
}

/**
 * Clear all phrases data
 */
export async function clearPhrasesData(page: Page, memberId: string = 'test-user'): Promise<void> {
  await page.evaluate((memberId) => {
    localStorage.removeItem(`solv_phrases_cards_${memberId}`);
    localStorage.removeItem(`solv_phrases_settings_${memberId}`);
    localStorage.removeItem(`solv_phrases_logs_${memberId}`);
  }, memberId);
}

/**
 * Verify interval is approximately correct
 */
export function verifyInterval(actualMs: number, expectedMinutes: number, tolerance: number = 2): boolean {
  const expectedMs = expectedMinutes * 60 * 1000;
  const diff = Math.abs(actualMs - expectedMs);
  const toleranceMs = tolerance * 60 * 1000;
  return diff <= toleranceMs;
}

