// 3-Axis Personality Quiz Configuration
// Axes: Control↔Flow, Accuracy↔Expressiveness, Security↔Risk

export type AxisKey = 'control_flow' | 'accuracy_expressiveness' | 'security_risk';

export interface AxisDelta {
  axis: AxisKey;
  delta: number; // -2 to +2
}

export interface QuizOption {
  id: string;
  text: string;
  primary: AxisDelta;
  secondary?: AxisDelta;
}

export interface BaseQuestion {
  id: string;
  prompt: string;
  type: 'scenario' | 'trade_off' | 'likert' | 'slider' | 'ranking' | 'character';
  isIdealSelf?: boolean; // for consistency gap calculation
  isPressureContext?: boolean;
}

export interface ScenarioQuestion extends BaseQuestion {
  type: 'scenario';
  options: QuizOption[];
}

export interface TradeOffQuestion extends BaseQuestion {
  type: 'trade_off';
  options: [QuizOption, QuizOption];
}

export interface LikertQuestion extends BaseQuestion {
  type: 'likert';
  options: QuizOption[];
}

export interface SliderQuestion extends BaseQuestion {
  type: 'slider';
  leftLabel: string;
  rightLabel: string;
  leftAxis: AxisDelta;
  rightAxis: AxisDelta;
  secondaryLeft?: AxisDelta;
  secondaryRight?: AxisDelta;
}

export interface RankingQuestion extends BaseQuestion {
  type: 'ranking';
  items: { id: string; text: string; axis: AxisKey; direction: 'positive' | 'negative' }[];
}

export interface CharacterQuestion extends BaseQuestion {
  type: 'character';
  characters: { id: string; name: string; description: string; axes: AxisDelta[] }[];
}

