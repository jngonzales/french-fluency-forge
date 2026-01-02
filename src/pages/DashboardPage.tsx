/**
 * Member Dashboard / Progress Hub
 * Shows progress, habits, goals, and gamification
 */

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
const FEATURE_LIST = [
  { key: 'groupCoaching', label: 'Group Coaching Sessions', icon: GraduationCap },
  { key: 'oneOnOneCoaching', label: '1:1 Conversation Coaching', icon: UserCircle },
  { key: 'groupConversations', label: 'Group Conversation Sessions', icon: Users },
  { key: 'aiTutor', label: 'AI Tutor', icon: MessageSquare },
  { key: 'fluencyAnalyzer', label: 'My Fluency Analyzer', icon: Mic2 },
  { key: 'phrases', label: 'My Phrases', icon: BookOpen },
] as const;

const planNames: Record<PlanKey, string> = {
  '3090': '30/90 Challenge',
  'continuity': 'Continuity',
  'software': 'Software Only',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { isAdmin } = useAdminMode();
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
        <div className="flex items-center justify-center min-h-screen">
          <p>Loading dashboard...</p>
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
      <div className="min-h-screen bg-background overflow-x-hidden">
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
                        const isUnlocked = data.member.features[feature.key as keyof PlanFeatures];
                        const Icon = feature.icon;
                        
                        return (
                          <button
                            key={feature.key}
                            disabled={!isUnlocked}
                            onClick={() => {
                              if (isUnlocked) {
                                console.log(`Navigate to ${feature.key}`);
                                setResourcesOpen(false);
                              }
                            }}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group ${
                              isUnlocked 
                                ? 'hover:bg-primary/5 text-foreground cursor-pointer hover:translate-x-1' 
                                : 'opacity-50 cursor-not-allowed'
                            }`}
                          >
                            <div className={`p-2 rounded-md flex-shrink-0 ${isUnlocked ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium text-left flex-1">{feature.label}</span>
                            {!isUnlocked && <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
                          </button>
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
                    <DropdownMenuItem disabled>Logout</DropdownMenuItem>
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

          {/* Daily Momentum */}
          <HabitGridCard
            habits={habits}
            habitGrid={habitGrid}
            range={selectedRange}
            onCellToggle={actions.updateHabitCell}
            onAddHabit={actions.addHabit}
            onBadgeUnlock={actions.unlockBadge}
          />

          {/* Skill Profile */}
          <RadarCard
            baseline={data.assessments.baseline}
            current={data.assessments.current}
          />

          {/* Outcome Goals */}
          <GoalsCard
            goals={goals}
            onAddGoal={actions.addGoal}
            onUpdateGoal={actions.updateGoal}
            onGoalSelect={setSelectedGoalId}
            selectedGoalId={selectedGoalId}
          />

          {/* Achievements */}
          <BadgesCard
            badges={badges}
            points={data.points}
            onUnlock={actions.unlockBadge}
            isAdmin={isAdmin}
          />

          {/* Phrase Stats */}
          <PhraseStatsCard phrases={data.phrases} />
        </main>
      </div>
    </AdminPadding>
  );
}
