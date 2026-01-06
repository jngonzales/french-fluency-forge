/**
 * Phrases Settings Hook
 * Manages member settings with localStorage persistence
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { PhraseSettings } from '../types';
import { fetchMemberPhraseSettings, upsertMemberPhraseSettings } from '../services/phrasesApi';

const DEFAULT_SETTINGS: Omit<PhraseSettings, 'member_id'> = {
  new_per_day: 20,
  reviews_per_day: 100,
  target_retention: 0.90,
  speech_feedback_enabled: false,
  auto_assess_enabled: false,
  recognition_shadow_default: false,
  show_time_to_recall: true,
};

export function usePhrasesSettings(memberId?: string) {
  const { user } = useAuth();
  const effectiveMemberId = memberId || user?.id || 'guest';
  
  const [settings, setSettings] = useState<PhraseSettings>({
    member_id: effectiveMemberId,
    ...DEFAULT_SETTINGS,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load settings from localStorage
  useEffect(() => {
    const load = async () => {
      try {
        if (user?.id) {
          const dbSettings = await fetchMemberPhraseSettings(user.id);
          setSettings(dbSettings);
          localStorage.setItem(`solv_phrases_settings_${user.id}`, JSON.stringify(dbSettings));
        } else {
          const key = `solv_phrases_settings_${effectiveMemberId}`;
          const stored = localStorage.getItem(key);
          
          if (stored) {
            const parsed = JSON.parse(stored);
            setSettings({
              member_id: effectiveMemberId,
              ...DEFAULT_SETTINGS,
              ...parsed,
            });
          } else {
            setSettings({
              member_id: effectiveMemberId,
              ...DEFAULT_SETTINGS,
            });
          }
        }
      } catch (err) {
        console.error('Failed to load phrase settings:', err);
        setError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [effectiveMemberId, user?.id]);

  // Update settings
  const updateSettings = (updates: Partial<Omit<PhraseSettings, 'member_id'>>) => {
    try {
      const newSettings = {
        ...settings,
        ...updates,
      };

      // Validate settings
      if (newSettings.new_per_day < 0 || newSettings.new_per_day > 50) {
        throw new Error('New per day must be between 0 and 50');
      }
      if (newSettings.reviews_per_day < 0 || newSettings.reviews_per_day > 200) {
        throw new Error('Reviews per day must be between 0 and 200');
      }
      if (newSettings.target_retention < 0.75 || newSettings.target_retention > 0.95) {
        throw new Error('Target retention must be between 0.75 and 0.95');
      }

      setSettings(newSettings);

      const key = `solv_phrases_settings_${effectiveMemberId}`;
      localStorage.setItem(key, JSON.stringify(newSettings));

      if (user?.id) {
        void upsertMemberPhraseSettings(newSettings as PhraseSettings);
      }

      setError(null);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update settings';
      setError(message);
      return false;
    }
  };

  // Reset to defaults
  const resetSettings = () => {
    const newSettings: PhraseSettings = {
      member_id: effectiveMemberId,
      ...DEFAULT_SETTINGS,
    };
    setSettings(newSettings);
    
    const key = `solv_phrases_settings_${effectiveMemberId}`;
    localStorage.setItem(key, JSON.stringify(newSettings));

    if (user?.id) {
      void upsertMemberPhraseSettings(newSettings);
    }
  };

  return {
    settings,
    loading,
    error,
    updateSettings,
    resetSettings,
  };
}

