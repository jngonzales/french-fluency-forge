/**
 * Audio Generation Utility
 * Generates TTS audio for French phrases using french-tts Edge Function
 * Includes browser caching for performance
 * 
 * RATE LIMITING: ElevenLabs free tier only allows 2 concurrent requests.
 * This module implements a queue to serialize TTS requests with delays.
 */

const CACHE_PREFIX = 'phrase_audio_';
const CACHE_VERSION = 1;

// Rate limiting configuration
const MIN_DELAY_BETWEEN_REQUESTS = 1000; // 1 second between requests
let lastRequestTime = 0;
const requestQueue: Array<{
  resolve: (blob: Blob) => void;
  reject: (error: Error) => void;
  text: string;
  options: AudioGenerationOptions;
}> = [];
let isProcessingQueue = false;

interface AudioGenerationOptions {
  voiceId?: string;
  speed?: number;
  stability?: number;
  outputFormat?: string;
  phraseId?: string;  // For server-side caching
}

interface CachedAudio {
  url: string;
  blob: Blob;
  timestamp: number;
  version: number;
}

/**
 * Process the TTS queue one request at a time with rate limiting
 */
async function processQueue(): Promise<void> {
  if (isProcessingQueue || requestQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  while (requestQueue.length > 0) {
    const request = requestQueue.shift();
    if (!request) break;
    
    // Wait for minimum delay between requests
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_DELAY_BETWEEN_REQUESTS) {
      await new Promise(resolve => 
        setTimeout(resolve, MIN_DELAY_BETWEEN_REQUESTS - timeSinceLastRequest)
      );
    }
    
    try {
      const blob = await generatePhraseAudioInternal(request.text, request.options);
      request.resolve(blob);
    } catch (error) {
      request.reject(error instanceof Error ? error : new Error('TTS generation failed'));
    }
    
    lastRequestTime = Date.now();
  }
  
  isProcessingQueue = false;
}

/**
 * Internal function that actually calls the TTS API
 */
async function generatePhraseAudioInternal(
  text: string,
  options: AudioGenerationOptions = {}
): Promise<Blob> {
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
      // Enable server-side caching if phraseId is provided
      cacheKey: options.phraseId ? `phrases/${options.phraseId}` : undefined,
      bucketName: 'phrases-audio',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`TTS generation failed: ${response.status} - ${errorText}`);
  }

  // Check if response is JSON (cached URL) or binary audio
  const contentType = response.headers.get('content-type') || '';
  
  if (contentType.includes('application/json')) {
    // Got a cached URL response - fetch the actual audio
    const data = await response.json();
    if (data.cachedUrl) {
      console.log(`[Audio] Using ${data.cached ? 'cached' : 'newly cached'} audio from storage`);
      const audioResponse = await fetch(data.cachedUrl);
      return audioResponse.blob();
    }
  }

  return response.blob();
}

/**
 * Generate audio for French text using TTS Edge Function
 * Uses a queue to prevent concurrent requests and rate limiting issues
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

  // Add to queue for rate-limited processing
  return new Promise((resolve, reject) => {
    requestQueue.push({
      resolve: (blob) => {
        // Cache the result before resolving
        cacheAudio(cacheKey, blob);
        resolve(blob);
      },
      reject,
      text,
      options,
    });
    
    // Start processing queue if not already running
    processQueue();
  });
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

