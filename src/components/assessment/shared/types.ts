export interface SkillPrompt {
  id: string;
  text: string;
  textTranslation?: string;
  duration: number; // in seconds
  tips?: string[];
}

export interface SkillModuleConfig {
  moduleType: 'confidence' | 'syntax' | 'conversation';
  title: string;
  description: string;
  prompts: SkillPrompt[];
}

export type SkillRecordingState = 
  | 'ready' 
  | 'countdown' 
  | 'recording' 
  | 'uploading' 
  | 'processing' 
  | 'done' 
  | 'error';

export interface SkillRecordingResult {
  id: string;
  transcript: string;
  wordCount: number;
  score: number;
  feedback: string;
  breakdown: Record<string, number>;
}
