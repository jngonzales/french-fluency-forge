/**
 * Hook to fetch flashcard statistics (Scheduled vs Learned)
 * 
 * Per Tom's requirements:
 * - Scheduled: Cards with next review due within < 7 days
 * - Learned: Cards with next review scheduled > 7 days away
 * - New cards (never reviewed) are NOT counted in either
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FlashcardStats {
  scheduled: number;  // Due within 7 days
  learned: number;    // Due beyond 7 days
  newCards: number;   // Never reviewed (scheduler_state = 'new')
  total: number;
  loading: boolean;
  error: string | null;
}

// Type assertion for tables not in generated types
const db = supabase as unknown as { from: (table: string) => ReturnType<typeof supabase.from> };

interface CardRow {
  due_at: string | null;
  scheduler_state: string | null;
  last_reviewed_at: string | null;
}

export function useFlashcardStats(): FlashcardStats {
  const { user } = useAuth();
  const [stats, setStats] = useState<FlashcardStats>({
    scheduled: 0,
    learned: 0,
    newCards: 0,
    total: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchStats() {
      if (!user?.id) {
        setStats(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        // Get all cards for the current user (member_id = user.id)
        const { data: cards, error } = await db
          .from('member_phrase_cards')
          .select('due_at, scheduler_state, last_reviewed_at')
          .eq('member_id', user.id);

        if (error) {
          console.warn('[useFlashcardStats] Error fetching cards:', error);
          // Table might not exist yet, fail gracefully
          setStats({
            scheduled: 0,
            learned: 0,
            newCards: 0,
            total: 0,
            loading: false,
            error: null,
          });
          return;
        }

        if (!cards || cards.length === 0) {
          setStats({
            scheduled: 0,
            learned: 0,
            newCards: 0,
            total: 0,
            loading: false,
            error: null,
          });
          return;
        }

        const now = new Date();
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        let scheduled = 0;
        let learned = 0;
        let newCards = 0;

        (cards as CardRow[]).forEach((card) => {
          // New cards (never reviewed) - don't count in scheduled OR learned
          if (card.scheduler_state === 'new' || !card.last_reviewed_at) {
            newCards++;
            return;
          }

          // Cards that have been reviewed at least once
          if (!card.due_at) {
            // Edge case: reviewed but no due_at - count as needs scheduling
            scheduled++;
            return;
          }

          const dueDate = new Date(card.due_at);
          
          // Scheduled: due within the next 7 days
          // Learned: due more than 7 days from now
          if (dueDate <= sevenDaysFromNow) {
            scheduled++;
          } else {
            learned++;
          }
        });

        setStats({
          scheduled,
          learned,
          newCards,
          total: cards.length,
          loading: false,
          error: null,
        });
      } catch (err) {
        console.warn('[useFlashcardStats] Unexpected error:', err);
        // Fail gracefully
        setStats({
          scheduled: 0,
          learned: 0,
          newCards: 0,
          total: 0,
          loading: false,
          error: null,
        });
      }
    }

    fetchStats();
  }, [user?.id]);

  return stats;
}
