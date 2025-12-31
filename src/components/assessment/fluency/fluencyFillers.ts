// French filler words to exclude from word count in fluency scoring
// These are hesitation markers that don't count toward speaking speed

export const FRENCH_FILLERS = [
  "euh",
  "heu",
  "hum",
  "hmm",
  "mh",
  "bah",
  "ben",
  "genre",
  "tu vois",
  // Common variants
  "euuuh",
  "heuuu",
  "euhh",
  "um",
  "uh",
  "hm",
];

// Check if a word is a filler (case-insensitive)
export function isFiller(word: string): boolean {
  const normalized = word.toLowerCase().trim();
  return FRENCH_FILLERS.includes(normalized);
}

// Filter out filler words from an array of words
export function filterFillers(words: string[]): string[] {
  return words.filter(word => !isFiller(word));
}
