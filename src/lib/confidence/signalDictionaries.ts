/**
 * Confidence Signal Dictionaries
 * 
 * Phrase lists for detecting confidence communication signals in spoken French.
 * Based on spec §4.2 - these are intentionally not exhaustive.
 */

export interface SignalMatch {
  phrase: string;
  snippet: string; // 10-20 word context
  turnIndex?: number;
  category: 'low_confidence' | 'ownership' | 'engagement' | 'structure' | 'repair';
}

/**
 * A) Low-confidence / uncertainty markers
 * Apology, self-doubt, permission-seeking, minimizing, avoidance
 */
export const LOW_CONFIDENCE_MARKERS = [
  // Apology/over-apology
  'désolé',
  'désolée',
  'pardon',
  'je suis navré',
  'je suis navrée',
  'excusez-moi',
  
  // Self-doubt
  'je ne sais pas',
  'je sais pas',
  'je crois',
  'je pense peut-être',
  "j'imagine",
  'je suis pas sûr',
  'je suis pas sûre',
  'je ne suis pas certain',
  'je ne suis pas certaine',
  'peut-être que',
  
  // Permission-seeking
  "si ça vous dérange pas",
  "si c'est pas trop",
  'est-ce que je peux',
  
  // Minimizing
  "c'est pas grave",
  'tant pis',
  'comme vous voulez',
  'peu importe',
  "ça va aller",
  
  // Avoidance
  'je préfère pas',
  'je sais pas trop',
  'je vais voir',
  "j'hésite"
];

/**
 * B) Ownership / assertiveness markers
 * Clear stance, boundaries, confident requests, proposals
 */
export const OWNERSHIP_MARKERS = [
  // Clear stance
  'je veux',
  "j'ai besoin de",
  'je préfère',
  'je choisis',
  'je décide',
  'moi je pense',
  'moi je',
  'franchement',
  
  // Boundary
  'je ne peux pas',
  'je peux pas',
  'ça ne me convient pas',
  'ça me convient pas',
  'je ne suis pas disponible',
  'je suis pas disponible',
  
  // Confident request
  'je vous appelle pour',
  "j'appelle pour",
  'je voudrais résoudre',
  "j'aimerais une solution",
  'je demande',
  "j'exige",
  
  // Proposal
  'je propose',
  'voici ce que je peux faire',
  'on peut',
  'nous pouvons',
  'je suggère'
];

/**
 * C) Engagement / emotional presence markers
 * Feelings, empathy, warmth
 */
export const ENGAGEMENT_MARKERS = [
  // Feelings
  'je suis stressé',
  'je suis stressée',
  'je suis frustré',
  'je suis frustrée',
  "ça m'inquiète",
  'je suis content',
  'je suis contente',
  'ça me soulage',
  'je suis déçu',
  'je suis déçue',
  'ça me touche',
  "j'ai peur",
  'je me sens',
  
  // Empathy
  'je comprends',
  'je vois',
  'je vous remercie',
  "j'apprécie",
  
  // Social warmth
  'merci',
  'merci beaucoup',
  'bonne journée',
  'bonne soirée',
  'au revoir',
  'à bientôt'
];

/**
 * D) Clarity / control markers - Structuring
 */
export const STRUCTURE_MARKERS = [
  "d'abord",
  'dabord',
  'ensuite',
  'puis',
  'donc',
  'alors',
  'en résumé',
  'pour résumer',
  'premièrement',
  'deuxièmement',
  'enfin',
  'finalement',
  'en conclusion'
];

/**
 * D) Clarity / control markers - Repair
 */
export const REPAIR_MARKERS = [
  'pardon, je reformule',
  'je reformule',
  'je veux dire',
  'en fait',
  "c'est-à-dire",
  'ce que je veux dire',
  "ce que j'essaie de dire",
  'autrement dit',
  'pour être clair',
  'pour être claire',
  'laissez-moi expliquer'
];

/**
 * Extract a snippet of context around a matched phrase
 * @param text Full text
 * @param matchIndex Starting index of the match
 * @param matchLength Length of the matched phrase
 * @param contextWords Number of words to include before/after (default 7-10)
 * @returns Snippet of 10-20 words
 */
