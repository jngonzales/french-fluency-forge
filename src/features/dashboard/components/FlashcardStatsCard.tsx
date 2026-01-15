/**
 * Flashcard Stats Card (Simplified for Demo)
 * Shows: Scheduled (< 7 days) vs Learned (> 7 days)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CheckCircle2, Loader2 } from 'lucide-react';
import { useFlashcardStats } from '../hooks/useFlashcardStats';

export function FlashcardStatsCard() {
  const { scheduled, learned, total, loading, error } = useFlashcardStats();

  if (loading) {
    return (
      <Card className="border-border bg-card shadow-sm h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-serif">Flashcard Progress</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-border bg-card shadow-sm h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-serif">Flashcard Progress</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-sm text-muted-foreground">Unable to load stats</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card shadow-sm h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-serif">Flashcard Progress</CardTitle>
        <p className="text-sm text-muted-foreground">
          {total} total cards in your library
        </p>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Scheduled (< 7 days) */}
          <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-200 dark:border-amber-800/50 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                Scheduled
              </p>
            </div>
            <p className="text-3xl font-black text-amber-600 dark:text-amber-400 leading-none">
              {scheduled}
            </p>
            <p className="text-[10px] text-amber-600/70 dark:text-amber-400/70 mt-1">
              Due in next 7 days
            </p>
          </div>

          {/* Learned (> 7 days) */}
          <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-xl border border-green-200 dark:border-green-800/50 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
              <p className="text-xs font-bold uppercase tracking-wider text-green-700 dark:text-green-300">
                Learned
              </p>
            </div>
            <p className="text-3xl font-black text-green-600 dark:text-green-400 leading-none">
              {learned}
            </p>
            <p className="text-[10px] text-green-600/70 dark:text-green-400/70 mt-1">
              Review in 7+ days
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