export type QuizQuestion = ScenarioQuestion | TradeOffQuestion | LikertQuestion | SliderQuestion | RankingQuestion | CharacterQuestion;

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // Q1 - Scenario: Control↔Flow + Security
  {
    id: 'q1',
    type: 'scenario',
    prompt: "You're mid-sentence and realize you don't know the grammar you need. What do you do?",
    isPressureContext: true,
    options: [
      { id: 'a', text: 'Stop and rephrase carefully', primary: { axis: 'control_flow', delta: -2 }, secondary: { axis: 'security_risk', delta: -1 } },
      { id: 'b', text: 'Keep going with a simpler structure', primary: { axis: 'control_flow', delta: 1 } },
      { id: 'c', text: 'Push through messily, fix it later', primary: { axis: 'control_flow', delta: 2 }, secondary: { axis: 'security_risk', delta: 1 } },
      { id: 'd', text: 'Go quiet and let the other person lead', primary: { axis: 'control_flow', delta: -1 }, secondary: { axis: 'security_risk', delta: -2 } },
    ],
  },
  // Q2 - Scenario: Accuracy↔Expressiveness
  {
    id: 'q2',
    type: 'scenario',
    prompt: 'You want to tell a story but you\'re missing a key word.',
    options: [
      { id: 'a', text: 'I use simpler words and finish the story anyway', primary: { axis: 'accuracy_expressiveness', delta: 2 } },
      { id: 'b', text: 'I pause and search for the exact word', primary: { axis: 'accuracy_expressiveness', delta: -2 }, secondary: { axis: 'control_flow', delta: -1 } },
      { id: 'c', text: 'I ask for the word and continue', primary: { axis: 'accuracy_expressiveness', delta: 1 }, secondary: { axis: 'security_risk', delta: 1 } },
      { id: 'd', text: 'I abandon the story', primary: { axis: 'security_risk', delta: -2 } },
    ],
  },
  // Q3 - Scenario: Security↔Risk
  {
    id: 'q3',
    type: 'scenario',
    prompt: 'Someone corrects you in real time.',
    isPressureContext: true,
    options: [
      { id: 'a', text: 'I feel embarrassed and speak less', primary: { axis: 'security_risk', delta: -2 } },
      { id: 'b', text: 'I ask questions and try again immediately', primary: { axis: 'security_risk', delta: 2 } },
      { id: 'c', text: 'I correct myself and continue cautiously', primary: { axis: 'control_flow', delta: -1 }, secondary: { axis: 'accuracy_expressiveness', delta: -1 } },
      { id: 'd', text: 'I joke and keep talking', primary: { axis: 'security_risk', delta: 1 }, secondary: { axis: 'accuracy_expressiveness', delta: 1 } },
    ],
  },
  // Q4 - Trade-off: Control↔Flow
  {
    id: 'q4',
    type: 'trade_off',
    prompt: 'Which feels more like you?',
    options: [
      { id: 'a', text: "I'd rather be prepared than surprised", primary: { axis: 'control_flow', delta: -2 } },
      { id: 'b', text: "I'd rather be surprised than overprepared", primary: { axis: 'control_flow', delta: 2 } },
    ],
  },
  // Q5 - Trade-off: Accuracy↔Expressiveness + Security/Risk
  {
    id: 'q5',
    type: 'trade_off',
    prompt: 'In conversation…',
    options: [
      { id: 'a', text: "If it's not correct, I'd rather not say it", primary: { axis: 'accuracy_expressiveness', delta: -2 }, secondary: { axis: 'security_risk', delta: -1 } },
      { id: 'b', text: "If it communicates, I'll say it", primary: { axis: 'accuracy_expressiveness', delta: 2 }, secondary: { axis: 'security_risk', delta: 1 } },
    ],
  },
  // Q6 - Trade-off: Security↔Risk + Control/Flow
  {
    id: 'q6',
    type: 'trade_off',
    prompt: 'Practice should be…',
    options: [
      { id: 'a', text: 'Safe practice first, real conversations later', primary: { axis: 'security_risk', delta: -2 }, secondary: { axis: 'control_flow', delta: -1 } },
      { id: 'b', text: 'Real conversations ARE the practice', primary: { axis: 'security_risk', delta: 2 }, secondary: { axis: 'control_flow', delta: 1 } },
    ],
  },
  // Q7 - Likert: Accuracy↔Expressiveness
  {
    id: 'q7',
    type: 'likert',
    prompt: 'How often do you restart a sentence to make it "more correct"?',
    options: [
      { id: 'never', text: 'Never', primary: { axis: 'accuracy_expressiveness', delta: 2 } },
      { id: 'sometimes', text: 'Sometimes', primary: { axis: 'accuracy_expressiveness', delta: 1 } },
      { id: 'often', text: 'Often', primary: { axis: 'accuracy_expressiveness', delta: -1 } },
      { id: 'always', text: 'Almost always', primary: { axis: 'accuracy_expressiveness', delta: -2 } },
    ],
  },
  // Q8 - Likert: Control↔Flow
  {
    id: 'q8',
    type: 'likert',
    prompt: 'How often do you plan sentences in your head before speaking?',
    options: [
      { id: 'never', text: 'Never', primary: { axis: 'control_flow', delta: 2 } },
      { id: 'sometimes', text: 'Sometimes', primary: { axis: 'control_flow', delta: 1 } },
      { id: 'often', text: 'Often', primary: { axis: 'control_flow', delta: -1 } },
      { id: 'always', text: 'Always', primary: { axis: 'control_flow', delta: -2 } },
    ],
  },
  // Q9 - Likert: Security↔Risk
  {
    id: 'q9',
    type: 'likert',
    prompt: 'How often do you avoid speaking because you might make mistakes?',
    options: [
      { id: 'never', text: 'Never', primary: { axis: 'security_risk', delta: 2 } },
      { id: 'sometimes', text: 'Sometimes', primary: { axis: 'security_risk', delta: 1 } },
      { id: 'often', text: 'Often', primary: { axis: 'security_risk', delta: -1 } },
      { id: 'always', text: 'Always', primary: { axis: 'security_risk', delta: -2 } },
    ],
  },
  // Q10 - Ranking: Priorities
  {
    id: 'q10',
    type: 'ranking',
    prompt: 'Rank what matters most to you in conversation (drag to reorder)',
    items: [
      { id: 'understood', text: 'Being understood', axis: 'accuracy_expressiveness', direction: 'positive' },
      { id: 'correct', text: 'Being correct', axis: 'accuracy_expressiveness', direction: 'negative' },
      { id: 'relaxed', text: 'Feeling relaxed / not judged', axis: 'security_risk', direction: 'negative' },
      { id: 'smooth', text: 'Speaking smoothly without planning', axis: 'control_flow', direction: 'positive' },
    ],
  },
  // Q11 - Slider: Phrasing paralysis
  {
    id: 'q11',
    type: 'slider',
    prompt: "When I don't know the right words to react in the moment, I usually…",
    leftLabel: 'Say something anyway',
    rightLabel: 'Stay quiet',
    leftAxis: { axis: 'control_flow', delta: 2 },
    rightAxis: { axis: 'control_flow', delta: -2 },
    secondaryRight: { axis: 'security_risk', delta: -2 },
    isPressureContext: true,
  },
  // Q12 - Slider: Word-search pain
  {
    id: 'q12',
    type: 'slider',
    prompt: "If I can't find the exact word, I…",
    leftLabel: 'Paraphrase fast and keep going',
    rightLabel: 'Stop and search until I find it',
    leftAxis: { axis: 'accuracy_expressiveness', delta: 2 },
    rightAxis: { axis: 'accuracy_expressiveness', delta: -2 },
    secondaryRight: { axis: 'control_flow', delta: -1 },
  },
  // Q13 - Scenario: Avoidance triggers
  {
    id: 'q13',
    type: 'scenario',
    prompt: 'Which situation feels most stressful in French?',
    options: [
      { id: 'a', text: 'An unexpected phone call', primary: { axis: 'security_risk', delta: -2 } },
      { id: 'b', text: 'A fast-paced group conversation', primary: { axis: 'security_risk', delta: -2 } },
      { id: 'c', text: 'A long one-on-one chat with someone new', primary: { axis: 'security_risk', delta: -1 } },
      { id: 'd', text: 'Ordering in a busy, noisy café', primary: { axis: 'security_risk', delta: -1 } },
    ],
  },
  // Q14 - Ideal-self check
  {
    id: 'q14',
    type: 'scenario',
    prompt: 'If I could snap my fingers and change one thing instantly, I\'d choose…',
    isIdealSelf: true,
    options: [
      { id: 'a', text: 'Speak more spontaneously', primary: { axis: 'control_flow', delta: 2 } },
      { id: 'b', text: 'Speak more correctly', primary: { axis: 'accuracy_expressiveness', delta: -2 } },
      { id: 'c', text: 'Feel calmer / less judged', primary: { axis: 'security_risk', delta: -2 } },
      { id: 'd', text: 'Tell stories and express myself better', primary: { axis: 'accuracy_expressiveness', delta: 2 } },
    ],
  },
  // Q15 - Character affinity
  {
    id: 'q15',
    type: 'character',
    prompt: "Let's bet — can you guess which language learner personality you are?",
    characters: [
      { id: 'strategist', name: 'The Strategist', description: 'Plans every move, loves systems', axes: [{ axis: 'control_flow', delta: -1 }, { axis: 'accuracy_expressiveness', delta: -1 }] },
      { id: 'performer', name: 'The Performer', description: 'Loves the spotlight, expressive', axes: [{ axis: 'accuracy_expressiveness', delta: 1 }, { axis: 'security_risk', delta: 1 }] },
      { id: 'explorer', name: 'The Explorer', description: 'Dives in, figures it out later', axes: [{ axis: 'control_flow', delta: 1 }, { axis: 'security_risk', delta: 1 }] },
      { id: 'perfectionist', name: 'The Perfectionist', description: 'High standards, careful work', axes: [{ axis: 'accuracy_expressiveness', delta: -1 }, { axis: 'security_risk', delta: -1 }] },
      { id: 'diplomat', name: 'The Diplomat', description: 'Connects through conversation', axes: [{ axis: 'accuracy_expressiveness', delta: 1 }, { axis: 'security_risk', delta: -1 }] },
      { id: 'hacker', name: 'The Hacker', description: 'Finds shortcuts, breaks rules', axes: [{ axis: 'control_flow', delta: 1 }, { axis: 'accuracy_expressiveness', delta: 1 }] },
    ],
  },
];

