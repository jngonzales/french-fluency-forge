/**
 * Member Dashboard Types
 * Anti-school vocabulary: member/coach/session/phrases (not student/teacher/lesson/flashcards)
 */

// Dimension keys matching existing assessment
export type DimensionKey = 
  | 'pronunciation'
  | 'fluency'
  | 'confidence'
  | 'syntax'
  | 'conversation'
  | 'comprehension';

// Metric keys for timeline
export type MetricKey = 
  | 'overall'
  | DimensionKey
  | 'phrases_known_recall'
  | 'phrases_known_recognition'
  | 'ai_words_spoken';

// Time ranges
export type TimeRange = '7d' | '30d' | '90d' | 'custom';

// Timeline data point
export interface TimelinePoint {
  date: string; // YYYY-MM-DD
  value: number; // 0-100 scale
  type: 'actual' | 'projected';
}

// Timeline series with projections
export interface TimelineSeries {
  metric: MetricKey;
  actual: TimelinePoint[];
  projected: {
    mid: TimelinePoint[];
    low: TimelinePoint[];
    high: TimelinePoint[];
  };
}

// Habit frequency
export type HabitFrequency = 'daily' | 'weekly';

// Habit cell status
export type HabitCellStatus = 'done' | 'missed' | 'na' | 'future';

// Habit definition
export interface Habit {
  id: string;
  name: string;
  frequency: HabitFrequency;
  source: 'system' | 'personal';
  intensity?: number; // 1-6, optional
  createdAt: string;
}

// Habit grid cell
export interface HabitCell {
  habitId: string;
  date: string; // YYYY-MM-DD
  status: HabitCellStatus;
  intensity?: number; // 1-6 for 'done' status
}

// Goal types
export type GoalType = 'skill' | 'volume' | 'freeform';

// Goal definition
export interface Goal {
  id: string;
  name: string;
  description: string;
  acceptanceCriteria: string;
  deadline: string; // YYYY-MM-DD
  type: GoalType;
  locked: boolean;
  createdAt: string;
  
  // For skill goals
  dimension?: DimensionKey;
  targetScore?: number; // 0-100
  
  // For volume goals
  metric?: MetricKey;
  targetValue?: number;
}

// Badge definition
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  category: 'streak' | 'milestone' | 'achievement';
  points: number;
  unlocked: boolean;
  unlockedAt?: string;
  
  // Unlock criteria
  criteria: {
    type: 'streak' | 'count' | 'progress' | 'custom';
    target?: number;
    metric?: string;
  };
}

// Phrase stats (Anki-inspired)
export interface PhraseStats {
  recall: {
    learning: number;
    known: number;
    new: number;
    total: number;
    progress: number; // 0-100
  };
  recognition: {
    learning: number;
    known: number;
    new: number;
    total: number;
    progress: number; // 0-100
  };
  vocabulary: {
    activeSize: number;
    passiveSize: number;
  };
}

// AI metrics
export interface AIMetrics {
  wordsSpoken: number;
  minutesSpoken: number;
  sessionsCount: number;
  dailyData?: Array<{
    date: string;
    words: number;
  }>;
}

// Assessment snapshot (from real data)
export interface AssessmentSnapshot {
  sessionId: string;
  date: string;
  overall: number; // 0-100
  dimensions: {
    pronunciation: number;
    fluency: number;
    confidence: number;
    syntax: number;
    conversation: number;
    comprehension: number;
  };
}

// Plan key
export type PlanKey = '3090' | 'continuity' | 'software';

// Feature access
export interface PlanFeatures {
  phrases: boolean;
  fluencyAnalyzer: boolean;
  aiTutor: boolean;
  groupCoaching: boolean;
  groupConversations: boolean;
  oneOnOneCoaching: boolean;
}

// Complete dashboard data
export interface DashboardData {
  member: {
    id: string;
    name: string;
    email: string;
    plan: PlanKey;
    features: PlanFeatures;
  };
  assessments: {
    baseline?: AssessmentSnapshot; // First assessment
    current?: AssessmentSnapshot; // Latest assessment
    history: AssessmentSnapshot[];
  };
  timeline: TimelineSeries[];
  habits: Habit[];
  habitGrid: HabitCell[];
  goals: Goal[];
  phrases: PhraseStats;
  aiMetrics: AIMetrics;
  badges: Badge[];
  points: number;
}

// Loading states
export interface DashboardLoadingState {
  assessments: boolean;
  habits: boolean;
  goals: boolean;
  phrases: boolean;
  aiMetrics: boolean;
  badges: boolean;
}

