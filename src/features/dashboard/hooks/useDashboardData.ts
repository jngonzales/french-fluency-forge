/**
 * Dashboard Data Hook
 * Combines real assessment data with mock data
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchUserAssessments,
  getBaselineAndCurrent,
  calculateTotalPoints,
} from '../data/assessmentData';
import {
  generateMockHabits,
  generateMockHabitGrid,
  generateMockGoals,
  generateMockPhraseStats,
  generateMockAIMetrics,
  generateMockBadges,
  getPlanFeatures,
} from '../data/mockData';
import { generateTimelineSeries } from '../data/projections';
import type {
  DashboardData,
  DashboardLoadingState,
  MetricKey,
  TimeRange,
  Habit,
  HabitCell,
  Goal,
  Badge,
} from '../types';

export function useDashboardData(viewingUserId?: string) {
  const { user } = useAuth();
  const targetUserId = viewingUserId || user?.id;

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<DashboardLoadingState>({
    assessments: true,
    habits: true,
    goals: true,
    phrases: true,
    aiMetrics: true,
    badges: true,
  });
  const [error, setError] = useState<string | null>(null);

  // Local state for mock data (will persist to DB later)
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitGrid, setHabitGrid] = useState<HabitCell[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    if (!targetUserId) return;
    loadDashboardData();
  }, [targetUserId]);

  const loadDashboardData = async () => {
    if (!targetUserId || !user) return;

    try {
      setLoading({ ...loading, assessments: true });

      // Fetch real assessment data
      const assessments = await fetchUserAssessments(targetUserId);
      const { baseline, current } = getBaselineAndCurrent(assessments);

      // Initialize mock data
      const mockHabits = generateMockHabits();
      const mockHabitGrid = generateMockHabitGrid(mockHabits);
      const mockGoals = generateMockGoals();
      const mockPhrases = generateMockPhraseStats();
      const mockAIMetrics = generateMockAIMetrics();
      const mockBadges = generateMockBadges();

      // Check if user has completed first assessment
      if (current) {
        mockBadges.find((b) => b.id === 'badge-first-assessment')!.unlocked = true;
      }

      setHabits(mockHabits);
      setHabitGrid(mockHabitGrid);
      setGoals(mockGoals);
      setBadges(mockBadges);

      // Generate timeline series for overall metric
      const timelineSeries = generateTimelineSeries(assessments, 'overall', 90);

      // Build complete dashboard data
      const dashboardData: DashboardData = {
        member: {
          id: targetUserId,
          name: user.email?.split('@')[0] || 'Member',
          email: user.email || '',
          plan: '3090', // Mock for now, can read from app_accounts later
          features: getPlanFeatures('3090'),
        },
        assessments: {
          baseline,
          current,
          history: assessments,
        },
        timeline: [
          {
            metric: 'overall',
            ...timelineSeries,
          },
        ],
        habits: mockHabits,
        habitGrid: mockHabitGrid,
        goals: mockGoals,
        phrases: mockPhrases,
        aiMetrics: mockAIMetrics,
        badges: mockBadges,
        points: calculateTotalPoints(mockBadges),
      };

      setData(dashboardData);
      setLoading({
        assessments: false,
        habits: false,
        goals: false,
        phrases: false,
        aiMetrics: false,
        badges: false,
      });
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
      setLoading({
        assessments: false,
        habits: false,
        goals: false,
        phrases: false,
        aiMetrics: false,
        badges: false,
      });
    }
  };

  // Methods to update local state
  const updateHabitCell = (habitId: string, date: string, status: HabitCell['status'], intensity?: number) => {
    setHabitGrid((prev) =>
      prev.map((cell) =>
        cell.habitId === habitId && cell.date === date
          ? { ...cell, status, intensity }
          : cell
      )
    );
  };

  const addHabit = (habit: Habit) => {
    setHabits((prev) => [...prev, habit]);
    
    // Generate grid cells for this habit
    const today = new Date();
    const newCells: HabitCell[] = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      newCells.push({
        habitId: habit.id,
        date: dateStr,
        status: i === 0 ? 'future' : 'na',
      });
    }
    
    setHabitGrid((prev) => [...prev, ...newCells]);
  };

  const addGoal = (goal: Goal) => {
    setGoals((prev) => [...prev, goal]);
  };

  const updateGoal = (goalId: string, updates: Partial<Goal>) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, ...updates } : g))
    );
  };

  const unlockBadge = (badgeId: string) => {
    setBadges((prev) =>
      prev.map((b) =>
        b.id === badgeId
          ? { ...b, unlocked: true, unlockedAt: new Date().toISOString() }
          : b
      )
    );
  };

  return {
    data,
    loading,
    error,
    habits,
    habitGrid,
    goals,
    badges,
    actions: {
      updateHabitCell,
      addHabit,
      addGoal,
      updateGoal,
      unlockBadge,
      refresh: loadDashboardData,
    },
  };
}

