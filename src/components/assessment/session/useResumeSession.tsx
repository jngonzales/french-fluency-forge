/**
 * Resume Session Hook
 * Detects and manages unfinished sessions
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssessmentSession } from './useAssessmentSession';

export function useResumeSession() {
  const navigate = useNavigate();
  const {
    sessionInfo,
    resumeSession,
    restartModule,
    restartSession,
    checkForUnfinishedSession,
  } = useAssessmentSession();

  const [showBanner, setShowBanner] = useState(false);
  const [unfinishedSessionId, setUnfinishedSessionId] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const unfinished = await checkForUnfinishedSession();
      if (unfinished) {
        setUnfinishedSessionId(unfinished.id);
        setShowBanner(true);
      }
    };

    checkSession();
  }, [checkForUnfinishedSession]);

  const handleContinue = useCallback(async () => {
    if (!unfinishedSessionId) return;

    const info = await resumeSession(unfinishedSessionId);
    if (info && info.currentItem) {
      // Navigate to the appropriate module
      const moduleRoutes: Record<string, string> = {
        pronunciation: '/assessment/pronunciation',
        fluency: '/assessment/fluency',
        confidence: '/assessment/confidence',
        syntax: '/assessment/syntax',
        conversation: '/assessment/conversation',
        comprehension: '/assessment/comprehension',
      };

      const route = moduleRoutes[info.currentItem.module_type];
      if (route) {
        navigate(route);
      }
    }

    setShowBanner(false);
  }, [unfinishedSessionId, resumeSession, navigate]);

  const handleRestartModule = useCallback(async () => {
    if (!sessionInfo.session || !sessionInfo.currentItem) return;

    const confirmed = window.confirm(
      `Are you sure you want to restart the ${sessionInfo.currentItem.module_type} module? Your progress in this module will be reset.`
    );

    if (confirmed) {
      await restartModule(sessionInfo.currentItem.module_type);
      setShowBanner(false);
    }
  }, [sessionInfo, restartModule]);

  const handleRestartSession = useCallback(async () => {
    const confirmed = window.confirm(
      'Are you sure you want to restart the entire assessment? All your progress will be reset.'
    );

    if (confirmed) {
      await restartSession();
      setShowBanner(false);
    }
  }, [restartSession]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
  }, []);

  return {
    showBanner,
    sessionInfo,
    unfinishedSessionId,
    handleContinue,
    handleRestartModule,
    handleRestartSession,
    handleDismiss,
  };
}

