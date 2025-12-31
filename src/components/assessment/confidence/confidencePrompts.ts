import type { SkillPrompt, SkillModuleConfig } from '../shared/types';

export const confidencePrompts: SkillPrompt[] = [
  {
    id: 'confidence-1',
    text: "Qu'est-ce que vous pensez des gens qui ne font jamais d'erreurs ?",
    textTranslation: "What do you think about people who never make mistakes?",
    duration: 30,
    tips: [
      "Share your personal opinion openly",
      "Use phrases like 'Moi je pense...' or 'Franchement...'",
      "Don't worry about being 'correct' - be authentic"
    ]
  },
  {
    id: 'confidence-2',
    text: "Racontez-moi un moment où vous avez changé d'avis sur quelque chose d'important.",
    textTranslation: "Tell me about a time you changed your mind about something important.",
    duration: 30,
    tips: [
      "Share a personal story",
      "Express your emotions about the experience",
      "Explain what you learned"
    ]
  }
];

export const confidenceConfig: SkillModuleConfig = {
  moduleType: 'confidence',
  title: 'Confidence',
  description: 'Express your opinions and personal experiences with confidence',
  prompts: confidencePrompts
};
