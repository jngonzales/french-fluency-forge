/**
 * Assessment Session Management Hook
 * Handles session creation, resume, prompt selection, and state management
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { generateSeed, seededSelect } from '@/lib/random/seededShuffle';
import { getPrompts, getPromptVersion, getPromptsByIds } from '../promptBank/loadPromptBank';
import type { ModuleType, Prompt, PromptSelection } from '../promptBank/types';

const SCORER_VERSION = '2026-01-04';
const ASR_VERSION = 'whisper-1';

// Module configuration: how many items per module
const MODULE_ITEM_COUNTS: Record<ModuleType, number> = {
  fluency: 3,
  pronunciation: 5,
  confidence: 2,
  syntax: 5,
  conversation: 2,
  comprehension: 6,
};

interface SpeakingAssessmentSession {
  id: string;
  user_id: string;
  mode: 'full' | 'single_module';
  single_module_type: ModuleType | null;
  status: 'created' | 'in_progress' | 'completed' | 'abandoned';
  seed: number;
  prompt_version: string;
  scorer_version: string;
  asr_version: string;
  current_module: ModuleType | null;
  current_item_index: number;
  selected_prompt_ids: PromptSelection;
  meta: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface AssessmentItem {
  id: string;
  session_id: string;
  module_type: ModuleType;
  item_index: number;
  prompt_id: string;
  prompt_payload: Prompt;
  status: 'not_started' | 'recording' | 'processing' | 'completed' | 'error';
  attempt_number: number;
  result_ref: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CurrentSessionInfo {
  session: SpeakingAssessmentSession | null;
  items: AssessmentItem[];
  currentItem: AssessmentItem | null;
  isLoading: boolean;
  error: string | null;
}

export function useAssessmentSession() {
  const { user } = useAuth();
  const [sessionInfo, setSessionInfo] = useState<CurrentSessionInfo>({
    session: null,
    items: [],
    currentItem: null,
    isLoading: true,
    error: null,
  });

  /**
   * Check for existing unfinished sessions
   */
  const checkForUnfinishedSession = useCallback(async () => {
    if (!user) {
      setSessionInfo(prev => ({ ...prev, isLoading: false }));
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('speaking_assessment_sessions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['created', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      return data as SpeakingAssessmentSession | null;
    } catch (error) {
      console.error('[Session] Error checking for unfinished session:', error);
      return null;
    }
  }, [user]);

  /**
   * Create new session
   */
  const createSession = useCallback(async (
    mode: 'full' | 'single_module',
    singleModuleType?: ModuleType
  ): Promise<SpeakingAssessmentSession | null> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const seed = generateSeed();
      const promptVersion = getPromptVersion('fluency'); // All modules use same version

      // Determine which modules to include
      const modules: ModuleType[] = mode === 'full'
        ? ['pronunciation', 'fluency', 'confidence', 'syntax', 'conversation', 'comprehension']
        : singleModuleType
        ? [singleModuleType]
        : [];

      // Select prompts for each module
      const selectedPromptIds: PromptSelection = {};
      for (const module of modules) {
        const allPrompts = getPrompts(module);
        const count = MODULE_ITEM_COUNTS[module];
        const selected = seededSelect(allPrompts, count, seed);
        selectedPromptIds[module] = selected.map(p => p.id);
      }

      // Create session
      const { data: session, error: sessionError } = await supabase
        .from('speaking_assessment_sessions')
        .insert({
          user_id: user.id,
          mode,
          single_module_type: singleModuleType || null,
          status: 'created',
          seed,
          prompt_version: promptVersion,
          scorer_version: SCORER_VERSION,
          asr_version: ASR_VERSION,
          current_module: modules[0] || null,
          current_item_index: 0,
          selected_prompt_ids: selectedPromptIds,
          meta: {},
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Create items for each module
      const items: any[] = [];
      for (const module of modules) {
        const promptIds = selectedPromptIds[module];
        const prompts = getPromptsByIds(module, promptIds);

        for (let i = 0; i < prompts.length; i++) {
          items.push({
            session_id: session.id,
            module_type: module,
            item_index: i,
            prompt_id: prompts[i].id,
            prompt_payload: prompts[i],
            status: 'not_started',
            attempt_number: 1,
            result_ref: {},
          });
        }
      }

      const { error: itemsError } = await supabase
        .from('speaking_assessment_items')
        .insert(items);

      if (itemsError) throw itemsError;

      console.log('[Session] Created new session:', session.id);
      return session as SpeakingAssessmentSession;
    } catch (error) {
      console.error('[Session] Error creating session:', error);
      throw error;
    }
  }, [user]);

  /**
   * Resume existing session
   */
  const resumeSession = useCallback(async (
    sessionId: string
  ): Promise<CurrentSessionInfo | null> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      // Fetch session
      const { data: session, error: sessionError } = await supabase
        .from('speaking_assessment_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single();

      if (sessionError) throw sessionError;

      // Fetch items
      const { data: items, error: itemsError } = await supabase
        .from('speaking_assessment_items')
        .select('*')
        .eq('session_id', sessionId)
        .order('module_type')
        .order('item_index');

      if (itemsError) throw itemsError;

      // Find first incomplete item
      const currentItem = items.find(item => item.status !== 'completed') || null;

      // Update session status to in_progress if it was created
      if (session.status === 'created') {
        await supabase
          .from('speaking_assessment_sessions')
          .update({ status: 'in_progress' })
          .eq('id', sessionId);
      }

      const info: CurrentSessionInfo = {
        session: session as SpeakingAssessmentSession,
        items: items as AssessmentItem[],
        currentItem: currentItem as AssessmentItem | null,
        isLoading: false,
        error: null,
      };

      setSessionInfo(info);
      return info;
    } catch (error) {
      console.error('[Session] Error resuming session:', error);
      setSessionInfo(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to resume session',
      }));
      return null;
    }
  }, [user]);

  /**
   * Update item status
   */
  const updateItemStatus = useCallback(async (
    itemId: string,
    status: AssessmentItem['status'],
    resultRef?: Record<string, any>
  ) => {
    try {
      const updates: any = { status };
      if (resultRef) {
        updates.result_ref = resultRef;
      }

      const { error } = await supabase
        .from('speaking_assessment_items')
        .update(updates)
        .eq('id', itemId);

      if (error) throw error;

      // Update local state
      setSessionInfo(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item.id === itemId ? { ...item, ...updates } : item
        ),
      }));
    } catch (error) {
      console.error('[Session] Error updating item status:', error);
      throw error;
    }
  }, []);

  /**
   * Move to next item
   */
  const nextItem = useCallback(async () => {
    if (!sessionInfo.session || !sessionInfo.currentItem) return null;

    // Find next incomplete item
    const currentIdx = sessionInfo.items.findIndex(
      item => item.id === sessionInfo.currentItem?.id
    );

    const nextIncomplete = sessionInfo.items
      .slice(currentIdx + 1)
      .find(item => item.status !== 'completed');

    if (nextIncomplete) {
      // Update session's current position
      await supabase
        .from('speaking_assessment_sessions')
        .update({
          current_module: nextIncomplete.module_type,
          current_item_index: nextIncomplete.item_index,
        })
        .eq('id', sessionInfo.session.id);

      setSessionInfo(prev => ({
        ...prev,
        currentItem: nextIncomplete,
      }));

      return nextIncomplete;
    } else {
      // All items complete - mark session as completed
      await supabase
        .from('speaking_assessment_sessions')
        .update({ status: 'completed' })
        .eq('id', sessionInfo.session.id);

      setSessionInfo(prev => ({
        ...prev,
        session: prev.session ? { ...prev.session, status: 'completed' } : null,
        currentItem: null,
      }));

      return null;
    }
  }, [sessionInfo]);

  /**
   * Restart module (marks items as not_started, increments attempt)
   */
  const restartModule = useCallback(async (moduleType: ModuleType) => {
    if (!sessionInfo.session) {
      throw new Error('No active session');
    }

    try {
      // Get all items for this module
      const moduleItems = sessionInfo.items.filter(
        item => item.module_type === moduleType
      );

      // Update each item
      for (const item of moduleItems) {
        await supabase
          .from('speaking_assessment_items')
          .update({
            status: 'not_started',
            attempt_number: item.attempt_number + 1,
          })
          .eq('id', item.id);
      }

      // Refresh session info
      await resumeSession(sessionInfo.session.id);
    } catch (error) {
      console.error('[Session] Error restarting module:', error);
      throw error;
    }
  }, [sessionInfo, resumeSession]);

  /**
   * Restart entire session (marks old as abandoned, creates new)
   */
  const restartSession = useCallback(async (
    mode?: 'full' | 'single_module',
    singleModuleType?: ModuleType
  ) => {
    if (!sessionInfo.session) {
      throw new Error('No active session');
    }

    try {
      // Mark current session as abandoned
      await supabase
        .from('speaking_assessment_sessions')
        .update({ status: 'abandoned' })
        .eq('id', sessionInfo.session.id);

      // Create new session with same mode/type as before if not specified
      const newSession = await createSession(
        mode || sessionInfo.session.mode,
        singleModuleType || sessionInfo.session.single_module_type || undefined
      );

      if (newSession) {
        await resumeSession(newSession.id);
      }

      return newSession;
    } catch (error) {
      console.error('[Session] Error restarting session:', error);
      throw error;
    }
  }, [sessionInfo, createSession, resumeSession]);

  /**
   * Get current item
   */
  const getCurrentItem = useCallback(() => {
    return sessionInfo.currentItem;
  }, [sessionInfo]);

  /**
   * Get items for a specific module
   */
  const getModuleItems = useCallback((moduleType: ModuleType) => {
    return sessionInfo.items.filter(item => item.module_type === moduleType);
  }, [sessionInfo]);

  /**
   * Initialize on mount
   */
  useEffect(() => {
    const init = async () => {
      if (!user) {
        setSessionInfo(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const unfinished = await checkForUnfinishedSession();
      if (unfinished) {
        await resumeSession(unfinished.id);
      } else {
        setSessionInfo(prev => ({ ...prev, isLoading: false }));
      }
    };

    init();
  }, [user, checkForUnfinishedSession, resumeSession]);

  return {
    sessionInfo,
    createSession,
    resumeSession,
    updateItemStatus,
    nextItem,
    restartModule,
    restartSession,
    getCurrentItem,
    getModuleItems,
    checkForUnfinishedSession,
  };
}

