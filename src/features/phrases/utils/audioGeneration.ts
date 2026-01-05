/**
 * Audio Generation Utility
 * Generates TTS audio for French phrases using french-tts Edge Function
 * Includes browser caching for performance
 */

const CACHE_PREFIX = 'phrase_audio_';
const CACHE_VERSION = 1;

interface AudioGenerationOptions {
  voiceId?: string;
  speed?: number;
  stability?: number;
  outputFormat?: string;
}

interface CachedAudio {
  url: string;
  blob: Blob;
  timestamp: number;
  version: number;
}

/**
 * Generate audio for French text using TTS Edge Function
 */
export async function generatePhraseAudio(
  text: string,
  options: AudioGenerationOptions = {}
): Promise<Blob> {
  const cacheKey = `${CACHE_PREFIX}${hashText(text)}`;
  
  // Check cache first
  const cached = getCachedAudio(cacheKey);
  if (cached) {
    return cached.blob;
  }

  // Generate audio
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing');
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/french-tts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({
      text,
      voiceId: options.voiceId,
      speed: options.speed ?? 0.9,
      stability: options.stability ?? 0.6,
      outputFormat: options.outputFormat || 'mp3_44100_128',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`TTS generation failed: ${response.status} - ${errorText}`);
  }

  const blob = await response.blob();
  
  // Cache the result
  cacheAudio(cacheKey, blob);
  
  return blob;
}

/**
 * Get audio URL from blob (creates object URL)
 */
export function getAudioUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

/**
 * Revoke audio URL to free memory
 */
export function revokeAudioUrl(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Hash text for cache key
 */
function hashText(text: string): string {
  // Simple hash function for cache keys
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Get cached audio from IndexedDB or localStorage fallback
 */
function getCachedAudio(cacheKey: string): CachedAudio | null {
  try {
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;
    
    const data: CachedAudio = JSON.parse(cached);
    
    // Check version
    if (data.version !== CACHE_VERSION) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    // Check age (7 days max)
    const age = Date.now() - data.timestamp;
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    if (age > maxAge) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    // Convert base64 back to blob
    const binaryString = atob(data.url.split(',')[1] || '');
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'audio/mpeg' });
    
    return { ...data, blob };
  } catch (error) {
    console.error('Error reading audio cache:', error);
    return null;
  }
}

/**
 * Cache audio blob
 */
function cacheAudio(cacheKey: string, blob: Blob): void {
  try {
    // Convert blob to base64 for storage
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      const cached: CachedAudio = {
        url: base64data,
        blob: blob, // Store reference (will be recreated on read)
        timestamp: Date.now(),
        version: CACHE_VERSION,
      };
      
      // Store in localStorage (limited size, but simple)
      // For larger caches, consider IndexedDB
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          url: base64data,
          timestamp: cached.timestamp,
          version: cached.version,
        }));
      } catch (error) {
        // localStorage full, clear old entries
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          clearOldCacheEntries();
          try {
            localStorage.setItem(cacheKey, JSON.stringify({
              url: base64data,
              timestamp: cached.timestamp,
              version: cached.version,
            }));
          } catch (retryError) {
            console.warn('Failed to cache audio after cleanup:', retryError);
          }
        }
      }
    };
    reader.readAsDataURL(blob);
  } catch (error) {
    console.error('Error caching audio:', error);
  }
}

/**
 * Clear old cache entries when storage is full
 */
function clearOldCacheEntries(): void {
  const keys = Object.keys(localStorage);
  const audioKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
  
  // Sort by timestamp (oldest first)
  const entries = audioKeys.map(key => {
    try {
      const data = JSON.parse(localStorage.getItem(key) || '{}');
      return { key, timestamp: data.timestamp || 0 };
    } catch {
      return { key, timestamp: 0 };
    }
  }).sort((a, b) => a.timestamp - b.timestamp);
  
  // Remove oldest 50% of entries
  const toRemove = Math.floor(entries.length / 2);
  for (let i = 0; i < toRemove; i++) {
    localStorage.removeItem(entries[i].key);
  }
}

/**
 * Clear all cached audio
 */
export function clearAudioCache(): void {
  const keys = Object.keys(localStorage);
  keys.filter(key => key.startsWith(CACHE_PREFIX)).forEach(key => {
    localStorage.removeItem(key);
  });
}

