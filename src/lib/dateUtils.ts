/**
 * Date Utilities
 * Local timezone-aware date formatting utilities
 * Avoids UTC conversion issues with toISOString()
 */

/**
 * Get today's date in local timezone as YYYY-MM-DD string
 */
export function getLocalToday(): string {
  return formatLocalDate(new Date());
}

/**
 * Format a date in local timezone as YYYY-MM-DD string
 * (Avoids UTC conversion that toISOString().split('T')[0] does)
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get a date N days ago from today in local timezone
 */
export function getLocalDateDaysAgo(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return formatLocalDate(date);
}

/**
 * Get an array of date strings from N days ago to today in local timezone
 */
export function getLocalDateRange(daysBack: number): string[] {
  const dates: string[] = [];
  for (let i = daysBack - 1; i >= 0; i--) {
    dates.push(getLocalDateDaysAgo(i));
  }
  return dates;
}

/**
 * Check if a date string is in the future (relative to local today)
 */
export function isDateFuture(dateStr: string): boolean {
  return dateStr > getLocalToday();
}

/**
 * Parse a YYYY-MM-DD date string to a local Date object
 * (Handles timezone properly)
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Seeded random number generator for deterministic mock data
 * Uses a simple hash-based seed
 */
export function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return function() {
    hash = Math.imul(hash ^ (hash >>> 15), hash | 1);
    hash ^= hash + Math.imul(hash ^ (hash >>> 7), hash | 61);
    const result = ((hash ^ (hash >>> 14)) >>> 0) / 4294967295;
    return result;
  };
}
