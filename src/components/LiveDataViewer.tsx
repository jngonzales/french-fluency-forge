import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminMode } from '@/hooks/useAdminMode';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, TrendingUp, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LiveDataViewerProps {
  sessionId: string;
  moduleType?: 'pronunciation' | 'fluency' | 'confidence' | 'syntax' | 'conversation' | 'comprehension';
}

interface RecentRecording {
  id: string;
  type: 'fluency' | 'skill' | 'comprehension';
  module?: string;
  transcript?: string | null;
  score?: number | null;
  wpm?: number | null;
  created_at: string;
}

export function LiveDataViewer({ sessionId, moduleType }: LiveDataViewerProps) {
  const { isAdmin, isDev } = useAdminMode();
  const [recordings, setRecordings] = useState<RecentRecording[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Determine visibility (but don't return early before hooks)
  const shouldShow = isAdmin || isDev;

  const loadRecordings = async () => {
    if (!shouldShow) return; // Guard inside function instead of early return
    
    setLoading(true);

    try {
      const allRecordings: RecentRecording[] = [];

      // Load fluency recordings
      if (!moduleType || moduleType === 'fluency') {
        const { data: fluencyData } = await supabase
          .from('fluency_recordings')
          .select('id, transcript, wpm, created_at')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: false })
          .limit(3);

        if (fluencyData) {
          allRecordings.push(...fluencyData.map(r => ({
            id: r.id,
            type: 'fluency' as const,
            transcript: r.transcript,
            wpm: r.wpm,
            created_at: r.created_at,
          })));
        }
      }

      // Load skill recordings
      if (!moduleType || ['confidence', 'syntax', 'conversation'].includes(moduleType)) {
        const query = supabase
          .from('skill_recordings')
          .select('id, module_type, transcript, ai_score, created_at')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: false })
          .limit(5);

        if (moduleType && moduleType !== 'fluency' && moduleType !== 'comprehension') {
          query.eq('module_type', moduleType);
        }

        const { data: skillData } = await query;

        if (skillData) {
          allRecordings.push(...skillData.map(r => ({
            id: r.id,
            type: 'skill' as const,
            module: r.module_type,
            transcript: r.transcript,
            score: r.ai_score,
            created_at: r.created_at,
          })));
        }
      }

      // Load comprehension recordings
      if (!moduleType || moduleType === 'comprehension') {
        const { data: comprehensionData } = await supabase
          .from('comprehension_recordings')
          .select('id, transcript, ai_score, created_at')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: false })
          .limit(3);

        if (comprehensionData) {
          allRecordings.push(...comprehensionData.map(r => ({
            id: r.id,
            type: 'comprehension' as const,
            transcript: r.transcript,
            score: r.ai_score,
            created_at: r.created_at,
          })));
        }
      }

      // Sort by date
      allRecordings.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setRecordings(allRecordings.slice(0, 5));
    } catch (error) {
      console.error('Error loading recordings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!shouldShow) return; // Guard inside effect
    
    loadRecordings();

    // Auto-refresh every 3 seconds
    if (autoRefresh) {
      const interval = setInterval(loadRecordings, 3000);
      return () => clearInterval(interval);
    }
  }, [sessionId, moduleType, autoRefresh, shouldShow]);

  // Move the early return AFTER all hooks
  if (!shouldShow) return null;

  if (recordings.length === 0) {
    return (
      <div className="fixed bottom-24 right-4 z-[9996] w-80 bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold">LIVE DATA</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={loadRecordings}
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center py-4">
          No recordings yet. Start recording to see live data here.
        </p>
      </div>
    );
  }

  return (
    <div className="fixed bottom-24 right-4 z-[9996] w-96 max-h-[500px] bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-xl overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold">LIVE DATA</span>
          <Badge variant="secondary" className="text-[9px] h-4">
            Last {recordings.length}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="text-[10px] px-2 py-1 rounded hover:bg-muted"
          >
            {autoRefresh ? '🟢 Auto' : '⚪ Manual'}
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={loadRecordings}
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="p-2 space-y-2">
          {recordings.map((rec) => (
            <Card key={rec.id} className="border-border/50 bg-muted/20">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] h-5 capitalize">
                    {rec.type === 'fluency' ? 'Fluency' : rec.type === 'skill' ? rec.module : 'Comprehension'}
                  </Badge>
                  <span className="text-[9px] text-muted-foreground">
                    {new Date(rec.created_at).toLocaleTimeString()}
                  </span>
                </div>

                {/* Score Display */}
                {rec.score !== null && rec.score !== undefined && (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">
                      {rec.score}
                      {rec.type === 'fluency' ? '/100' : '/100'}
                    </span>
                    {rec.wpm && (
                      <span className="text-xs text-muted-foreground">
                        • {rec.wpm} WPM
                      </span>
                    )}
                  </div>
                )}

                {/* Transcript */}
                {rec.transcript && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[9px] text-muted-foreground font-medium">
                        Transcript:
                      </span>
                    </div>
                    <p className="text-[10px] text-foreground bg-muted/40 p-2 rounded leading-relaxed max-h-24 overflow-y-auto">
                      {rec.transcript}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

