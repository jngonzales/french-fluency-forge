/**
 * Seeded Random Number Generator (Mulberry32)
 * Provides deterministic pseudo-random numbers from a seed
 */
export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  /**
   * Generate next random number between 0 and 1
   */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Generate random integer between min (inclusive) and max (exclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }
}

/**
 * Shuffle array deterministically using Fisher-Yates algorithm with seeded RNG
 * Does NOT mutate original array
 * 
 * @param array - Array to shuffle
 * @param seed - Seed for deterministic shuffling
 * @returns New shuffled array
 */
export function seededShuffle<T>(array: T[], seed: number): T[] {
  const result = [...array];
  const rng = new SeededRandom(seed);

  for (let i = result.length - 1; i > 0; i--) {
    const j = rng.nextInt(0, i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

/**
 * Select N items from array using seeded shuffle
 * 
 * @param array - Array to select from
 * @param count - Number of items to select
 * @param seed - Seed for deterministic selection
 * @returns Array of selected items
 */
export function seededSelect<T>(array: T[], count: number, seed: number): T[] {
  const shuffled = seededShuffle(array, seed);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Generate a random seed from current timestamp and random value
 * Use this when creating a new session
 */
export function generateSeed(): number {
  return Math.floor(Date.now() * Math.random()) % 2147483647;
}

