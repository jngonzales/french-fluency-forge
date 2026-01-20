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
import { formatLocalDate, getLocalToday, seededRandom } from '@/lib/dateUtils';

/**
 * Generate mock assessment history (from Nov 1st to today)
 * Uses seeded random for deterministic data (no changes on refresh)
 * Uses local timezone dates
 */
export function generateMockAssessmentHistory(): AssessmentSnapshot[] {
  const assessments: AssessmentSnapshot[] = [];
  const today = new Date();
  const startDate = new Date('2025-11-01');
  const diffTime = Math.abs(today.getTime() - startDate.getTime());
  const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  for (let i = 0; i <= totalDays; i += 4) { // Every 4 days
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = formatLocalDate(date); // Use local timezone
    
    // Use seeded random for deterministic scores
    const random = seededRandom(`assessment-${dateStr}`);
    
    // S-curve base: 1 / (1 + exp(-k * (t - t0)))
    const t = i / totalDays;
    const sCurve = 1 / (1 + Math.exp(-8 * (t - 0.5)));
    
    // Add non-linear variation (sine waves + seeded noise)
    const variation = Math.sin(i * 0.5) * 3 + (random() * 4 - 2);
    
    // Start baseline around 30-40, end around 75-85
    const baseScore = 35 + (sCurve * 45) + variation;
    
    assessments.push({
      sessionId: `dummy-${i}`,
      date: dateStr,
      overall: Math.round(Math.min(100, baseScore)),
      dimensions: {
        pronunciation: Math.round(Math.min(100, baseScore - 5 + random() * 10)),
        fluency: Math.round(Math.min(100, baseScore - 8 + random() * 12)),
        confidence: Math.round(Math.min(100, baseScore - 15 + (sCurve * 10) + random() * 10)),
        syntax: Math.round(Math.min(100, baseScore - 2 + random() * 6)),
        conversation: Math.round(Math.min(100, baseScore - 20 + (sCurve * 25) + random() * 8)),
        comprehension: Math.round(Math.min(100, baseScore + 2 + random() * 5)),
      },
    });
  }

  return assessments;
}

/**
 * Generate mock habits
 * NOTE: Updated for v0 demo - only includes demo-ready features
 */
export function generateMockHabits(): Habit[] {
  return [
    {
      id: 'habit-1',
      name: 'Daily phrases practice',
      frequency: 'daily',
      source: 'system',
      createdAt: '2026-01-01',
    },
    {
      id: 'habit-2',
      name: 'Speaking assessment prep',
      frequency: 'weekly',
      source: 'system',
      createdAt: '2026-01-01',
    },
    {
      id: 'habit-3',
      name: 'Review pronunciation feedback',
      frequency: 'weekly',
      source: 'personal',
      createdAt: '2026-01-01',
    },
  ];
}

/**
 * Generate mock habit grid (from Nov 1st to today)
 * Uses seeded random for deterministic data (no color changes on refresh)
 * Uses local timezone dates
 */
export function generateMockHabitGrid(habits: Habit[]): HabitCell[] {
  const cells: HabitCell[] = [];
  const todayStr = getLocalToday();
  const today = new Date();
  const startDate = new Date('2025-11-01');
  
  // Calculate days between Nov 1st and today
  const diffTime = Math.abs(today.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  for (let i = diffDays; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = formatLocalDate(date); // Use local timezone

    habits.forEach((habit) => {
      // Generate deterministic pattern using seeded random based on habit+date
      const seed = `${habit.id}-${dateStr}`;
      const random = seededRandom(seed);
      const isFuture = dateStr > todayStr;
      let status: HabitCell['status'];

      if (isFuture) {
        status = 'future';
      } else {
        const r = random();
        if (r > 0.4) {
          status = 'done';
        } else if (r > 0.2) {
          status = 'missed';
        } else {
          status = 'na';
        }
      }

      cells.push({
        habitId: habit.id,
        date: dateStr,
        status,
        intensity: status === 'done' ? Math.floor(random() * 6) + 1 : undefined,
      });
    });
  }

  return cells;
}

/**
 * Generate mock goals
 * NOTE: For v0 demo, returns empty array - users create their own goals
 */
export function generateMockGoals(): Goal[] {
  // Return empty array for v0 demo - users should create their own goals
  return [];
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
 * Uses seeded random for deterministic data
 */
export function generateMockAIMetrics(): AIMetrics {
  const dailyData = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = formatLocalDate(date);
    const random = seededRandom(`ai-metrics-${dateStr}`);
    dailyData.push({
      date: dateStr,
      words: Math.floor(random() * 500) + 100,
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
  const today = getLocalToday();
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

