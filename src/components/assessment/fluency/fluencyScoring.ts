// Fluency Scoring (v2)
// Goal: speed + control of long pauses. False starts & repetitions are NOT penalized.

export interface FluencyMetrics {
  wordCount: number;              // Excludes fillers
  speakingTime: number;           // Seconds between first and last non-filler word
  articulationWpm: number;        // word_count / (speaking_time/60)
  longPauseCount: number;         // Gaps > 1.2s
  maxPause: number;               // Longest pause in seconds
  pauseRatio: number;             // total_silence / total_duration
  totalPauseDuration: number;     // Sum of all pauses > 0.3s
  fillerRatio: number;            // fillers / total_words (tracked only)
}

export interface FluencyScore {
  total: number;                  // 0-100
  speedSubscore: number;          // 0-60
  pauseSubscore: number;          // 0-40
  metrics: FluencyMetrics;
}

// Long pause threshold
const LONG_PAUSE_THRESHOLD = 1.2; // seconds

// Speed bands for scoring (articulation WPM)
const SPEED_BANDS = [
  { min: 0, max: 45, score: 10 },
  { min: 45, max: 65, score: 25 },
  { min: 65, max: 85, score: 40 },
  { min: 85, max: 110, score: 55 },
  { min: 110, max: 140, score: 60 },
];

// Calculate speed subscore (0-60) based on articulation WPM
export function calculateSpeedSubscore(articulationWpm: number): number {
  // Clamp to reasonable bounds
  if (articulationWpm <= 0) return 0;
  if (articulationWpm >= 140) return 60;

  // Find the band and interpolate
  for (let i = 0; i < SPEED_BANDS.length; i++) {
    const band = SPEED_BANDS[i];
    if (articulationWpm >= band.min && articulationWpm < band.max) {
      // Interpolate within the band
      const bandRange = band.max - band.min;
      const position = (articulationWpm - band.min) / bandRange;
      
      // Get the previous band's score (or 0 for first band)
      const prevScore = i > 0 ? SPEED_BANDS[i - 1].score : 0;
      const scoreRange = band.score - prevScore;
      
      return Math.round(prevScore + position * scoreRange);
    }
  }
  
  return 60; // Max score
}

// Calculate pause control subscore (0-40)
export function calculatePauseSubscore(
  longPauseCount: number,
  maxPause: number,
  pauseRatio: number
): number {
  let score = 40;
  
  // -5 for each long pause (>1.2s), cap at -20
  const longPausePenalty = Math.min(longPauseCount * 5, 20);
  score -= longPausePenalty;
  
  // -10 if max pause > 2.5s
  if (maxPause > 2.5) {
    score -= 10;
  }
  
  // -10 if pause ratio > 0.35
  if (pauseRatio > 0.35) {
    score -= 10;
  }
  
  return Math.max(0, score);
}

// Calculate total fluency score
export function calculateFluencyScore(metrics: FluencyMetrics): FluencyScore {
  const speedSubscore = calculateSpeedSubscore(metrics.articulationWpm);
  const pauseSubscore = calculatePauseSubscore(
    metrics.longPauseCount,
    metrics.maxPause,
    metrics.pauseRatio
  );
  
  return {
    total: speedSubscore + pauseSubscore,
    speedSubscore,
    pauseSubscore,
    metrics,
  };
}
