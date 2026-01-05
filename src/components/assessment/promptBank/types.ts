/**
 * Prompt Bank Types
 * Defines the structure of prompt banks and prompts
 */

export type ModuleType = 
  | 'pronunciation' 
  | 'fluency' 
  | 'confidence' 
  | 'syntax' 
  | 'conversation' 
  | 'comprehension';

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface PromptBase {
  id: string;
  type: string;
  tags: string[];
  difficulty: number; // 1-5
  cefr?: CEFRLevel;
}

// Fluency prompts (picture description)
export interface FluencyPrompt extends PromptBase {
  type: 'picture';
  payload: {
    imageUrl: string;
    description: string;
    altText?: string;
  };
}

// Pronunciation prompts (read aloud or listen & repeat)
export interface PronunciationPrompt extends PromptBase {
  type: 'read_aloud' | 'listen_repeat';
  payload: {
    text: string;
    audioUrl?: string; // For listen & repeat
    phonemes?: string[]; // IPA phonemes being tested
    phonetic?: string; // IPA transcription
  };
}

// Confidence prompts (speaking about confidence)
export interface ConfidencePrompt extends PromptBase {
  type: 'speaking';
  payload: {
    question: string;
    context?: string;
  };
}

// Syntax prompts (syntax exercises)
export interface SyntaxPrompt extends PromptBase {
  type: 'syntax_exercise';
  payload: {
    exerciseType: 'E1' | 'E2' | 'E3';
    duration: 15 | 30 | 60;
    instruction: string;
    targetStructures: string[];
  };
}

// Conversation prompts (dialogue scenarios)
export interface ConversationPrompt extends PromptBase {
  type: 'scenario';
  payload: {
    scenario: string;
    role: string;
    context: string;
  };
}

// Comprehension prompts (listen and answer)
export interface ComprehensionPrompt extends PromptBase {
  type: 'listen_answer';
  payload: {
    audioUrl: string;
    audioScript: string;
    question: string;
    keyFacts: string[];
    acceptableIntents: string[];
  };
}

export type Prompt = 
  | FluencyPrompt 
  | PronunciationPrompt 
  | ConfidencePrompt 
  | SyntaxPrompt 
  | ConversationPrompt 
  | ComprehensionPrompt;

export interface PromptBank {
  version: string;
  module: ModuleType;
  prompts: Prompt[];
  meta?: {
    description?: string;
    lastUpdated?: string;
    author?: string;
  };
}

export interface PromptSelection {
  [module: string]: string[]; // module -> array of prompt IDs
}

