/**
 * Phrases (SRS) Types
 * Anti-school vocabulary: member/coach/session/phrases (not student/teacher/lesson/flashcards)
 */

// Enums
export type PhraseMode = 'recall' | 'recognition';
export type PhraseStatus = 'active' | 'buried' | 'suspended' | 'removed';
export type Rating = 'again' | 'hard' | 'good' | 'easy';
export type SchedulerState = 'new' | 'learning' | 'review' | 'relearning';

// Phrase Content (shared library)
export interface Phrase {
  id: string;
  mode: PhraseMode;
  
  // Recall: show English, expect French
  prompt_en?: string;
  
  // Recognition: audio prompt, reveal transcript+translation
  audio_url?: string;
  transcript_fr?: string;
  translation_en?: string;
  
  // Answers (recall)
  answers_fr?: string[]; // acceptable variants
  canonical_fr?: string; // primary display
  
  tags: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  created_at: string;
}

// Member Card State (per phrase per member)
export interface MemberPhraseCard {
  id: string; // card id
  member_id: string;
  phrase_id: string;
  
  status: PhraseStatus;
  priority: number; // optional, higher = sooner
  
  // Scheduler state
  scheduler: {
    algorithm: 'fsrs' | 'sm2';
    state: SchedulerState;
    due_at: string; // ISO timestamp
    last_reviewed_at?: string;
    
    // FSRS fields
    stability?: number; // days
    difficulty?: number; // 1..10
    
    // SM-2 fields
    repetitions?: number;
    interval_days?: number;
    ease_factor?: number; // >= 1.3
  };
  
  // UX/analytics
  lapses: number;
  reviews: number;
  note?: string;
  flag_reason?: string;
  created_at: string;
  updated_at: string;
}

// Review Log (analytics)
export interface PhraseReviewLog {
  id: string;
  member_id: string;
  phrase_id: string;
  card_id: string;
  
  started_at: string; // card shown
  revealed_at?: string;
  rated_at: string;
  
  rating: Rating;
  response_time_ms?: number; // reveal - start
  mode: PhraseMode;
  
  // Speech (optional, mock for v0)
  speech_used: boolean;
  transcript?: string;
  similarity?: number; // 0..1
  auto_assessed?: boolean;
  suggested_rating?: Rating;
}

// Member Settings
export interface PhraseSettings {
  member_id: string;
  new_per_day: number; // 0..50
  reviews_per_day: number; // 0..200
  target_retention: number; // 0.75..0.95, default 0.90
  
  speech_feedback_enabled: boolean;
  auto_assess_enabled: boolean;
  recognition_shadow_default: boolean;
  show_time_to_recall: boolean;
}

// Phrase Pack (curated sets)
export interface PhrasePack {
  id: string;
  name: string;
  description: string;
  tags: string[];
  phrase_ids: string[];
  created_at: string;
}

// Session State (UI state management)
export interface SessionState {
  queue: MemberPhraseCard[];
  currentIndex: number;
  isRevealed: boolean;
  startTime?: number; // timestamp when card shown
  revealTime?: number; // timestamp when revealed
  completed: number;
  total: number;
}

// Stats for display
export interface PhraseStats {
  total: number;
  due: number;
  new: number;
  learning: number;
  review: number;
  suspended: number;
  buried: number;
  known_recall: number;
  known_recognition: number;
}

// Library filters
export interface LibraryFilters {
  search: string;
  mode: PhraseMode | 'all';
  status: PhraseStatus | 'all';
  tags: string[];
  dueFilter: 'all' | 'overdue' | 'today' | 'future';
}

// Coach view member
export interface CoachMember {
  id: string;
  name: string;
  email: string;
  stats: PhraseStats;
  settings: PhraseSettings;
}

