/**
 * Speaking Assessment Landing Page
 * Shows: Session history, Start new session, Resume in-progress sessions
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AdminPadding } from '@/components/AdminPadding';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Mic2, 
  Play, 
  Eye, 
  RotateCcw, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Loader2,
  ArrowLeft
} from 'lucide-react';

interface Session {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  intake: { label: 'Starting', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300', icon: Clock },
  consent: { label: 'Consent', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300', icon: Clock },
  quiz: { label: 'Quiz', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300', icon: Clock },
  mic_check: { label: 'Mic Check', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300', icon: Clock },
  assessment: { label: 'In Progress', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300', icon: Play },
  processing: { label: 'Processing', color: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300', icon: Loader2 },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300', icon: CheckCircle2 },
  error: { label: 'Error', color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300', icon: AlertCircle },
};

export default function FluencyAnalyzerLandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSessions() {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('assessment_sessions')
          .select('id, status, created_at, updated_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) {
          console.error('[FluencyAnalyzerLanding] Error fetching sessions:', error);
          return;
        }

        setSessions(data || []);
      } catch (err) {
        console.error('[FluencyAnalyzerLanding] Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    }

    if (user?.id) {
      fetchSessions();
    }
  }, [user?.id]);

  async function startNewSession() {
    if (!user?.id) return;

    try {
      // v0 demo: Skip intake/consent/quiz/mic_check - go straight to assessment
      const { data, error } = await supabase
        .from('assessment_sessions')
        .insert({ user_id: user.id, status: 'assessment' })
        .select('id')
        .single();

      if (error) throw error;
      
      // Navigate to assessment which will pick up this new session
      navigate('/assessment');
    } catch (err) {
      console.error('[FluencyAnalyzerLanding] Error creating session:', err);
    }
  }

  function getSessionAction(session: Session) {
    const inProgressStatuses = ['intake', 'consent', 'quiz', 'mic_check', 'assessment'];
    const isInProgress = inProgressStatuses.includes(session.status);
    const isCompleted = session.status === 'completed';

    if (isInProgress) {
      return (
        <Button 
          size="sm" 
          onClick={() => navigate(`/assessment?session=${session.id}`)}
          className="gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Resume
        </Button>
      );
    }

    if (isCompleted) {
      return (
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => navigate(`/results?session=${session.id}`)}
          className="gap-1.5"
        >
          <Eye className="w-3.5 h-3.5" />
          View Results
        </Button>
      );
    }

    return null;
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }

  function formatDateTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    if (diffDays === 0) return `Today at ${timeStr}`;
    if (diffDays === 1) return `Yesterday at ${timeStr}`;
    if (diffDays < 7) return `${diffDays} days ago at ${timeStr}`;
    
    const dateStr = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
    return `${dateStr} at ${timeStr}`;
  }

  // Find in-progress session (newest one that's not completed)
  const inProgressSession = sessions.find(s => 
    ['intake', 'consent', 'quiz', 'mic_check', 'assessment'].includes(s.status)
  );
  const completedSessions = sessions.filter(s => s.status === 'completed');

  if (!user) {
    return (
      <AdminPadding>
        <div className="flex items-center justify-center min-h-screen">
          <p>Please sign in to access the Speaking Assessment.</p>
        </div>
      </AdminPadding>
    );
  }

  return (
    <AdminPadding>
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="mb-4 -ml-2 gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Mic2 className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold">Speaking Assessment</h1>
            </div>
            <p className="text-muted-foreground">
              Assess your French speaking skills across pronunciation, comprehension, and conversation.
            </p>
          </div>

          {/* In-Progress Session */}
          {inProgressSession && (
            <Card className="mb-6 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Play className="w-5 h-5 text-amber-600" />
                  Session In Progress
                </CardTitle>
                <CardDescription>
                  You have an unfinished assessment. Continue where you left off.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className={STATUS_CONFIG[inProgressSession.status]?.color}>
                      {STATUS_CONFIG[inProgressSession.status]?.label || inProgressSession.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Started {formatDateTime(inProgressSession.created_at)}
                    </span>
                  </div>
                  <Button onClick={() => navigate(`/assessment?session=${inProgressSession.id}`)} className="gap-1.5">
                    <RotateCcw className="w-4 h-4" />
                    Resume Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Start New Session - Always visible */}
          <Card className="mb-6 border-primary/30 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-lg mb-1">Ready for a new assessment?</h3>
                  <p className="text-sm text-muted-foreground">
                    Takes about 10-15 minutes to complete all modules.
                  </p>
                </div>
                <Button onClick={startNewSession} size="lg" className="gap-2">
                  <Plus className="w-5 h-5" />
                  Start New Session
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Session History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Session History</CardTitle>
              <CardDescription>
                {completedSessions.length > 0 
                  ? `You have completed ${completedSessions.length} assessment${completedSessions.length > 1 ? 's' : ''}.`
                  : 'Complete your first assessment to see your results here.'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mic2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No sessions yet. Start your first assessment!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => {
                    const config = STATUS_CONFIG[session.status] || STATUS_CONFIG.error;
                    const Icon = config.icon;
                    const isCompleted = session.status === 'completed';
                    
                    return (
                      <div 
                        key={session.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${session.status === 'processing' ? 'animate-spin' : ''}`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {formatDate(session.created_at)}
                              </span>
                              <Badge variant="secondary" className={`text-xs ${config.color}`}>
                                {config.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {isCompleted 
                                ? `Completed ${formatDateTime(session.updated_at)}`
                                : `Started ${formatDateTime(session.created_at)}`
                              }
                            </p>
                          </div>
                        </div>
                        {getSessionAction(session)}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminPadding>
  );
}
