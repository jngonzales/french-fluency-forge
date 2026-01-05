/**
 * Hook for fetching schedule previews
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { MemberPhraseCard, PhraseSettings } from '../types';
import { getFSRSConfigFromSettings } from '../data/fsrsScheduler';

interface IntervalPreview {
  due_at: string;
  interval_ms: number;
  label: string;
}

interface SchedulePreview {
  intervals: {
    again: IntervalPreview;
    hard: IntervalPreview;
    good: IntervalPreview;
    easy: IntervalPreview;
  };
}

export function useSchedulePreview(card: MemberPhraseCard | null, settings: PhraseSettings | null) {
  const [preview, setPreview] = useState<SchedulePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPreview = useCallback(async () => {
    if (!card || !settings) return;

    setLoading(true);
    setError(null);

    try {
      const config = getFSRSConfigFromSettings(settings);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/phrases-schedule-preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`,
        },
        body: JSON.stringify({
          card: {
            id: card.id,
            scheduler: card.scheduler,
            reviews: card.reviews,
            lapses: card.lapses,
          },
          now: new Date().toISOString(),
          config,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch preview');
      }

      const data = await response.json();
      if (data.success && data.intervals) {
        setPreview(data);
      } else {
        throw new Error(data.error || 'Failed to fetch preview');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('[useSchedulePreview] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [card, settings]);

  useEffect(() => {
    if (card && settings) {
      fetchPreview();
    }
  }, [card?.id, card?.scheduler?.due_at, settings?.target_retention, fetchPreview]);

  return {
    preview,
    loading,
    error,
    refetch: fetchPreview,
  };
}

