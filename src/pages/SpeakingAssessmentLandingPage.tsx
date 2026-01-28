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
  ArrowLeft,
  Trash2
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface Session {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  current_module: string | null;
}

// Module order for progress tracking
const MODULE_ORDER = ['pronunciation', 'comprehension', 'confidence', 'conversation'] as const;

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchSessions() {
      if (!user?.id) return;

      try {
        // Cast to any because current_module may not be in generated types yet
        const { data, error } = await (supabase as any)
          .from('assessment_sessions')
          .select('id, status, created_at, updated_at, current_module')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) {
          console.error('[FluencyAnalyzerLanding] Error fetching sessions:', error);
          return;
        }

        setSessions((data as Session[]) || []);
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

  async function deleteSession() {
    if (!sessionToDelete || !user?.id) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('assessment_sessions')
        .delete()
        .eq('id', sessionToDelete.id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Remove from local state
      setSessions(prev => prev.filter(s => s.id !== sessionToDelete.id));
      toast.success('Session deleted successfully');
    } catch (err) {
      console.error('[FluencyAnalyzerLanding] Error deleting session:', err);
      toast.error('Failed to delete session');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    }
  }

  function openDeleteDialog(session: Session) {
    setSessionToDelete(session);
    setDeleteDialogOpen(true);
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

  /**
   * Get module progress for a session
   * Returns: { completed: number, current: string | null, total: number }
   */
  function getModuleProgress(session: Session) {
    const isCompleted = session.status === 'completed';
    
    if (isCompleted) {
      return { completed: MODULE_ORDER.length, current: null, total: MODULE_ORDER.length };
    }

    if (!session.current_module) {
      // No module started yet, assume at start
      return { completed: 0, current: 'pronunciation', total: MODULE_ORDER.length };
    }

    const currentIndex = MODULE_ORDER.indexOf(session.current_module as typeof MODULE_ORDER[number]);
    if (currentIndex === -1) {
      return { completed: 0, current: session.current_module, total: MODULE_ORDER.length };
    }

    return { 
      completed: currentIndex, 
      current: session.current_module, 
      total: MODULE_ORDER.length 
    };
  }

  /**
   * Get short module labels for display
   */
  const MODULE_LABELS: Record<string, string> = {
    pronunciation: 'Pron',
    comprehension: 'Comp',
    confidence: 'Conf',
    conversation: 'Conv',
  };

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
          {/* Header - Grandparent-Proof with prominent Back button */}
          <div className="mb-8">
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate('/dashboard')}
              className="mb-6 gap-2 text-base font-semibold border-2 px-6"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </Button>
            
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-lg bg-primary/10">
                <Mic2 className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold">Speaking Assessment</h1>
            </div>
            <p className="text-muted-foreground">
              Assess your French speaking skills across pronunciation, comprehension, and conversation.
            </p>
          </div>

          {/* In-Progress Session */}
          {inProgressSession && (() => {
            const progress = getModuleProgress(inProgressSession);
            return (
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
                <CardContent className="space-y-4">
                  {/* Module Progress */}
                  <div className="flex items-center gap-2">
                    {MODULE_ORDER.map((module, index) => {
                      const isModuleCompleted = index < progress.completed;
                      const isCurrentModule = module === progress.current;
                      const moduleLabel = module.charAt(0).toUpperCase() + module.slice(1);
                      
                      return (
                        <div
                          key={module}
                          className={`
                            flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                            ${isModuleCompleted 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                              : isCurrentModule
                                ? 'bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200 ring-2 ring-amber-400'
                                : 'bg-muted/50 text-muted-foreground'
                            }
                          `}
                        >
                          {isModuleCompleted ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : isCurrentModule ? (
                            <Play className="w-3 h-3" />
                          ) : null}
                          {moduleLabel}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Badge className={STATUS_CONFIG[inProgressSession.status]?.color + " text-sm px-3 py-1"}>
                        {STATUS_CONFIG[inProgressSession.status]?.label || inProgressSession.status}
                      </Badge>
                      <span className="text-base text-muted-foreground">
                        Started {formatDateTime(inProgressSession.created_at)}
                      </span>
                    </div>
                    <Button 
                      onClick={() => navigate(`/assessment?session=${inProgressSession.id}`)} 
                      size="lg"
                      className="gap-2 text-lg px-8 py-6 h-auto font-bold"
                    >
                      <RotateCcw className="w-5 h-5" />
                      Resume Session
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Start New Session - HUGE and prominent for seniors */}
          <Card className="mb-6 border-2 border-primary bg-primary/5">
            <CardContent className="py-8">
              <div className="flex flex-col items-center text-center gap-6">
                <div>
                  <h3 className="font-bold text-2xl mb-2">Ready to test your French?</h3>
                  <p className="text-lg text-muted-foreground">
                    Takes about 10-15 minutes to complete.
                  </p>
                </div>
                <Button 
                  onClick={startNewSession} 
                  size="lg" 
                  className="gap-3 text-xl px-10 py-7 h-auto font-bold"
                >
                  <Plus className="w-6 h-6" />
                  Start Assessment
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
                    const progress = getModuleProgress(session);
                    
                    return (
                      <div 
                        key={session.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Icon className={`w-4 h-4 flex-shrink-0 ${session.status === 'processing' ? 'animate-spin' : ''}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
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
                            {/* Module Progress Indicator */}
                            <div className="flex items-center gap-1 mt-1.5">
                              {MODULE_ORDER.map((module, index) => {
                                const isModuleCompleted = index < progress.completed;
                                const isCurrentModule = module === progress.current;
                                
                                return (
                                  <div
                                    key={module}
                                    className={`
                                      flex items-center justify-center
                                      h-5 px-1.5 rounded text-[10px] font-medium
                                      transition-colors
                                      ${isModuleCompleted 
                                        ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' 
                                        : isCurrentModule
                                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 ring-1 ring-amber-300 dark:ring-amber-700'
                                          : 'bg-muted text-muted-foreground'
                                      }
                                    `}
                                    title={`${module.charAt(0).toUpperCase() + module.slice(1)}: ${isModuleCompleted ? 'Completed' : isCurrentModule ? 'In Progress' : 'Pending'}`}
                                  >
                                    {isModuleCompleted ? (
                                      <CheckCircle2 className="w-3 h-3" />
                                    ) : (
                                      MODULE_LABELS[module]
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {getSessionAction(session)}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openDeleteDialog(session)}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this assessment session
              {sessionToDelete?.status === 'completed' && ' and its results'}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteSession}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPadding>
  );
}