// Archetype definitions based on 3-axis positions
export interface Archetype {
  id: string;
  name: string;
  emoji: string;
  signature: string;
  description: string; // Long Barnum-style description
  strengths: string;
  bottleneck: string;
  fastestPath: string;
  dangerPath: string;
  encouragement?: string;
  recommendations: {
    keep: string[];
    add: string[];
    watchOut: string;
  };
}

// Badge definitions for extreme axis scores
export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  axis: AxisKey;
  direction: 'low' | 'high'; // low = ≤20, high = ≥80
}

export const BADGES: Badge[] = [
  {
    id: 'strategist',
    name: 'The Strategist',
    icon: '♜',
    description: "You're wired for structure. You plan, you organize, you build foundations — and you notice patterns others miss.",
    axis: 'control_flow',
    direction: 'low',
  },
  {
    id: 'improviser',
    name: 'The Improviser',
    icon: '🌊',
    description: "You learn by doing. You stay in motion, you keep the conversation alive, and you don't need perfect conditions to speak.",
    axis: 'control_flow',
    direction: 'high',
  },
  {
    id: 'precisionist',
    name: 'The Precisionist',
    icon: '🎯',
    description: "You chase clean language. You care about correctness, nuance, and sounding \"right\" — which becomes powerful once it stops slowing you down.",
    axis: 'accuracy_expressiveness',
    direction: 'low',
  },
  {
    id: 'storyteller',
    name: 'The Storyteller',
    icon: '✨',
    description: "You communicate. You find a way to express ideas, keep people engaged, and make the language feel alive.",
    axis: 'accuracy_expressiveness',
    direction: 'high',
  },
  {
    id: 'safe_builder',
    name: 'The Safe Builder',
    icon: '🛡️',
    description: "You protect your confidence. You prefer safe reps before exposure — and with the right ladder, you can grow fast without panic.",
    axis: 'security_risk',
    direction: 'low',
  },
  {
    id: 'brave_starter',
    name: 'The Brave Starter',
    icon: '🚀',
    description: "You're willing to look imperfect to get better. You take social risks, learn in public, and build confidence through reps.",
    axis: 'security_risk',
    direction: 'high',
  },
];

