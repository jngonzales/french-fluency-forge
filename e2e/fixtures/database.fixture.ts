import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Database helper functions for test setup and teardown
 */

export async function createTestSession(
  supabase: SupabaseClient,
  userId: string,
  status: string = 'intake'
) {
  const { data, error } = await supabase
    .from('assessment_sessions')
    .insert({
      user_id: userId,
      status,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSessionStatus(
  supabase: SupabaseClient,
  sessionId: string,
  status: string
) {
  const { error } = await supabase
    .from('assessment_sessions')
    .update({ status })
    .eq('id', sessionId);

  if (error) throw error;
}

export async function updateSessionIntakeData(
  supabase: SupabaseClient,
  sessionId: string,
  data: {
    gender?: string;
    age_band?: string;
    languages_spoken?: string[];
    primary_track?: string;
    goals?: string;
  }
) {
  const { error } = await supabase
    .from('assessment_sessions')
    .update(data)
    .eq('id', sessionId);

  if (error) throw error;
}

export async function getSessionByUserId(
  supabase: SupabaseClient,
  userId: string
) {
  const { data, error } = await supabase
    .from('assessment_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function cleanupTestSessions(
  supabase: SupabaseClient,
  userId: string
) {
  // Delete all recordings first (foreign key constraints)
  await supabase
    .from('fluency_recordings')
    .delete()
    .in('session_id', 
      supabase
        .from('assessment_sessions')
        .select('id')
        .eq('user_id', userId)
    );

  await supabase
    .from('skill_recordings')
    .delete()
    .in('session_id',
      supabase
        .from('assessment_sessions')
        .select('id')
        .eq('user_id', userId)
    );

  await supabase
    .from('comprehension_recordings')
    .delete()
    .in('session_id',
      supabase
        .from('assessment_sessions')
        .select('id')
        .eq('user_id', userId)
    );

  // Delete consent records
  await supabase
    .from('consent_records')
    .delete()
    .eq('user_id', userId);

  // Delete sessions
  await supabase
    .from('assessment_sessions')
    .delete()
    .eq('user_id', userId);
}

export async function getUserByEmail(
  supabase: SupabaseClient,
  email: string
) {
  const { data, error } = await supabase
    .from('auth.users')
    .select('*')
    .eq('email', email)
    .single();

  return data;
}

/**
 * Create mock fluency recording for testing
 */
export async function createMockFluencyRecording(
  supabase: SupabaseClient,
  sessionId: string,
  pictureId: string,
  wpm: number = 100
) {
  const { data, error } = await supabase
    .from('fluency_recordings')
    .insert({
      session_id: sessionId,
      picture_id: pictureId,
      wpm,
      score: 75,
      speed_subscore: 80,
      pause_subscore: 70,
      transcript: 'Mock transcript',
      used_for_scoring: true,
      attempt_number: 1,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create mock skill recording for testing
 */
export async function createMockSkillRecording(
  supabase: SupabaseClient,
  sessionId: string,
  moduleType: 'confidence' | 'syntax' | 'conversation',
  promptId: string,
  aiScore: number = 75
) {
  const { data, error } = await supabase
    .from('skill_recordings')
    .insert({
      session_id: sessionId,
      module_type: moduleType,
      prompt_id: promptId,
      ai_score: aiScore,
      transcript: 'Mock transcript',
      ai_feedback: { overall: 'Good' },
      used_for_scoring: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

