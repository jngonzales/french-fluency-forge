/**
 * Assessment Session Management Hook
 * Stub implementation - the full speaking_assessment_sessions table doesn't exist yet
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { ModuleType } from '../promptBank/types';

interface SpeakingAssessmentSession {
  id: string;
  user_id: string;
  mode: 'full' | 'single_module';
  single_module_type: ModuleType | null;
  status: 'created' | 'in_progress' | 'completed' | 'abandoned';
  current_module: ModuleType | null;
}

interface AssessmentItem {
  id: string;
  session_id: string;
  module_type: ModuleType;
  item_index: number;
  prompt_id: string;
  prompt_payload: any;
  status: 'not_started' | 'recording' | 'processing' | 'completed' | 'error';
  attempt_number: number;
  result_ref: Record<string, any>;
}

export interface CurrentSessionInfo {
  session: SpeakingAssessmentSession | null;
  items: AssessmentItem[];
  currentItem: AssessmentItem | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Stub hook - full implementation requires speaking_assessment_sessions table
 */
export function useAssessmentSession() {
  const { user } = useAuth();
  const [sessionInfo] = useState<CurrentSessionInfo>({
    session: null,
    items: [],
    currentItem: null,
    isLoading: false,
    error: null,
  });

  const checkForUnfinishedSession = useCallback(async () => {
    // Stub: no session management table exists yet
    return null;
  }, []);

  const createSession = useCallback(async (
    _mode: 'full' | 'single_module',
    _singleModuleType?: ModuleType
  ): Promise<SpeakingAssessmentSession | null> => {
    console.warn('[Session] createSession is a stub - table does not exist');
    return null;
  }, []);

  const resumeSession = useCallback(async (
    _sessionId: string
  ): Promise<CurrentSessionInfo | null> => {
    console.warn('[Session] resumeSession is a stub - table does not exist');
    return null;
  }, []);

  const updateItemStatus = useCallback(async (
    _itemId: string,
    _status: AssessmentItem['status'],
    _resultRef?: Record<string, any>
  ) => {
    console.warn('[Session] updateItemStatus is a stub');
  }, []);

  const nextItem = useCallback(async () => {
    return null;
  }, []);

  const restartModule = useCallback(async (_moduleType: ModuleType) => {
    console.warn('[Session] restartModule is a stub');
  }, []);

  const restartSession = useCallback(async (
    _mode?: 'full' | 'single_module',
    _singleModuleType?: ModuleType
  ) => {
    console.warn('[Session] restartSession is a stub');
    return null;
  }, []);

  const getCurrentItem = useCallback(() => {
    return sessionInfo.currentItem;
  }, [sessionInfo]);

  const getModuleItems = useCallback((_moduleType: ModuleType) => {
    return [];
  }, []);

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
