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
import { PlanSidebar } from '@/features/dashboard/components/PlanSidebar';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import type { MetricKey, TimeRange } from '@/features/dashboard/types';

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
              <div>
                <h1 className="text-3xl font-bold">Progress Hub</h1>
                <p className="text-muted-foreground">Welcome back, {memberName}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">{data.member.plan}</Badge>
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
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem disabled>Account</DropdownMenuItem>
                    <DropdownMenuItem disabled>Logout</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        {/* Main Layout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Sidebar */}
            <aside className="w-full lg:w-80 flex-shrink-0 space-y-8">
              <PlanSidebar plan={data.member.plan} features={data.member.features} />
              
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
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 space-y-8">
              {/* Daily Momentum */}
              <HabitGridCard
                habits={habits}
                habitGrid={habitGrid}
                range={selectedRange}
                onCellToggle={actions.updateHabitCell}
                onAddHabit={actions.addHabit}
                onBadgeUnlock={actions.unlockBadge}
              />

              {/* Progress Journey */}
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

              {/* Phrase Stats */}
              <PhraseStatsCard phrases={data.phrases} />
            </main>
          </div>
        </div>
      </div>
    </AdminPadding>
  );
}

