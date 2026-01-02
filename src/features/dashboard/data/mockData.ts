/**
 * Mock Data for Dashboard MVP
 * Habits, goals, phrases, badges
 */

import type {
  Habit,
  HabitCell,
  Goal,
  PhraseStats,
  AIMetrics,
  Badge,
  PlanKey,
  PlanFeatures,
  AssessmentSnapshot,
} from '../types';

/**
 * Generate dummy assessment history for progression
 */
export function generateMockAssessmentHistory(): AssessmentSnapshot[] {
  const history: AssessmentSnapshot[] = [];
  const today = new Date();
  
  // Create 4 assessments over the last 90 days
  const intervals = [90, 60, 30, 0];
  const baselines = {
    pronunciation: 65,
    fluency: 58,
    confidence: 45,
    syntax: 52,
    conversation: 40,
    comprehension: 60,
  };

  intervals.forEach((daysAgo, index) => {
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    
    // Gradual improvement
    const multiplier = 1 + (index * 0.12); // ~12% improvement each time
    
    history.push({
      sessionId: `session-${index}`,
      date: date.toISOString().split('T')[0],
      overall: Math.round(53 * multiplier),
      dimensions: {
        pronunciation: Math.min(100, Math.round(baselines.pronunciation * multiplier)),
        fluency: Math.min(100, Math.round(baselines.fluency * multiplier)),
        confidence: Math.min(100, Math.round(baselines.confidence * multiplier)),
        syntax: Math.min(100, Math.round(baselines.syntax * multiplier)),
        conversation: Math.min(100, Math.round(baselines.conversation * multiplier)),
        comprehension: Math.min(100, Math.round(baselines.comprehension * multiplier)),
      },
    });
  });

  return history;
}

/**
 * Generate mock habits
 */
export function generateMockHabits(): Habit[] {
  return [
    {
      id: 'habit-1',
      name: 'Daily phrases session',
      frequency: 'daily',
      source: 'personal',
      createdAt: '2026-01-01',
    },
    {
      id: 'habit-2',
      name: 'AI Tutor conversation',
      frequency: 'daily',
      source: 'system',
      createdAt: '2026-01-01',
    },
    {
      id: 'habit-3',
      name: 'Review Fluency Analyzer feedback',
      frequency: 'weekly',
      source: 'system',
      createdAt: '2026-01-01',
    },
  ];
}

/**
 * Generate mock habit grid (last 30 days)
 */
export function generateMockHabitGrid(habits: Habit[]): HabitCell[] {
  const cells: HabitCell[] = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    habits.forEach((habit) => {
      // Generate realistic pattern
      const random = Math.random();
      let status: HabitCell['status'];

      if (i === 0) {
        status = 'future'; // Today
      } else if (random > 0.7) {
        status = 'done';
      } else if (random > 0.5) {
        status = 'missed';
      } else {
        status = 'na';
      }

      cells.push({
        habitId: habit.id,
        date: dateStr,
        status,
        intensity: status === 'done' ? Math.floor(Math.random() * 6) + 1 : undefined,
      });
    });
  }

  return cells;
}

/**
 * Generate mock goals
 */
export function generateMockGoals(): Goal[] {
  return [
    {
      id: 'goal-1',
      name: 'Fluent phone conversations',
      description: 'Be able to handle full phone conversations in French without hesitation',
      acceptanceCriteria: 'Successfully complete 3 phone calls with French native speakers',
      deadline: '2026-03-31',
      type: 'skill',
      dimension: 'conversation',
      targetScore: 85,
      locked: false,
      createdAt: '2026-01-01',
    },
    {
      id: 'goal-2',
      name: 'Pronunciation mastery',
      description: 'Perfect French pronunciation for professional settings',
      acceptanceCriteria: 'Score 90+ on pronunciation assessment',
      deadline: '2026-02-28',
      type: 'skill',
      dimension: 'pronunciation',
      targetScore: 90,
      locked: true,
      createdAt: '2026-01-01',
    },
  ];
}

/**
 * Generate mock phrase stats
 */
export function generateMockPhraseStats(): PhraseStats {
  return {
    recall: {
      learning: 45,
      known: 120,
      new: 15,
      total: 180,
      progress: 67,
    },
    recognition: {
      learning: 30,
      known: 250,
      new: 20,
      total: 300,
      progress: 83,
    },
    vocabulary: {
      activeSize: 850,
      passiveSize: 1500,
    },
  };
}

/**
 * Generate mock AI metrics
 */
export function generateMockAIMetrics(): AIMetrics {
  const dailyData = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dailyData.push({
      date: date.toISOString().split('T')[0],
      words: Math.floor(Math.random() * 500) + 100,
    });
  }

  const totalWords = dailyData.reduce((sum, d) => sum + d.words, 0);

  return {
    wordsSpoken: totalWords,
    minutesSpoken: Math.floor(totalWords / 120), // Assume 120 WPM
    sessionsCount: 15,
    dailyData,
  };
}

