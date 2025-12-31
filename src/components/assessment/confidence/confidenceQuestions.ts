export type QuestionType = 'slider' | 'likert' | 'scenario' | 'tradeoff';

export interface SliderQuestionConfig {
  id: string;
  type: 'slider';
  prompt: string;
  leftLabel: string;
  rightLabel: string;
  min: number;
  max: number;
  reverse?: boolean;
}

export interface LikertQuestionConfig {
  id: string;
  type: 'likert';
  prompt: string;
  options: string[];
  reverse?: boolean;
}

export interface ScenarioOption {
  id: string;
  text: string;
  score: number;
}

export interface ScenarioQuestionConfig {
  id: string;
  type: 'scenario';
  prompt: string;
  options: ScenarioOption[];
}

export interface TradeoffQuestionConfig {
  id: string;
  type: 'tradeoff';
  prompt: string;
  options: ScenarioOption[];
}

export type ConfidenceQuestionConfig = 
  | SliderQuestionConfig 
  | LikertQuestionConfig 
  | ScenarioQuestionConfig 
  | TradeoffQuestionConfig;

export const confidenceQuestions: ConfidenceQuestionConfig[] = [
  {
    id: 'q1',
    type: 'slider',
    prompt: "How confident do you feel starting a conversation in French with someone you don't know well?",
    leftLabel: "I avoid it",
    rightLabel: "I do it easily",
    min: 0,
    max: 10
  },
  {
    id: 'q2',
    type: 'likert',
    prompt: "Even if I can't find the exact word, I keep going (paraphrase, simpler words, gestures).",
    options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"]
  },
  {
    id: 'q3',
    type: 'scenario',
    prompt: "Someone corrects you mid-sentence. What do you do?",
    options: [
      { id: 'a', text: "I stop talking / feel embarrassed and speak less", score: 0 },
      { id: 'b', text: "I acknowledge it and continue cautiously", score: 5 },
      { id: 'c', text: "I try again immediately and keep the conversation moving", score: 10 },
      { id: 'd', text: "I joke about it and keep talking", score: 8 }
    ]
  },
  {
    id: 'q4',
    type: 'likert',
    prompt: "How often do you avoid speaking because you might make mistakes?",
    options: ["Never", "Rarely", "Sometimes", "Often", "Almost always"],
    reverse: true
  },
  {
    id: 'q5',
    type: 'scenario',
    prompt: "You're in a group conversation and you miss a sentence.",
    options: [
      { id: 'a', text: "I tune out and say as little as possible", score: 0 },
      { id: 'b', text: "I wait for a perfect moment and maybe speak later", score: 4 },
      { id: 'c', text: "I jump in with a short comment or question to re-enter", score: 8 },
      { id: 'd', text: "I confidently ask for clarification and keep participating", score: 10 }
    ]
  },
  {
    id: 'q6',
    type: 'tradeoff',
    prompt: "In conversation, which matters more in the moment?",
    options: [
      { id: 'a', text: "Being correct (I'd rather stay quiet than say it wrong)", score: 0 },
      { id: 'b', text: "Being understood (I'll speak even if it's imperfect)", score: 10 }
    ]
  },
  {
    id: 'q7',
    type: 'likert',
    prompt: "I can speak without mentally planning full sentences first.",
    options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"]
  },
  {
    id: 'q8',
    type: 'slider',
    prompt: "After speaking, how much do you replay your mistakes and feel bad about them?",
    leftLabel: "Not at all",
    rightLabel: "A lot",
    min: 0,
    max: 10,
    reverse: true
  }
];

// Scoring functions
export function calculateSliderScore(value: number, reverse?: boolean): number {
  return reverse ? 10 - value : value;
}

export function calculateLikertScore(index: number, reverse?: boolean): number {
  const score = index * 2.5; // 0, 2.5, 5, 7.5, 10
  return reverse ? 10 - score : score;
}

export function calculateScenarioScore(optionId: string, options: ScenarioOption[]): number {
  const option = options.find(o => o.id === optionId);
  return option?.score ?? 0;
}

// Calculate total score from responses
export function calculateQuestionnaireScore(responses: Record<string, number | string>): {
  rawScore: number;
  normalizedScore: number;
  honestyFlag: boolean;
  individualScores: Record<string, number>;
} {
  const individualScores: Record<string, number> = {};
  
  confidenceQuestions.forEach(q => {
    const answer = responses[q.id];
    
    if (q.type === 'slider') {
      individualScores[q.id] = calculateSliderScore(answer as number, q.reverse);
    } else if (q.type === 'likert') {
      individualScores[q.id] = calculateLikertScore(answer as number, q.reverse);
    } else if (q.type === 'scenario' || q.type === 'tradeoff') {
      individualScores[q.id] = calculateScenarioScore(answer as string, q.options);
    }
  });
  
  const rawScore = Object.values(individualScores).reduce((sum, score) => sum + score, 0);
  const normalizedScore = (rawScore / 80) * 100;
  
  // Honesty check: Q2 high (keep going) but Q4 also high (avoid mistakes)
  // Q2 score >= 7.5 means index 3 or 4 (Agree/Strongly agree)
  // Q4 is reverse-scored, so low normalized score means they DO avoid mistakes
  const q2Score = individualScores.q2;
  const q4Score = individualScores.q4;
  const honestyFlag = q2Score >= 7.5 && q4Score <= 2.5;
  
  return { rawScore, normalizedScore, honestyFlag, individualScores };
}

// Interpretation helper
export function getConfidenceInterpretation(score: number): {
  level: string;
  description: string;
  color: string;
} {
  if (score < 25) {
    return {
      level: "Avoidant",
      description: "High anxiety around speaking - you tend to avoid French conversations",
      color: "text-red-500"
    };
  } else if (score < 50) {
    return {
      level: "Cautious",
      description: "Selective confidence - you speak in comfortable situations only",
      color: "text-amber-500"
    };
  } else if (score < 75) {
    return {
      level: "Functional",
      description: "Practical confidence - you can handle real-life French conversations",
      color: "text-blue-500"
    };
  } else {
    return {
      level: "High",
      description: "Comfortably imperfect - you stay engaged even when making mistakes",
      color: "text-green-500"
    };
  }
}
