/**
 * Assessment Data Integration
 * Fetches real assessment scores from Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import type { AssessmentSnapshot, DimensionKey } from '../types';

/**
 * Fetch all assessment sessions for a user
 */
export async function fetchUserAssessments(userId: string): Promise<AssessmentSnapshot[]> {
  try {
    // Get all completed assessment sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('assessment_sessions')
      .select('id, completed_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: true });

    if (sessionsError) throw sessionsError;
    if (!sessions || sessions.length === 0) return [];

    // Fetch scores for each session
    const assessments: AssessmentSnapshot[] = [];

    for (const session of sessions) {
      const scores = await calculateSessionScores(session.id);
      if (scores) {
        assessments.push({
          sessionId: session.id,
          date: session.completed_at!.split('T')[0], // YYYY-MM-DD
          overall: scores.overall,
          dimensions: scores.dimensions,
        });
      }
    }

    return assessments;
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return [];
  }
}

/**
 * Calculate scores for a specific session
 */
async function calculateSessionScores(sessionId: string): Promise<{
  overall: number;
  dimensions: Record<DimensionKey, number>;
} | null> {
  try {
    // Fetch all recordings for this session
    const { data: recordings, error } = await supabase
      .from('skill_recordings')
      .select('module_type, ai_score')
      .eq('session_id', sessionId)
      .eq('used_for_scoring', true);

    if (error) throw error;
    if (!recordings || recordings.length === 0) return null;

    // Aggregate scores by dimension
    const dimensionScores: Partial<Record<DimensionKey, number[]>> = {};

    recordings.forEach((rec) => {
      const dimension = rec.module_type as DimensionKey;
      if (!dimensionScores[dimension]) {
        dimensionScores[dimension] = [];
      }
      if (rec.ai_score !== null) {
        dimensionScores[dimension]!.push(rec.ai_score);
      }
    });

    // Also check fluency_recordings
    const { data: fluencyRecs } = await supabase
      .from('fluency_recordings')
      .select('wpm')
      .eq('session_id', sessionId)
      .eq('used_for_scoring', true);

    if (fluencyRecs && fluencyRecs.length > 0) {
      // Convert WPM to 0-100 scale (120 WPM = 100)
      const wpmScores = fluencyRecs
        .filter((r) => r.wpm !== null)
        .map((r) => Math.min(100, (r.wpm! / 120) * 100));
      if (wpmScores.length > 0) {
        dimensionScores.fluency = wpmScores;
      }
    }

    // Calculate average for each dimension
    const dimensions: Record<DimensionKey, number> = {
      pronunciation: calculateAverage(dimensionScores.pronunciation) ?? 0,
      fluency: calculateAverage(dimensionScores.fluency) ?? 0,
      confidence: calculateAverage(dimensionScores.confidence) ?? 0,
      syntax: calculateAverage(dimensionScores.syntax) ?? 0,
      conversation: calculateAverage(dimensionScores.conversation) ?? 0,
      comprehension: calculateAverage(dimensionScores.comprehension) ?? 0,
    };

    // Calculate overall (average of all dimensions that have data)
    const dimensionValues = Object.values(dimensions).filter((v) => v > 0);
    const overall = dimensionValues.length > 0
      ? dimensionValues.reduce((sum, val) => sum + val, 0) / dimensionValues.length
      : 0;

    return {
      overall: Math.round(overall),
      dimensions: {
        pronunciation: Math.round(dimensions.pronunciation),
        fluency: Math.round(dimensions.fluency),
        confidence: Math.round(dimensions.confidence),
        syntax: Math.round(dimensions.syntax),
        conversation: Math.round(dimensions.conversation),
        comprehension: Math.round(dimensions.comprehension),
      },
    };
  } catch (error) {
    console.error('Error calculating session scores:', error);
    return null;
  }
}

/**
 * Calculate average of number array
 */
function calculateAverage(values: number[] | undefined): number | null {
  if (!values || values.length === 0) return null;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Get baseline (first) and current (latest) assessments
 */
export function getBaselineAndCurrent(assessments: AssessmentSnapshot[]): {
  baseline?: AssessmentSnapshot;
  current?: AssessmentSnapshot;
} {
  if (assessments.length === 0) {
    return {};
  }

  return {
    baseline: assessments[0],
    current: assessments[assessments.length - 1],
  };
}

