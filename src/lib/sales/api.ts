/**
 * Sales Copilot API Layer
 * Functions for fetching/creating/updating leads, calls, and playbook
 */

import { supabase } from '@/integrations/supabase/client';
import type { Lead, Call, Playbook, PlaybookData, AssessmentData, Answer } from './types';
import type { Json } from '@/integrations/supabase/types';

// Helper to transform DB lead to typed Lead
function transformLead(dbLead: Record<string, unknown>): Lead {
  return {
    ...dbLead,
    decision_maker: dbLead.decision_maker as Lead['decision_maker'],
  } as Lead;
}

// Helper to transform DB call to typed Call
function transformCall(dbCall: Record<string, unknown>): Call {
  return {
    ...dbCall,
    tags: (dbCall.tags as string[]) || [],
    answers: (dbCall.answers as Answer[]) || [],
  } as Call;
}

// Helper to transform DB playbook to typed Playbook
function transformPlaybook(dbPlaybook: Record<string, unknown>): Playbook {
  return {
    ...dbPlaybook,
    playbook_data: dbPlaybook.playbook_data as PlaybookData,
  } as Playbook;
}

/**
 * Leads API
 */
export async function fetchLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('sales_leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(transformLead);
}

export async function fetchLead(id: string): Promise<Lead | null> {
  const { data, error } = await supabase
    .from('sales_leads')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data ? transformLead(data) : null;
}

export async function createLead(lead: Partial<Lead>, userId: string): Promise<Lead> {
  const { data, error } = await supabase
    .from('sales_leads')
    .insert({
      ...lead,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return transformLead(data);
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
  const { data, error } = await supabase
    .from('sales_leads')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return transformLead(data);
}

/**
 * Calls API
 */
export async function fetchCallsForLead(leadId: string): Promise<Call[]> {
  const { data, error } = await supabase
    .from('sales_calls')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(transformCall);
}

export async function fetchCall(id: string): Promise<Call | null> {
  const { data, error } = await supabase
    .from('sales_calls')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data ? transformCall(data) : null;
}

export async function createCall(call: Partial<Call>, userId: string): Promise<Call> {
  const { data, error } = await supabase
    .from('sales_calls')
    .insert({
      lead_id: call.lead_id!,
      stage: call.stage,
      transcript_notes: call.transcript_notes,
      outcome: call.outcome,
      follow_up_email: call.follow_up_email,
      summary: call.summary,
      qualification_score: call.qualification_score ?? 50,
      qualification_reason: call.qualification_reason,
      created_by: userId,
      tags: (call.tags || []) as unknown as Json,
      answers: (call.answers || []) as unknown as Json,
    })
    .select()
    .single();

  if (error) throw error;
  return transformCall(data);
}

export async function updateCall(id: string, updates: Partial<Call>): Promise<Call> {
  // Prepare the update object with proper typing
  const dbUpdates: Record<string, unknown> = { ...updates };
  if (updates.tags) dbUpdates.tags = updates.tags as unknown as Json;
  if (updates.answers) dbUpdates.answers = updates.answers as unknown as Json;
  
  const { data, error } = await supabase
    .from('sales_calls')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return transformCall(data);
}

/**
 * Assessment Data API
 * Fetch assessment data for a linked user
 */
export async function fetchAssessmentData(userId: string): Promise<AssessmentData | null> {
  try {
    // Fetch latest assessment session
    const { data: session } = await supabase
      .from('assessment_sessions')
      .select('id, status, goals, completed_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Fetch scores from skill_recordings
    const { data: recordings } = await supabase
      .from('skill_recordings')
      .select('module_type, ai_score')
      .eq('user_id', userId)
      .eq('used_for_scoring', true)
      .order('created_at', { ascending: false });

    // Fetch archetype
    const { data: archetypeData } = await supabase
      .from('archetype_feedback')
      .select('feedback_text')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Build scores object
    const scores: AssessmentData['scores'] = {};
    recordings?.forEach((r) => {
      const moduleType = r.module_type as keyof typeof scores;
      if (moduleType && r.ai_score) {
        scores[moduleType] = r.ai_score;
      }
    });

    return {
      latestSession: session || undefined,
      scores: Object.keys(scores).length > 0 ? scores : undefined,
      archetype: archetypeData?.feedback_text || undefined,
      intakeData: session
        ? {
            goals: session.goals || undefined,
            primary_track: undefined, // Would need to join or fetch separately
            age_band: undefined,
            gender: undefined,
          }
        : undefined,
    };
  } catch (error) {
    console.error('Error fetching assessment data:', error);
    return null;
  }
}

/**
 * Playbook API
 */
export async function fetchActivePlaybook(): Promise<Playbook | null> {
  const { data, error } = await supabase
    .from('sales_playbook')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) throw error;
  return data && data.length > 0 ? transformPlaybook(data[0]) : null;
}

