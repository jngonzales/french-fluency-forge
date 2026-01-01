/**
 * Sales Copilot API Layer
 * Functions for fetching/creating/updating leads, calls, and playbook
 */

import { supabase } from '@/integrations/supabase/client';
import type { Lead, Call, Playbook, AssessmentData } from './types';

/**
 * Leads API
 */
export async function fetchLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('sales_leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchLead(id: string): Promise<Lead | null> {
  const { data, error } = await supabase
    .from('sales_leads')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
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
  return data;
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
  const { data, error } = await supabase
    .from('sales_leads')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
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
  return data || [];
}

export async function fetchCall(id: string): Promise<Call | null> {
  const { data, error } = await supabase
    .from('sales_calls')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createCall(call: Partial<Call>, userId: string): Promise<Call> {
  const { data, error } = await supabase
    .from('sales_calls')
    .insert({
      ...call,
      created_by: userId,
      tags: call.tags || [],
      answers: call.answers || [],
      qualification_score: call.qualification_score ?? 50,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCall(id: string, updates: Partial<Call>): Promise<Call> {
  const { data, error } = await supabase
    .from('sales_calls')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
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
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data || null;
}