/**
 * Generate mock badges
 */
export function generateMockBadges(): Badge[] {
  return [
    {
      id: 'badge-first-assessment',
      name: 'First Assessment',
      description: 'Completed your first skill assessment',
      icon: 'CheckCircle',
      category: 'milestone',
      points: 100,
      unlocked: true,
      unlockedAt: '2026-01-01',
      criteria: { type: 'custom' },
    },
    {
      id: 'badge-habit-created',
      name: 'Habit Builder',
      description: 'Created your first habit',
      icon: 'Target',
      category: 'milestone',
      points: 50,
      unlocked: true,
      unlockedAt: '2026-01-01',
      criteria: { type: 'custom' },
    },
    {
      id: 'badge-streak-3',
      name: '3-Day Streak',
      description: 'Completed habits for 3 days in a row',
      icon: 'Flame',
      category: 'streak',
      points: 50,
      unlocked: false,
      criteria: { type: 'streak', target: 3 },
    },
    {
      id: 'badge-streak-7',
      name: '7-Day Streak',
      description: 'Completed habits for 7 days in a row',
      icon: 'Flame',
      category: 'streak',
      points: 150,
      unlocked: false,
      criteria: { type: 'streak', target: 7 },
    },
    {
      id: 'badge-streak-15',
      name: '15-Day Streak',
      description: 'Completed habits for 15 days in a row',
      icon: 'Zap',
      category: 'streak',
      points: 300,
      unlocked: false,
      criteria: { type: 'streak', target: 15 },
    },
    {
      id: 'badge-streak-40',
      name: '40-Day Streak',
      description: 'Completed habits for 40 days in a row',
      icon: 'Trophy',
      category: 'streak',
      points: 500,
      unlocked: false,
      criteria: { type: 'streak', target: 40 },
    },
    {
      id: 'badge-streak-90',
      name: '90-Day Streak',
      description: 'Completed the full 90-day challenge',
      icon: 'Crown',
      category: 'streak',
      points: 1000,
      unlocked: false,
      criteria: { type: 'streak', target: 90 },
    },
    {
      id: 'badge-phrases-100',
      name: 'Phrase Master',
      description: 'Learned 100 phrases',
      icon: 'BookOpen',
      category: 'milestone',
      points: 200,
      unlocked: false,
      criteria: { type: 'count', target: 100, metric: 'phrases' },
    },
    {
      id: 'badge-ai-10',
      name: 'AI Conversationalist',
      description: 'Completed 10 AI conversations',
      icon: 'MessageCircle',
      category: 'milestone',
      points: 200,
      unlocked: false,
      criteria: { type: 'count', target: 10, metric: 'ai_sessions' },
    },
    {
      id: 'badge-rapid-progress',
      name: 'Rapid Progress',
      description: '20% improvement in 7 days',
      icon: 'TrendingUp',
      category: 'achievement',
      points: 250,
      unlocked: false,
      criteria: { type: 'progress', target: 20 },
    },
  ];
}

/**
 * Get plan features based on plan key
 */
export function getPlanFeatures(planKey: PlanKey): PlanFeatures {
  switch (planKey) {
    case '3090':
      return {
        phrases: true,
        fluencyAnalyzer: true,
        aiTutor: true,
        groupCoaching: true,
        groupConversations: true,
        oneOnOneCoaching: true,
      };
    case 'continuity':
      return {
        phrases: true,
        fluencyAnalyzer: true,
        aiTutor: true,
        groupCoaching: false,
        groupConversations: false,
        oneOnOneCoaching: true,
      };
    case 'software':
      return {
        phrases: true,
        fluencyAnalyzer: true,
        aiTutor: true,
        groupCoaching: false,
        groupConversations: false,
        oneOnOneCoaching: false,
      };
    default:
      return {
        phrases: false,
        fluencyAnalyzer: false,
        aiTutor: false,
        groupCoaching: false,
        groupConversations: false,
        oneOnOneCoaching: false,
      };
  }
}

/**
 * Calculate points from badges
 */
export function calculateTotalPoints(badges: Badge[]): number {
  return badges
    .filter((b) => b.unlocked)
    .reduce((sum, b) => sum + b.points, 0);
}

/**
 * Calculate current streak from habit grid
 */
export function calculateCurrentStreak(habitGrid: HabitCell[]): number {
  const today = new Date().toISOString().split('T')[0];
  const sortedCells = [...habitGrid]
    .filter((cell) => cell.date < today)
    .sort((a, b) => b.date.localeCompare(a.date));

  let streak = 0;
  const datesSeen = new Set<string>();

  for (const cell of sortedCells) {
    if (datesSeen.has(cell.date)) continue;
    
    if (cell.status === 'done') {
      streak++;
      datesSeen.add(cell.date);
    } else if (cell.status === 'missed') {
      break;
    }
    // 'na' doesn't break the streak
  }

  return streak;
}