export function extractSnippet(
  text: string,
  matchIndex: number,
  matchLength: number,
  contextWords: number = 7
): string {
  const before = text.slice(0, matchIndex);
  const match = text.slice(matchIndex, matchIndex + matchLength);
  const after = text.slice(matchIndex + matchLength);
  
  const wordsBefore = before.split(/\s+/).filter(Boolean);
  const wordsAfter = after.split(/\s+/).filter(Boolean);
  
  const beforeSnippet = wordsBefore.slice(-contextWords).join(' ');
  const afterSnippet = wordsAfter.slice(0, contextWords).join(' ');
  
  let snippet = '';
  if (beforeSnippet) snippet += beforeSnippet + ' ';
  snippet += match;
  if (afterSnippet) snippet += ' ' + afterSnippet;
  
  // Trim to reasonable length
  if (snippet.length > 150) {
    snippet = snippet.slice(0, 150) + '...';
  }
  
  return snippet.trim();
}

/**
 * Find all matches of markers in text
 * @param text Text to search (transcript)
 * @param markers Array of marker phrases
 * @param category Category for the matches
 * @param turnIndex Optional turn index for context
 * @returns Array of signal matches with evidence
 */
export function findMarkers(
  text: string,
  markers: string[],
  category: SignalMatch['category'],
  turnIndex?: number
): SignalMatch[] {
  const normalizedText = text.toLowerCase();
  const matches: SignalMatch[] = [];
  
  for (const marker of markers) {
    const normalizedMarker = marker.toLowerCase();
    let searchIndex = 0;
    
    while (true) {
      const index = normalizedText.indexOf(normalizedMarker, searchIndex);
      if (index === -1) break;
      
      // Check word boundaries to avoid partial matches
      const beforeChar = index > 0 ? normalizedText[index - 1] : ' ';
      const afterChar = index + normalizedMarker.length < normalizedText.length
        ? normalizedText[index + normalizedMarker.length]
        : ' ';
      
      const isWordBoundary = /[\s,;.!?]/.test(beforeChar) && /[\s,;.!?]/.test(afterChar);
      
      if (isWordBoundary) {
        const snippet = extractSnippet(text, index, normalizedMarker.length);
        matches.push({
          phrase: marker,
          snippet,
          category,
          turnIndex
        });
      }
      
      searchIndex = index + normalizedMarker.length;
    }
  }
  
  return matches;
}

/**
 * Detect all confidence signals in a transcript
 * @param transcript Full transcript or turn transcript
 * @param turnIndex Optional turn index
 * @returns Object with categorized signal matches
 */
export function detectConfidenceSignals(
  transcript: string,
  turnIndex?: number
): {
  lowConfidence: SignalMatch[];
  ownership: SignalMatch[];
  engagement: SignalMatch[];
  structure: SignalMatch[];
  repair: SignalMatch[];
} {
  return {
    lowConfidence: findMarkers(transcript, LOW_CONFIDENCE_MARKERS, 'low_confidence', turnIndex),
    ownership: findMarkers(transcript, OWNERSHIP_MARKERS, 'ownership', turnIndex),
    engagement: findMarkers(transcript, ENGAGEMENT_MARKERS, 'engagement', turnIndex),
    structure: findMarkers(transcript, STRUCTURE_MARKERS, 'structure', turnIndex),
    repair: findMarkers(transcript, REPAIR_MARKERS, 'repair', turnIndex)
  };
}

/**
 * Helper: Check if text contains explicit request or proposal
 */
export function hasExplicitRequest(transcript: string): boolean {
  const requestPatterns = [
    /je (veux|voudrais|demande|souhaite|aimerais)/i,
    /est-ce que (vous |tu )?pou(vez|vais|rriez)/i,
    /pou(vez|vais|rriez)-vous/i,
    /je propose/i,
    /voici ce que/i
  ];
  
  return requestPatterns.some(pattern => pattern.test(transcript));
}

/**
 * Helper: Check if text contains boundary-setting
 */
export function hasBoundarySetting(transcript: string): boolean {
  const boundaryPatterns = [
    /je (ne |n')peux pas/i,
    /ça (ne |n')me convient pas/i,
    /je (ne |n')suis pas disponible/i,
    /ce (n'|ne )est pas possible/i,
    /je refuse/i
  ];
  
  return boundaryPatterns.some(pattern => pattern.test(transcript));
}