// Get badges for a user based on their axis scores
export function getEarnedBadges(axes: {
  control_flow: number;
  accuracy_expressiveness: number;
  security_risk: number;
}): Badge[] {
  const earned: Badge[] = [];
  
  for (const badge of BADGES) {
    const score = axes[badge.axis];
    if (badge.direction === 'low' && score <= 20) {
      earned.push(badge);
    } else if (badge.direction === 'high' && score >= 80) {
      earned.push(badge);
    }
  }
  
  // Sort by distance from 50 (strongest extremes first) and limit to 4
  earned.sort((a, b) => {
    const distA = Math.abs(axes[a.axis] - 50);
    const distB = Math.abs(axes[b.axis] - 50);
    return distB - distA;
  });
  
  return earned.slice(0, 4);
}

export const ARCHETYPES: Record<string, Archetype> = {
  careful_builder: {
    id: 'careful_builder',
    name: 'The Careful Builder',
    emoji: '🏗️',
    signature: 'Control + Accuracy + Security',
    description: `You're the kind of learner who respects the language. You don't want to "wing it" and hope for the best — you want to get it right, and there's something deeply responsible about that. You probably notice details other people miss: little grammar signals, word choice nuances, the exact phrasing that makes a sentence sound natural. When you're in your zone, you can build real competence fast… but your superpower has a shadow: you can feel a split-second "scan" before speaking — Is this correct? Is this the right tense? Is my phrasing weird? That scan steals speed. You may also experience "phrasing paralysis": you know what you mean, but you don't know how to react naturally in the moment, so you simplify, restart, or go quiet. The good news is you don't need to abandon your standards — you just need a bridge from "rules" to "reflex." Once you train fast, imperfect output and stop treating mistakes like a threat, your accuracy turns into effortless confidence.`,
    strengths: 'You build solid foundations. Your grammar and vocabulary knowledge are assets.',
    bottleneck: 'Overthinking slows you down. You may avoid speaking until you feel "ready."',
    fastestPath: 'Structured conversation practice with gentle real-world exposure.',
    dangerPath: 'Endless preparation without practice leads to stagnation.',
    encouragement: "Your brain is optimized for safety and correctness — we'll train speed and improvisation without losing quality.",
    recommendations: {
      keep: ['Structured practice', 'Deliberate drills', 'Noticing patterns'],
      add: [
        '"Good-enough sentence" rule: say it at ~70% correct and keep moving.',
        '10-minute daily reaction practice (micro-situations: surprise, disagreement, jokes).',
        '2 "intentional mistakes" per conversation to desensitize fear.',
        'Replace "perfect word" with fast paraphrase (same meaning, simpler words).',
      ],
      watchOut: 'Restarting sentences mid-stream; going silent to avoid errors.',
    },
  },
  conversation_surfer: {
    id: 'conversation_surfer',
    name: 'The Conversation Surfer',
    emoji: '🏄',
    signature: 'Flow + Expressiveness + Risk',
    description: `You learn like a musician improvises: you jump in, you ride the wave, you make meaning happen. You're the person who can hold a conversation even when your French isn't perfect — and that's a rare, valuable advantage. You probably feel most alive when you're interacting with real humans, not doing exercises. Under pressure, you don't freeze — you find a way. The downside is subtle: because you can "make it work," it's easy to tolerate messy sentences and let certain mistakes fossilize. At some point, you may hit a weird frustration: "I speak a lot… so why am I not progressing?" You might even know what's wrong (accent, a few recurring mistakes), but fixing it feels like work, and speaking is more fun. Your next level isn't "more conversation" — it's tiny, consistent upgrades that keep the fun while making your French cleaner every week.`,
    strengths: 'You jump in and communicate. People understand you and enjoy talking with you.',
    bottleneck: 'Mistakes may fossilize. You might plateau without focused correction work.',
    fastestPath: 'Targeted feedback sessions to clean up recurring errors.',
    dangerPath: "Avoiding correction work because 'it's more fun to just talk.'",
    recommendations: {
      keep: ['High exposure', 'Lots of conversation', 'Bold participation'],
      add: [
        'Choose one "upgrade target" per week (1 sound, 1 grammar pattern, or 3 phrases).',
        'Record 30 seconds/day → fix just 1 thing → repeat once.',
        'Create a "My 5 fossilized mistakes" list and attack one per week.',
        'After conversations, write 3 cleaner versions of sentences you said messily.',
      ],
      watchOut: 'Avoiding correction because it feels like "work" — your future self will thank you.',
    },
  },
  agile_improver: {
    id: 'agile_improver',
    name: 'The Agile Improver',
    emoji: '⚡',
    signature: 'Flow + Accuracy + Risk',
    description: `You're rare: you're comfortable speaking and you actually want to refine. You'll take a swing in conversation, then you'll ask, "Wait — how do I say that better?" You're not fragile about mistakes; you treat them like data. When you're learning well, your progress is fast because you combine real-world reps with micro-corrections. Your challenge is usually bandwidth: you can take on too many "fixes" at once, or you can start optimizing mid-sentence and accidentally slow your flow. The opportunity is learning to separate modes: in conversation, you prioritize momentum; after the conversation, you polish one or two high-leverage upgrades. Done right, you become the learner who stays fearless and keeps leveling up — without burning out.`,
    strengths: "You adapt quickly and aren't afraid to be wrong. You learn from feedback.",
    bottleneck: 'You may focus on details that slow you down without adding value.',
    fastestPath: 'Balance improvisation with periodic accuracy reviews.',
    dangerPath: 'Perfectionism creeping back in under pressure.',
    recommendations: {
      keep: ['Speak early', 'Ask for feedback', 'Iterate quickly'],
      add: [
        'Use a "1 correction rule" per conversation (not 10).',
        'Build "upgrade phrases" (better connectors, reactions, sentence starters).',
        'Practice fast self-repair: correct after you finish the idea, not during.',
        'Weekly mini-drill: 5 minutes/day on one pronunciation point.',
      ],
      watchOut: "Turning conversations into a performance review while you're still speaking.",
    },
  },
  thoughtful_communicator: {
    id: 'thoughtful_communicator',
    name: 'The Thoughtful Communicator',
    emoji: '💭',
    signature: 'Control + Expressiveness + Security',
    description: `You care about connection. You want to speak in a way that feels human, warm, and socially appropriate — not robotic. You're often good at tone, politeness, and building rapport… but you can hesitate when the situation becomes unpredictable (jokes, conflict, fast group dynamics). You might have moments where you know what you want to say emotionally, but you can't get the phrasing out quickly, so you simplify too much or withdraw. You can also overthink grammar or word choice when the stakes feel social, which is why phone calls and groups may feel especially stressful. The opportunity for you is to become more situationally agile: once you train ready-to-use reactions and conversational scaffolding, you'll keep your natural warmth while gaining speed and confidence in real-life chaos.`,
    strengths: 'You think before you speak and communicate clearly when you do.',
    bottleneck: 'Fear of judgment may hold you back from speaking up.',
    fastestPath: 'Safe practice spaces to build confidence, then gradual exposure.',
    dangerPath: 'Staying in "safe" practice forever without real conversations.',
    encouragement: "Your thoughtfulness is a strength — we'll build your confidence to share it more freely.",
    recommendations: {
      keep: ['Focusing on meaning', 'Empathy', 'Conversational intent'],
      add: [
        'Memorize reaction kits (surprise, sympathy, disagreement, playful teasing).',
        'Use "connector scaffolds" (en fait, du coup, genre, bref) to buy time naturally.',
        'Do 2x/week group-conversation simulation (interrupting politely, jumping in).',
        'Train "first sentence fast": start quickly, then refine as you go.',
      ],
      watchOut: 'Waiting for the perfect phrase before participating.',
    },
  },
  friendly_talker: {
    id: 'friendly_talker',
    name: 'The Friendly Talker',
    emoji: '😊',
    signature: 'Flow + Expressiveness + Security',
    description: `You're sociable in a gentle way: you like the language, you like people, and you're often happiest in friendly one-on-one situations. You can communicate, you can keep things moving, and you don't need perfection to participate… but you still avoid the moments that feel "exposing" — like phone calls, fast groups, or anything where you might look foolish. Your risk isn't that you can't speak; it's that you self-limit: you stay in comfortable topics, comfortable speeds, comfortable environments. That's why progress can feel inconsistent — you're getting reps, but not always the reps that stretch you. The best news: you don't need a new personality. You need a simple bravery ladder: tiny exposures that feel doable, repeated until they become normal.`,
    strengths: 'You connect well with people and keep conversations going.',
    bottleneck: 'You may avoid challenging situations that would stretch your skills.',
    fastestPath: 'Gradual exposure to more challenging conversation contexts.',
    dangerPath: 'Staying comfortable and not pushing your boundaries.',
    recommendations: {
      keep: ['Regular speaking', 'Friendly interactions', 'Keeping the vibe positive'],
      add: [
        '"1 brave move per day" (ask a follow-up question, give an opinion, disagree politely).',
        'Weekly phone-call exposure ladder: 30 seconds → 2 minutes → 5 minutes.',
        'Create a "group entry line" script (3 ways to jump into a group convo).',
        'Add one structured micro-drill: clean up one messy habit per week.',
      ],
      watchOut: "Telling yourself \"I'm not that type of person\" — you don't need a new identity, just new reps.",
    },
  },
  driven_technician: {
    id: 'driven_technician',
    name: 'The Driven Technician',
    emoji: '🔧',
    signature: 'Control + Accuracy + Risk',
    description: `You're intense in a good way. You want results, you want competence, and you're willing to work for it. You can take correction without crumbling; you can handle discomfort; and you're motivated by mastery. You often do well with systems, metrics, and practice plans — but you may also overbuild the system and underuse it in real conversation. In other words: you can become so focused on technique that you forget that language is ultimately a live sport. You might also overthink phrasing under pressure because you know the "right way," so anything less feels inefficient. The opportunity is to channel your discipline into a simple loop: prepare smart, speak a lot, then polish a little. When you balance execution with refinement, you become unstoppable.`,
    strengths: 'You have high standards and work hard to improve.',
    bottleneck: 'Risk aversion may slow your real-world progress.',
    fastestPath: 'Structured challenges with clear success metrics.',
    dangerPath: 'Over-analyzing instead of practicing.',
    encouragement: "Your drive is powerful — we'll channel it into effective practice, not endless preparation.",
    recommendations: {
      keep: ['Disciplined practice', 'Feedback tolerance', 'Deliberate improvement'],
      add: [
        'Schedule speaking reps like workouts (non-negotiable).',
        'Train "speed mode" sessions: 3 minutes speaking with zero self-correction.',
        'Use a "prep → perform → polish" loop: drill first, speak live, fix only 1–2 items after.',
        'Add "messy fluency" drills (talk through uncertainty without stopping).',
      ],
      watchOut: 'Optimizing forever before stepping into live conversation.',
    },
  },
  adaptive_learner: {
    id: 'adaptive_learner',
    name: 'The Adaptive Learner',
    emoji: '🎭',
    signature: 'Balanced Profile',
    description: `You don't fit neatly into one box — and that's actually an advantage. You can flex between different modes: sometimes careful, sometimes spontaneous; sometimes focused on accuracy, sometimes prioritizing connection. This versatility means you can adapt to different learning contexts and conversation styles. The challenge? Without a clear pattern, it can be harder to know what to optimize. The opportunity is to become intentional about which mode you use when. In practice, this means choosing "Flow mode" for real conversations and "Control mode" for focused study — not mixing them randomly.`,
    strengths: "You're flexible and can adjust to different situations.",
    bottleneck: 'You may lack a clear learning direction or strategy.',
    fastestPath: 'Define specific goals and build consistent practice habits.',
    dangerPath: 'Trying everything without committing to anything.',
    recommendations: {
      keep: ['Flexibility', 'Willingness to try different approaches', 'Openness to feedback'],
      add: [
        'Define one clear goal for this month (e.g., smoother reactions, fewer hesitations).',
        'Pick one mode per activity: "Flow mode" for conversations, "Control mode" for drills.',
        'Track your practice so you can see patterns and adjust.',
        'Choose one archetype to "try on" for a week and see how it feels.',
      ],
      watchOut: 'Spreading energy too thin across too many approaches.',
    },
  },
};

