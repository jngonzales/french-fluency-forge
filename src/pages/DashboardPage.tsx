/**
 * Member Dashboard / Progress Hub
 * Shows progress, habits, goals, and gamification
 */

import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminMode } from '@/hooks/useAdminMode';
import { useDashboardData } from '@/features/dashboard/hooks/useDashboardData';
import { AdminPadding } from '@/components/AdminPadding';
import { ProgressTimelineCard } from '@/features/dashboard/components/ProgressTimelineCard';
import { RadarCard } from '@/features/dashboard/components/RadarCard';
import { HabitGridCard } from '@/features/dashboard/components/HabitGridCard';
import { GoalsCard } from '@/features/dashboard/components/GoalsCard';
import { PhraseStatsCard } from '@/features/dashboard/components/PhraseStatsCard';
import { BadgesCard } from '@/features/dashboard/components/BadgesCard';
import { FlashcardStatsCard } from '@/features/dashboard/components/FlashcardStatsCard';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton, CardSkeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, Lock, BookOpen, Mic2, MessageSquare, Users, GraduationCap, UserCircle } from 'lucide-react';
import type { MetricKey, TimeRange, PlanKey, PlanFeatures } from '@/features/dashboard/types';

// Feature list for the resources menu
// NOTE: Hidden for v0 demo: groupCoaching, oneOnOneCoaching, groupConversations, aiTutor (not demo-ready)
const FEATURE_LIST = [
  // { key: 'groupCoaching', label: 'Group Coaching Sessions', icon: GraduationCap }, // Hidden for demo
  // { key: 'oneOnOneCoaching', label: '1:1 Conversation Coaching', icon: UserCircle }, // Hidden for demo
  // { key: 'groupConversations', label: 'Group Conversation Sessions', icon: Users }, // Hidden for demo
  // { key: 'aiTutor', label: 'AI Tutor', icon: MessageSquare }, // Hidden for demo
  { key: 'fluencyAnalyzer', label: 'Speaking Assessment', icon: Mic2 },
  { key: 'phrases', label: 'My Phrases', icon: BookOpen },
] as const;

const planNames: Record<PlanKey, string> = {
  '3090': '30/90 Challenge',
  'continuity': 'Continuity',
  'software': 'Software Only',
};

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminMode();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const viewingMemberId = searchParams.get('memberId') || undefined;

  const { data, loading, error, habits, habitGrid, goals, badges, actions } =
    useDashboardData(viewingMemberId);

  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('overall');
  const [selectedRange, setSelectedRange] = useState<TimeRange>('30d');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  if (!user) {
    return (
      <AdminPadding>
        <div className="flex items-center justify-center min-h-screen">
          <p>Please sign in to view your dashboard.</p>
        </div>
      </AdminPadding>
    );
  }

  if (loading.assessments && !data) {
    return (
      <AdminPadding>
        <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8 animate-fade-in">
          {/* Header skeleton */}
          <div className="max-w-7xl mx-auto mb-8">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
          
          {/* Cards grid skeleton */}
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card skeletons */}
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </AdminPadding>
    );
  }

  if (error) {
    return (
      <AdminPadding>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-destructive">{error}</p>
        </div>
      </AdminPadding>
    );
  }

  if (!data) {
    return null;
  }

  const memberName = data.member.name || 'Member';

  return (
    <AdminPadding>
      <div className="min-h-screen bg-background overflow-x-hidden animate-fade-in">
        {/* Top Header */}
        <header className="border-b border-border bg-card sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* My Resources Burger Menu */}
                <Sheet open={resourcesOpen} onOpenChange={setResourcesOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Menu className="w-4 h-4" />
                      <span className="hidden sm:inline">My Resources</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80">
                    <SheetHeader className="pb-6">
                      <SheetTitle className="text-xl font-serif">My Resources</SheetTitle>
                      <p className="text-sm text-muted-foreground font-medium">
                        {planNames[data.member.plan]}
                      </p>
                    </SheetHeader>
                    <div className="space-y-1">
                      {FEATURE_LIST.map((feature) => {
                        // For v0 demo, all visible features (phrases, fluencyAnalyzer) are always unlocked
                        const Icon = feature.icon;
                        const linkTo = feature.key === 'phrases' ? '/phrases' : '/speaking-assessment';
                        
                        return (
                          <Link
                            key={feature.key}
                            to={linkTo}
                            onClick={() => setResourcesOpen(false)}
                            className="w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group hover:bg-primary/5 text-foreground cursor-pointer hover:translate-x-1"
                          >
                            <div className="p-2 rounded-md flex-shrink-0 bg-primary/10 text-primary">
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium text-left flex-1">{feature.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                    <div className="mt-6 pt-6 border-t border-border">
                      <Button variant="outline" className="w-full border-dashed hover:border-primary hover:text-primary transition-all duration-300" disabled>
                        Upgrade Your Access
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
                
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">Progress Hub</h1>
                  <p className="text-muted-foreground text-sm">Welcome back, {memberName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="hidden sm:inline-flex">{data.member.plan}</Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar>
                        <AvatarFallback>
                          {memberName[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover">
                    <DropdownMenuItem disabled>Account</DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={signOut} 
                      className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                    >
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - All full-width cards */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Progress Journey - on top */}
          <ProgressTimelineCard
            timeline={data.timeline}
            selectedMetric={selectedMetric}
            selectedRange={selectedRange}
            selectedGoalId={selectedGoalId}
            goals={goals}
            onMetricChange={setSelectedMetric}
            onRangeChange={setSelectedRange}
            onGoalChange={setSelectedGoalId}
            assessments={data.assessments.history}
          />

          {/* Skill Profile */}
          <RadarCard
            baseline={data.assessments.baseline}
            current={data.assessments.current}
          />

          {/* Daily Momentum */}
          <HabitGridCard
            habits={habits}
            habitGrid={habitGrid}
            range={selectedRange}
            onCellToggle={actions.updateHabitCell}
            onAddHabit={actions.addHabit}
            onUpdateHabit={actions.updateHabit}
            onDeleteHabit={actions.deleteHabit}
            onBadgeUnlock={actions.unlockBadge}
          />

          {/* Outcome Goals */}
          <GoalsCard
            goals={goals}
            onAddGoal={actions.addGoal}
            onUpdateGoal={actions.updateGoal}
            onDeleteGoal={actions.deleteGoal}
            onGoalSelect={setSelectedGoalId}
            selectedGoalId={selectedGoalId}
          />

          {/* Achievements - Hidden for v0 demo (not ready) */}
          {/* <BadgesCard
            badges={badges}
            points={data.points}
            onUnlock={actions.unlockBadge}
            isAdmin={isAdmin}
          /> */}

          {/* Phrase Stats - Scheduled vs Learned */}
          <FlashcardStatsCard />
        </main>
      </div>
    </AdminPadding>
  );
}
