/**
 * Retry Logic for Unified Exam
 * 14-day cooldown for official assessments
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface RetryStatus {
  canTakeOfficial: boolean;
  nextAvailableDate: Date | null;
  lastOfficialExam: Date | null;
  daysUntilNext: number;
  totalOfficialExams: number;
  loading: boolean;
}

/**
 * Hook to check if user can take official exam
 */
export function useRetryLogic(user: User | null): RetryStatus {
  const [status, setStatus] = useState<RetryStatus>({
    canTakeOfficial: false,
    nextAvailableDate: null,
    lastOfficialExam: null,
    daysUntilNext: 0,
    totalOfficialExams: 0,
    loading: true,
  });
  
  useEffect(() => {
    if (!user) {
      setStatus(prev => ({ ...prev, loading: false }));
      return;
    }
    
    checkRetryStatus();
  }, [user]);
  
  const checkRetryStatus = async () => {
    if (!user) return;
    
    try {
      // Call database function to check if can take official exam
      const { data: canTakeData, error: canTakeError } = await supabase
        .rpc('can_take_official_exam', { p_user_id: user.id });
      
      if (canTakeError) throw canTakeError;
      
      // Get next available date
      const { data: nextDateData, error: nextDateError } = await supabase
        .rpc('get_next_exam_date', { p_user_id: user.id });
      
      if (nextDateError) throw nextDateError;
      
      // Get last official exam
      const { data: examData, error: examError } = await supabase
        .from('unified_exam_sessions')
        .select('completed_at, is_official')
        .eq('user_id', user.id)
        .eq('is_official', true)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();
      
      const lastOfficialExam = examData?.completed_at 
        ? new Date(examData.completed_at) 
        : null;
      
      // Count total official exams
      const { count } = await supabase
        .from('unified_exam_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_official', true)
        .not('completed_at', 'is', null);
      
      const nextAvailableDate = nextDateData ? new Date(nextDateData) : null;
      const canTakeOfficial = canTakeData === true;
      
      // Calculate days until next
      let daysUntilNext = 0;
      if (nextAvailableDate && !canTakeOfficial) {
        const now = new Date();
        const diff = nextAvailableDate.getTime() - now.getTime();
        daysUntilNext = Math.ceil(diff / (1000 * 60 * 60 * 24));
      }
      
      setStatus({
        canTakeOfficial,
        nextAvailableDate,
        lastOfficialExam,
        daysUntilNext,
        totalOfficialExams: count || 0,
        loading: false,
      });
      
    } catch (error) {
      console.error('Error checking retry status:', error);
      setStatus(prev => ({ ...prev, loading: false }));
    }
  };
  
  return status;
}

/**
 * Create new unified exam session
 */
export async function createUnifiedExamSession(
  userId: string,
  sessionId: string,
  isOfficial: boolean = true
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('unified_exam_sessions')
      .insert({
        user_id: userId,
        session_id: sessionId,
        is_official: isOfficial,
        scenario_1_id: 'pending',
        scenario_2_id: 'pending',
        scenario_3_id: 'pending',
        persona_1_id: 'pending',
        persona_2_id: 'pending',
        persona_3_id: 'pending',
        tier_1: 1,
        tier_2: 1,
        tier_3: 1,
        conversation_transcript: [],
      })
      .select('id')
      .single();
    
    if (error) throw error;
    
    return data.id;
  } catch (error) {
    console.error('Error creating unified exam session:', error);
    return null;
  }
}

/**
 * Update unified exam session with results
 */
export async function updateUnifiedExamSession(
  examId: string,
  updates: {
    scenario_1_id?: string;
    scenario_2_id?: string;
    scenario_3_id?: string;
    persona_1_id?: string;
    persona_2_id?: string;
    persona_3_id?: string;
    tier_1?: number;
    tier_2?: number;
    tier_3?: number;
    conversation_transcript?: any[];
    fluency_score?: number;
    syntax_score?: number;
    conversation_score?: number;
    confidence_score?: number;
    overall_score?: number;
    proficiency_level?: string;
    duration_seconds?: number;
    completed_at?: string;
    trace_id?: string;
  }
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('unified_exam_sessions')
      .update(updates)
      .eq('id', examId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error updating unified exam session:', error);
    return false;
  }
}

/**
 * Get user's exam history
 */
export async function getUserExamHistory(userId: string): Promise<{
  id: string;
  overall_score: number;
  proficiency_level: string;
  completed_at: string;
  is_official: boolean;
}[]> {
  try {
    const { data, error } = await supabase
      .from('unified_exam_sessions')
      .select('id, overall_score, proficiency_level, completed_at, is_official')
      .eq('user_id', userId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching exam history:', error);
    return [];
  }
}

/**
 * Format retry message for UI
 */
export function formatRetryMessage(status: RetryStatus): string {
  if (status.canTakeOfficial) {
    return 'You can take an official assessment now';
  }
  
  if (status.daysUntilNext > 0) {
    if (status.daysUntilNext === 1) {
      return 'Next official assessment available tomorrow';
    }
    return `Next official assessment available in ${status.daysUntilNext} days`;
  }
  
  if (status.nextAvailableDate) {
    return `Next official assessment: ${status.nextAvailableDate.toLocaleDateString()}`;
  }
  
  return 'Checking availability...';
}

