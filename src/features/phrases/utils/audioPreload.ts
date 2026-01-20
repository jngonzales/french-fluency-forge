/**
 * Audio Preloading Utility
 * Preloads audio files for upcoming flashcards to reduce perceived latency
 * Now includes TTS generation caching for instant playback
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
 */
export function preloadAudioForPhrases(phrases: Phrase[], maxPreload = 3): void {
  // Limit to first N phrases and increase stagger to avoid rate limiting
  const phrasesToPreload = phrases.slice(0, maxPreload);

  phrasesToPreload.forEach((phrase, index) => {
    const frenchText = phrase.canonical_fr || phrase.transcript_fr;
    
    // Skip if no text or already cached/generating
    if (!frenchText || audioBlobCache.has(phrase.id) || generatingPhrases.has(phrase.id)) {
      return;
    }

    // Mark as generating
    generatingPhrases.add(phrase.id);

    // Use longer staggered delays to avoid rate limiting (500ms apart)
    setTimeout(async () => {
      try {
        const blob = await generatePhraseAudio(frenchText);
        const blobUrl = getAudioUrl(blob);
        audioBlobCache.set(phrase.id, { blob, url: blobUrl });
      } catch (err) {
        // Silently fail - audio will be generated on demand
      } finally {
        generatingPhrases.delete(phrase.id);
      }
    }, index * 500); // 500ms apart to avoid rate limiting
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
    const blob = await generatePhraseAudio(frenchText);
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
