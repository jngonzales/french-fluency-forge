import type { SkillPrompt, SkillModuleConfig } from '../shared/types';

export const syntaxPrompts: SkillPrompt[] = [
  {
    id: 'syntax-1',
    text: "Décrivez ce que vous feriez si vous gagniez un million d'euros.",
    textTranslation: "Describe what you would do if you won a million euros.",
    duration: 30,
    tips: [
      "Use the conditional tense (je ferais, j'achèterais...)",
      "Try to give multiple examples",
      "Structure your answer clearly"
    ]
  },
  {
    id: 'syntax-2',
    text: "Expliquez les différences entre la vie aujourd'hui et la vie de vos grands-parents.",
    textTranslation: "Explain the differences between life today and your grandparents' life.",
    duration: 30,
    tips: [
      "Use comparison structures (plus que, moins que, autant que)",
      "Mix different tenses (present, past)",
      "Give concrete examples"
    ]
  }
];

export const syntaxConfig: SkillModuleConfig = {
  moduleType: 'syntax',
  title: 'Syntax & Grammar',
  description: 'Demonstrate your grammatical accuracy and sentence complexity',
  prompts: syntaxPrompts
};