// Get archetype based on axis scores
export function getArchetype(
  controlFlow: number,
  accuracyExpressiveness: number,
  securityRisk: number
): Archetype {
  // Determine position on each axis: -1 (left), 0 (balanced), +1 (right)
  const cfLabel = controlFlow < -3 ? -1 : controlFlow > 3 ? 1 : 0; // Control(-1) / Balanced(0) / Flow(1)
  const aeLabel = accuracyExpressiveness < -3 ? -1 : accuracyExpressiveness > 3 ? 1 : 0;
  const srLabel = securityRisk < -3 ? -1 : securityRisk > 3 ? 1 : 0;

  // Map to archetypes
  if (cfLabel === -1 && aeLabel === -1 && srLabel === -1) return ARCHETYPES.careful_builder;
  if (cfLabel === 1 && aeLabel === 1 && srLabel === 1) return ARCHETYPES.conversation_surfer;
  if (cfLabel === 1 && aeLabel === -1 && srLabel === 1) return ARCHETYPES.agile_improver;
  if (cfLabel === -1 && aeLabel === 1 && srLabel === -1) return ARCHETYPES.thoughtful_communicator;
  if (cfLabel === 1 && aeLabel === 1 && srLabel === -1) return ARCHETYPES.friendly_talker;
  if (cfLabel === -1 && aeLabel === -1 && srLabel === 1) return ARCHETYPES.driven_technician;
  
  return ARCHETYPES.adaptive_learner; // default for balanced profiles
}

// Normalize raw score to 0-100 scale
export function normalizeScore(raw: number, maxRange: number = 20): number {
  // Raw ranges roughly from -maxRange/2 to +maxRange/2
  const normalized = ((raw + maxRange / 2) / maxRange) * 100;
  return Math.max(0, Math.min(100, normalized));
}

// Get label for normalized score
export function getAxisLabel(normalized: number, axis: AxisKey): string {
  const labels: Record<AxisKey, [string, string]> = {
    control_flow: ['Control', 'Flow'],
    accuracy_expressiveness: ['Accuracy', 'Expressiveness'],
    security_risk: ['Security', 'Risk'],
  };
  
  if (normalized <= 33) return `Leaning ${labels[axis][0]}`;
  if (normalized >= 67) return `Leaning ${labels[axis][1]}`;
  return 'Balanced';
}
