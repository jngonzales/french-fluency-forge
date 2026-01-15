/**
 * Hook to fetch flashcard statistics (Scheduled vs Learned)
 * 
 * Scheduled: Cards with due_at < now + 7 days
 * Learned: Cards with due_at > now + 7 days (or no due date = new)
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FlashcardStats {
  scheduled: number;  // Due within 7 days
  learned: number;    // Due beyond 7 days
  total: number;
  loading: boolean;
  error: string | null;
}

// Type assertion for tables not in generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface CardRow {
  due_at: string | null;
  scheduler_state: string | null;
}

export function useFlashcardStats(): FlashcardStats {
  const { user } = useAuth();
  const [stats, setStats] = useState<FlashcardStats>({
    scheduled: 0,
    learned: 0,
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
          .select('due_at, scheduler_state')
          .eq('member_id', user.id);

        if (error) {
          console.warn('[useFlashcardStats] Error fetching cards:', error);
          // Table might not exist yet, fail gracefully
          setStats({
            scheduled: 0,
            learned: 0,
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

        (cards as CardRow[]).forEach((card) => {
          if (!card.due_at) {
            // New cards with no due_at are counted as scheduled (need to learn)
            scheduled++;
            return;
          }

          const dueDate = new Date(card.due_at);
          
          if (dueDate <= sevenDaysFromNow) {
            scheduled++;
          } else {
            learned++;
          }
        });

        setStats({
          scheduled,
          learned,
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
