import type { SkillPrompt, SkillModuleConfig } from '../shared/types';

export const conversationPrompts: SkillPrompt[] = [
  {
    id: 'conversation-1',
    text: "Imaginez que vous êtes dans une réunion de travail et votre collègue dit : 'Je pense qu'on devrait reconsidérer notre approche concernant le projet, surtout en tenant compte des retours qu'on a reçus la semaine dernière sur les aspects budgétaires et le calendrier.' Que répondriez-vous ?",
    textTranslation: "Imagine you're in a work meeting and your colleague says: 'I think we should reconsider our approach regarding the project, especially considering the feedback we received last week about budget aspects and the timeline.' What would you respond?",
    duration: 30,
    tips: [
      "If you don't fully understand, it's OK to ask for clarification",
      "Show that you understood the key points",
      "Respond naturally as you would in a real conversation"
    ]
  },
  {
    id: 'conversation-2',
    text: "Un ami vous demande conseil : 'Tu sais, j'hésite vraiment entre accepter cette nouvelle offre d'emploi qui paie mieux mais qui est plus loin, ou rester là où je suis avec mes collègues que j'adore mais sans vraie perspective d'évolution.' Qu'est-ce que vous lui diriez ?",
    textTranslation: "A friend asks you for advice: 'You know, I'm really hesitating between accepting this new job offer that pays better but is further away, or staying where I am with colleagues I love but without real growth prospects.' What would you tell them?",
    duration: 30,
    tips: [
      "Engage with their dilemma",
      "Use discourse markers (bon, alors, en fait...)",
      "Show empathy and give thoughtful advice"
    ]
  }
];

export const conversationConfig: SkillModuleConfig = {
  moduleType: 'conversation',
  title: 'Conversation Skills',
  description: 'Demonstrate your ability to understand and respond naturally in conversation',
  prompts: conversationPrompts
};
