import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminMode } from '@/hooks/useAdminMode';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Settings, 
  SkipForward, 
  Play, 
  RotateCcw,
  Database,
  ChevronDown,
  Zap,
  Phone,
  LayoutDashboard,
  Trash2,
  Users
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type SessionStatus = 'intake' | 'consent' | 'quiz' | 'mic_check' | 'assessment' | 'processing' | 'completed';
// 4 assessment modules:
// A. Pronunciation - pronunciation exercises
// B. Comprehension - listening comprehension
// C. Confidence - confidence questionnaire only
// D. Speech test - open-ended prompt for fluency, syntax, conversation skills
type AssessmentPhase = 'pronunciation' | 'comprehension' | 'confidence' | 'conversation';

const STATUS_OPTIONS: { value: SessionStatus; label: string }[] = [
  { value: 'intake', label: 'Intake Form' },
  { value: 'consent', label: 'Consent Form' },
  { value: 'quiz', label: 'Personality Quiz' },
  { value: 'mic_check', label: 'Mic Check' },
  { value: 'assessment', label: 'Assessment Modules' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
];

const MODULE_OPTIONS: { value: AssessmentPhase; label: string; icon: string }[] = [
  { value: 'pronunciation', label: 'Pronunciation', icon: '🗣️' },
  { value: 'comprehension', label: 'Comprehension', icon: '👂' },
  { value: 'confidence', label: 'Confidence', icon: '🧠' },
  { value: 'conversation', label: 'Speech Test', icon: '🎙️' },
];

export function AdminToolbar() {
  const { user } = useAuth();
  const { isAdmin, isDev } = useAdminMode();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Hidden state - persisted in sessionStorage
  const [isHidden, setIsHidden] = useState(() => {
    return sessionStorage.getItem('admin_toolbar_hidden') === 'true';
  });

  // Keyboard shortcut: Ctrl+Shift+A to toggle visibility
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
      e.preventDefault();
      setIsHidden(prev => {
        const newValue = !prev;
        sessionStorage.setItem('admin_toolbar_hidden', String(newValue));
        return newValue;
      });
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Determine visibility (calculated after all hooks)
  const shouldShow = isAdmin || isDev;

  const jumpToStatus = async (status: SessionStatus) => {
    if (!user) {
      toast.error('Please login first');
      return;
    }

    try {
      const { data: existingSession } = await supabase
        .from('assessment_sessions')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingSession) {
        await supabase
          .from('assessment_sessions')
          .update({ status })
          .eq('id', existingSession.id);
      } else {
        await supabase
          .from('assessment_sessions')
          .insert({ user_id: user.id, status });
      }

      toast.success(`Jumped to ${status}`);
      
      if (location.pathname === '/assessment') {
        window.location.reload();
      } else {
        navigate('/assessment');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to jump');
    }
  };

  const jumpToModule = async (module: AssessmentPhase) => {
    if (!user) {
      toast.error('Please login first');
      return;
    }

    try {
      sessionStorage.setItem('dev_assessment_phase', module);
      
      const { data: existingSession } = await supabase
        .from('assessment_sessions')
        .select('id, status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingSession) {
        if (existingSession.status !== 'assessment') {
          await supabase
            .from('assessment_sessions')
            .update({ status: 'assessment' })
            .eq('id', existingSession.id);
        }
      } else {
        await supabase
          .from('assessment_sessions')
          .insert({ user_id: user.id, status: 'assessment' });
      }

      toast.success(`Jumping to ${module}...`);
      
      if (location.pathname === '/assessment') {
        window.location.reload();
      } else {
        navigate('/assessment');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to jump to module');
    }
  };

  const resetSession = async () => {
    if (!user) {
      toast.error('Please login first');
      return;
    }

    if (!confirm('Reset current session? This will create a fresh session.')) {
      return;
    }

    try {
      await supabase
        .from('assessment_sessions')
        .insert({ user_id: user.id, status: 'intake' });

      toast.success('New session created');
      navigate('/assessment');
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to reset session');
    }
  };

  /**
   * DELETE DATA BY CATEGORY - Selective data deletion
   * Allows users to choose what specific data to delete
   */
  const deleteDataCategory = async (category: 'assessment' | 'habits' | 'phrases' | 'confidence') => {
    if (!user) {
      toast.error('Please login first');
      return;
    }

    const categoryLabels: Record<string, string> = {
      assessment: 'Assessment Sessions & Recordings',
      habits: 'Habits & Goals',
      phrases: 'Phrases & Review Logs',
      confidence: 'Confidence Responses',
    };

    const confirmed = confirm(
      `⚠️ Delete ${categoryLabels[category]}?\n\n` +
      'This action cannot be undone.\n\n' +
      'Click OK to confirm deletion.'
    );

    if (!confirmed) return;

    try {
      toast.loading(`Deleting ${categoryLabels[category]}...`);
      console.log(`[DELETE CATEGORY] Deleting ${category} for user:`, user.id);

      // Helper function for safe deletion
      const safeDelete = async (table: string, column: string = 'user_id') => {
        try {
          console.log(`[DELETE CATEGORY] Deleting from ${table}`);
          const { error } = await (supabase as any)
            .from(table)
            .delete()
            .eq(column, user.id);
          
          if (error) {
            if (error.code === '42P01') {
              console.log(`[DELETE CATEGORY] Table ${table} doesn't exist, skipping`);
            } else {
              console.warn(`[DELETE CATEGORY] Error deleting from ${table}:`, error.message);
            }
          } else {
            console.log(`[DELETE CATEGORY] Deleted from ${table}`);
          }
        } catch (e) {
          console.warn(`[DELETE CATEGORY] Exception deleting from ${table}:`, e);
        }
      };

      switch (category) {
        case 'assessment':
          // Delete all assessment-related data
          await safeDelete('skill_recordings');
          await safeDelete('fluency_recordings');
          await safeDelete('fluency_events');
          await safeDelete('comprehension_recordings');
          await safeDelete('scoring_traces');
          await safeDelete('assessment_sessions');
          break;
          
        case 'habits':
          // Delete habits and goals
          await safeDelete('habit_cells');
          await safeDelete('habits');
          await safeDelete('goals');
          break;
          
        case 'phrases':
          // Delete phrase-related data
          await safeDelete('phrase_review_logs', 'member_id');
          await safeDelete('member_phrase_cards', 'member_id');
          await safeDelete('member_phrase_settings', 'member_id');
          break;
          
        case 'confidence':
          // Delete confidence data
          await safeDelete('confidence_questionnaire_responses');
          await safeDelete('consent_records');
          break;
      }

      toast.dismiss();
      toast.success(`✅ ${categoryLabels[category]} deleted!`);
      
      // Refresh the page
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      console.error('[DELETE CATEGORY] Error:', error);
      toast.dismiss();
      toast.error('Failed to delete data');
    }
  };

  /**
   * NEW SEASON - Wipes ALL user data for testing fresh account experience
   * This is useful for debugging/demoing the new user flow
   * 
   * Tables to DELETE (user data):
   * - habit_cells, habits, goals
   * - skill_recordings, fluency_recordings, fluency_events, comprehension_recordings
   * - confidence_questionnaire_responses
   * - scoring_traces
   * - archetype_feedback
   * - consent_records
   * - assessment_sessions
   * 
   * Tables to KEEP:
   * - app_accounts (licensing/credits)
   * - profiles (base user profile)
   * - purchases (payment records)
   */
  const startNewSeason = async () => {
    if (!user) {
      toast.error('Please login first');
      return;
    }

    const confirmed = confirm(
      '🚨 NEW SEASON 🚨\n\n' +
      'This will DELETE ALL your data:\n' +
      '• Habits & habit cells\n' +
      '• Goals\n' +
      '• Assessment sessions & recordings\n' +
      '• Confidence responses\n' +
      '• Consent records\n' +
      '\nYou will start fresh like a new account.\n\nAre you sure?'
    );
    if (!confirmed) return;

    try {
      toast.loading('Starting New Season... Wiping all data');
      
      // Helper to safely delete with error logging
      // Using dynamic table names requires type assertion
      const safeDelete = async (table: string, column: string = 'user_id') => {
        try {
          // Dynamic table access - intentionally using any
          const { data, error } = await (supabase as any)
            .from(table)
            .delete()
            .eq(column, user.id)
            .select();
          
          if (error) {
            // Don't log expected errors - column missing, permission denied, table missing
            // These are normal for optional tables without full RLS
            return { success: false, count: 0 };
          }
          return { success: true, count: data?.length ?? 0 };
        } catch (e) {
          // Silently handle exceptions - expected for some tables
          return { success: false, count: 0 };
        }
      };
      
      // Delete in order to respect FK constraints
      // Phase 1: Habit cells (references habits)
      await safeDelete('habit_cells');
      
      // Phase 2: Habits
      await safeDelete('habits');
      
      // Phase 3: Goals
      await safeDelete('goals');
      
      // Phase 4: Recordings (all types)
      await Promise.all([
        safeDelete('skill_recordings'),
        safeDelete('fluency_recordings'),
        safeDelete('fluency_events'),
        safeDelete('comprehension_recordings'),
      ]);
      
      // Phase 5: Confidence & Consent
      await Promise.all([
        safeDelete('confidence_questionnaire_responses'),
        safeDelete('consent_records'),
        safeDelete('archetype_feedback'),
      ]);
      
      // Phase 6: Scoring traces (if exists)
      await safeDelete('scoring_traces');
      
      // Phase 7: Assessment sessions (last, as other tables may reference it)
      await safeDelete('assessment_sessions');
      
      // Phase 8: Optional tables (may not exist - gracefully skip if missing)
      await Promise.all([
        safeDelete('member_phrase_cards', 'member_id'),
        safeDelete('phrase_review_logs', 'member_id'),
        safeDelete('member_phrase_settings', 'member_id'),
        safeDelete('user_phoneme_stats'),
        safeDelete('unified_exam_sessions'),
        safeDelete('speaking_assessment_sessions'),
        safeDelete('confidence_phone_calls'),
      ]);
      
      // Clear session storage
      sessionStorage.clear();
      
      // Clear localStorage EXCEPT for Supabase auth tokens (preserve login)
      const keysToKeep: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-')) {
          keysToKeep.push(key);
        }
      }
      const authTokens: Record<string, string> = {};
      keysToKeep.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) authTokens[key] = value;
      });
      localStorage.clear();
      Object.entries(authTokens).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
      
      console.log('[NEW SEASON] Complete! User data wiped.');
      toast.dismiss();
      toast.success('🌱 New Season started! All data wiped.');
      
      // Navigate to dashboard to see fresh state
      window.location.href = '/dashboard';
    } catch (error) {
      // Silently handle - the toast will show failure
      toast.dismiss();
      toast.error('Failed to start New Season');
    }
  };

  // Hide if not admin/dev or if manually hidden
  if (!shouldShow || isHidden) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9997] bg-amber-600 text-white shadow-lg">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          <Zap className="h-4 w-4" />
          <span className="text-sm font-bold">ADMIN MODE</span>
          {user && (
            <Badge variant="secondary" className="text-[10px] bg-amber-700 text-white">
              {user.email}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Jump to Status */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="h-7 text-xs bg-amber-700 hover:bg-amber-800">
                <SkipForward className="h-3 w-3 mr-1" />
                Jump to Stage
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Assessment Stages</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {STATUS_OPTIONS.map(opt => (
                <DropdownMenuItem key={opt.value} onClick={() => jumpToStatus(opt.value)}>
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Jump to Module */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="h-7 text-xs bg-amber-700 hover:bg-amber-800">
                <Play className="h-3 w-3 mr-1" />
                Jump to Module
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Assessment Modules</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {MODULE_OPTIONS.map(opt => (
                <DropdownMenuItem key={opt.value} onClick={() => jumpToModule(opt.value)}>
                  <span className="mr-2">{opt.icon}</span>
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Reset Session */}
          <Button 
            variant="secondary" 
            size="sm" 
            className="h-7 text-xs bg-amber-700 hover:bg-amber-800"
            onClick={resetSession}
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            New Session
          </Button>

          {/* NEW SEASON - Selective data deletion dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="secondary" 
                size="sm" 
                className="h-7 text-xs bg-red-700 hover:bg-red-800"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                New Season
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs text-red-600">⚠️ Delete Data</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                className="text-xs cursor-pointer"
                onClick={() => deleteDataCategory('assessment')}
              >
                🎯 Assessment Sessions & Recordings
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                className="text-xs cursor-pointer"
                onClick={() => deleteDataCategory('habits')}
              >
                📊 Habits & Goals
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                className="text-xs cursor-pointer"
                onClick={() => deleteDataCategory('phrases')}
              >
                📚 Phrases & Review Logs
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                className="text-xs cursor-pointer"
                onClick={() => deleteDataCategory('confidence')}
              >
                💪 Confidence Responses
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                className="text-xs cursor-pointer text-red-600 font-semibold"
                onClick={startNewSeason}
              >
                🚨 DELETE EVERYTHING
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sales Copilot */}
          <Button 
            variant="secondary" 
            size="sm" 
            className="h-7 text-xs bg-amber-700 hover:bg-amber-800"
            onClick={() => navigate('/admin/sales-copilot')}
          >
            <Phone className="h-3 w-3 mr-1" />
            Sales Copilot
          </Button>

          {/* User Admin */}
          <Button 
            variant="secondary" 
            size="sm" 
            className="h-7 text-xs bg-amber-700 hover:bg-amber-800"
            onClick={() => navigate('/admin/users')}
          >
            <Users className="h-3 w-3 mr-1" />
            User Admin
          </Button>

          {/* Dashboard */}
          <Button 
            variant="secondary" 
            size="sm" 
            className="h-7 text-xs bg-amber-700 hover:bg-amber-800"
            onClick={() => navigate('/dashboard')}
          >
            <LayoutDashboard className="h-3 w-3 mr-1" />
            Dashboard
          </Button>

          {/* Current Location */}
          <Badge variant="secondary" className="text-[10px] bg-amber-800">
            {location.pathname}
          </Badge>
        </div>
      </div>
    </div>
  );
}
