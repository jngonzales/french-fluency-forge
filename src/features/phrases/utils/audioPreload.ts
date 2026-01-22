/**
 * Audio Preloading Utility
 * Preloads audio files for upcoming flashcards to reduce perceived latency
 * Now includes TTS generation caching for instant playback
 * 
 * NOTE: Rate limiting is handled by audioGeneration.ts queue.
 * This module just schedules preloads with staggered timing.
 */

import { generatePhraseAudio, getAudioUrl } from './audioGeneration';
import type { Phrase } from '../types';

// In-memory cache for generated audio blobs
const audioBlobCache = new Map<string, { blob: Blob; url: string }>();

// Track phrases currently being generated to avoid duplicate requests
const generatingPhrases = new Set<string>();

/**
 * Get cached audio URL for a phrase (if preloaded)
 */
export function getCachedAudioUrl(phraseId: string): string | null {
  const cached = audioBlobCache.get(phraseId);
  return cached?.url || null;
}

/**
 * Preload audio for a list of phrases - TTS generation with rate limiting
 * Only generates TTS, no storage checks (to avoid 400 errors)
 * Note: Reduced to 2 max preloads to avoid overwhelming the TTS API
 */
export function preloadAudioForPhrases(phrases: Phrase[], maxPreload = 2): void {
  // Limit to first N phrases - default reduced from 3 to 2
  const phrasesToPreload = phrases.slice(0, Math.min(maxPreload, 2));

  phrasesToPreload.forEach((phrase, index) => {
    const frenchText = phrase.canonical_fr || phrase.transcript_fr;
    
    // Skip if no text or already cached/generating
    if (!frenchText || audioBlobCache.has(phrase.id) || generatingPhrases.has(phrase.id)) {
      return;
    }

    // Mark as generating
    generatingPhrases.add(phrase.id);

    // Stagger requests - the queue in audioGeneration.ts handles actual rate limiting
    // This just prevents all requests from hitting the queue at once
    setTimeout(async () => {
      try {
        const blob = await generatePhraseAudio(frenchText, { phraseId: phrase.id });
        const blobUrl = getAudioUrl(blob);
        audioBlobCache.set(phrase.id, { blob, url: blobUrl });
      } catch {
        // Silently fail - audio will be generated on demand
      } finally {
        generatingPhrases.delete(phrase.id);
      }
    }, index * 1500); // 1.5 seconds apart to work with queue timing
  });
}

/**
 * Preload next audio in queue - TTS only (no storage checks)
 * Call this when user rates a card to preload the next one
 */
export async function preloadNextAudio(nextPhrase: Phrase | null): Promise<void> {
  if (!nextPhrase) return;

  // Already cached or generating?
  if (audioBlobCache.has(nextPhrase.id) || generatingPhrases.has(nextPhrase.id)) {
    return;
  }

  const frenchText = nextPhrase.canonical_fr || nextPhrase.transcript_fr;
  
  if (!frenchText) return;

  generatingPhrases.add(nextPhrase.id);
  
  try {
    const blob = await generatePhraseAudio(frenchText, { phraseId: nextPhrase.id });
    const blobUrl = getAudioUrl(blob);
    audioBlobCache.set(nextPhrase.id, { blob, url: blobUrl });
  } catch (err) {
    // Silently fail - audio will be generated on demand
  } finally {
    generatingPhrases.delete(nextPhrase.id);
  }
}

/**
 * Clear audio cache
 * Call this when session ends or user navigates away
 */
export function clearAudioPreloads(): void {
  // Revoke blob URLs to free memory
  audioBlobCache.forEach(({ url }) => {
    URL.revokeObjectURL(url);
  });
  audioBlobCache.clear();
}
