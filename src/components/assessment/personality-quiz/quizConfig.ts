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
  strengths: string;
  bottleneck: string;
  fastestPath: string;
  dangerPath: string;
  encouragement?: string; // for Control/Accuracy/Security-heavy users
}

export const ARCHETYPES: Record<string, Archetype> = {
  careful_builder: {
    id: 'careful_builder',
    name: 'The Careful Builder',
    emoji: '🏗️',
    strengths: 'You build solid foundations. Your grammar and vocabulary knowledge are assets.',
    bottleneck: 'Overthinking slows you down. You may avoid speaking until you feel "ready."',
    fastestPath: 'Structured conversation practice with gentle real-world exposure.',
    dangerPath: 'Endless preparation without practice leads to stagnation.',
    encouragement: "Your brain is optimized for safety and correctness — we'll train speed and improvisation without losing quality.",
  },
  conversation_surfer: {
    id: 'conversation_surfer',
    name: 'The Conversation Surfer',
    emoji: '🏄',
    strengths: 'You jump in and communicate. People understand you and enjoy talking with you.',
    bottleneck: 'Mistakes may fossilize. You might plateau without focused correction work.',
    fastestPath: 'Targeted feedback sessions to clean up recurring errors.',
    dangerPath: "Avoiding correction work because 'it's more fun to just talk.'",
  },
  agile_improver: {
    id: 'agile_improver',
    name: 'The Agile Improver',
    emoji: '⚡',
    strengths: "You adapt quickly and aren't afraid to be wrong. You learn from feedback.",
    bottleneck: 'You may focus on details that slow you down without adding value.',
    fastestPath: 'Balance improvisation with periodic accuracy reviews.',
    dangerPath: 'Perfectionism creeping back in under pressure.',
  },
  thoughtful_communicator: {
    id: 'thoughtful_communicator',
    name: 'The Thoughtful Communicator',
    emoji: '💭',
    strengths: 'You think before you speak and communicate clearly when you do.',
    bottleneck: 'Fear of judgment may hold you back from speaking up.',
    fastestPath: 'Safe practice spaces to build confidence, then gradual exposure.',
    dangerPath: 'Staying in "safe" practice forever without real conversations.',
    encouragement: "Your thoughtfulness is a strength — we'll build your confidence to share it more freely.",
  },
  adaptive_learner: {
    id: 'adaptive_learner',
    name: 'The Adaptive Learner',
    emoji: '🎭',
    strengths: 'You\'re flexible and can adjust to different situations.',
    bottleneck: 'You may lack a clear learning direction or strategy.',
    fastestPath: 'Define specific goals and build consistent practice habits.',
    dangerPath: 'Trying everything without committing to anything.',
  },
  friendly_talker: {
    id: 'friendly_talker',
    name: 'The Friendly Talker',
    emoji: '😊',
    strengths: 'You connect well with people and keep conversations going.',
    bottleneck: 'You may avoid challenging situations that would stretch your skills.',
    fastestPath: 'Gradual exposure to more challenging conversation contexts.',
    dangerPath: 'Staying comfortable and not pushing your boundaries.',
  },
  driven_technician: {
    id: 'driven_technician',
    name: 'The Driven Technician',
    emoji: '🔧',
    strengths: 'You have high standards and work hard to improve.',
    bottleneck: 'Risk aversion may slow your real-world progress.',
    fastestPath: 'Structured challenges with clear success metrics.',
    dangerPath: 'Over-analyzing instead of practicing.',
    encouragement: "Your drive is powerful — we'll channel it into effective practice, not endless preparation.",
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
