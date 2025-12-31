// Pronunciation Module Items - Azure Speech Pronunciation Assessment
// Engine: Microsoft Azure Speech, Locale: fr-FR

// Reading items - user sees text and reads aloud
export interface ReadingItem {
  id: string;
  focus: string[];
  referenceText: string;
}

// Repeat items - user hears audio and repeats
export interface RepeatItem {
  id: string;
  focus: string[];
  referenceText: string;
}

// Minimal pairs game - user hears target word and chooses correct option
export interface MinimalPairItem {
  id: string;
  focus: string[];
  options: [string, string];
  target: string;
}

export const READING_ITEMS: ReadingItem[] = [
  {
    id: "pronR-1",
    focus: ["/y/ vs /u/"],
    referenceText: "Tu as vu tout le monde dans la rue ?"
  },
  {
    id: "pronR-2",
    focus: ["nasal vowels (ɛ̃/ɑ̃/ɔ̃)"],
    referenceText: "Ce matin, il y a du vent. Je bois un verre de vin dans le salon."
  },
  {
    id: "pronR-3",
    focus: ["/s/ vs /z/"],
    referenceText: "Je mange du poisson, pas du poison !"
  }
];

export const REPEAT_ITEMS: RepeatItem[] = [
  {
    id: "pronE-1",
    focus: ["position words"],
    referenceText: "Je suis sous le pont, puis je passe dessus."
  },
  {
    id: "pronE-2",
    focus: ["open/closed vowels", "/ʁ/"],
    referenceText: "Je fais des pâtes, et le chat a mal à la patte."
  },
  {
    id: "pronE-3",
    focus: ["oral vs nasal", "/ʃ/ vs /ʒ/"],
    referenceText: "Je cherche mon chien, mais je n'entends rien."
  }
];

export const MINIMAL_PAIR_ITEMS: MinimalPairItem[] = [
  { id: "pronMP-1", focus: ["/y/ vs /u/"], options: ["tu", "tout"], target: "tu" },
  { id: "pronMP-2", focus: ["/y/ vs /u/"], options: ["rue", "roue"], target: "rue" },
  { id: "pronMP-3", focus: ["nasal vowels"], options: ["vin", "vent"], target: "vin" },
  { id: "pronMP-4", focus: ["nasal vowels"], options: ["brin", "brun"], target: "brun" },
  { id: "pronMP-5", focus: ["/s/ vs /z/"], options: ["poisson", "poison"], target: "poisson" },
  { id: "pronMP-6", focus: ["/s/ vs /z/"], options: ["pause", "pose"], target: "pose" },
  { id: "pronMP-7", focus: ["position words"], options: ["dessus", "dessous"], target: "dessous" },
  { id: "pronMP-8", focus: ["position words"], options: ["sous", "sur"], target: "sur" },
  { id: "pronMP-9", focus: ["/l/ vs /ʁ/"], options: ["lire", "rire"], target: "rire" },
  { id: "pronMP-10", focus: ["open/closed vowels"], options: ["pâte", "patte"], target: "pâte" },
  { id: "pronMP-11", focus: ["oral vs nasal"], options: ["beau", "bon"], target: "bon" },
  { id: "pronMP-12", focus: ["/ʃ/ vs /ʒ/"], options: ["chère", "gère"], target: "chère" }
];

// Scoring weights from scoring.md
export const SCORING_WEIGHTS = {
  reading: 0.45,
  repeat: 0.35,
  minimalPairs: 0.20
};

// Heatmap color thresholds
export function getHeatmapColor(score: number): "green" | "yellow" | "red" {
  if (score >= 90) return "green";
  if (score >= 75) return "yellow";
  return "red";
}

// Get random subset of minimal pairs for the game
export function getRandomMinimalPairs(count: number = 6): MinimalPairItem[] {
  const shuffled = [...MINIMAL_PAIR_ITEMS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
