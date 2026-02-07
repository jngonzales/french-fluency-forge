/**
 * Member Dashboard - "Grandparent-Proof" Design
 * Simplified layout with big buttons and clear navigation
 * Target: Seniors (60-80+)
 */

import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardData } from '@/features/dashboard/hooks/useDashboardData';
import { AdminPadding } from '@/components/AdminPadding';
import { GoalsCard } from '@/features/dashboard/components/GoalsCard';
import { FlashcardStatsCard } from '@/features/dashboard/components/FlashcardStatsCard';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton, CardSkeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Mic2, BookOpen, Calendar, ArrowLeft, Eye } from 'lucide-react';

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const viewingMemberId = searchParams.get('memberId') || undefined;

  const { data, loading, error, goals, actions } =
    useDashboardData(viewingMemberId);

  if (!user) {
    return (
      <AdminPadding>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-xl">Please sign in to view your dashboard.</p>
        </div>
      </AdminPadding>
    );
  }

  if (loading.assessments && !data) {
    return (
      <AdminPadding>
        <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-16 w-64 mx-auto" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </AdminPadding>
    );
  }

  if (error) {
    return (
      <AdminPadding>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-destructive text-xl">{error}</p>
        </div>
      </AdminPadding>
    );
  }

  if (!data) {
    return null;
  }

  const memberName = data.member.name || 'Member';
  const isViewingOther = !!viewingMemberId && viewingMemberId !== user?.id;

  return (
    <AdminPadding>
      <div className="min-h-screen bg-background">
        {/* Admin Viewing Banner */}
        {isViewingOther && (
          <div className="bg-amber-100 dark:bg-amber-900/30 border-b border-amber-300 dark:border-amber-700 px-4 py-2">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 text-sm font-medium">
                <Eye className="h-4 w-4" />
                <span>Admin view — Viewing {memberName}'s dashboard</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/admin/users/${viewingMemberId}`)}
                className="h-7 text-xs text-amber-800 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-800"
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                Back to User
              </Button>
            </div>
          </div>
        )}
        {/* Simple Header */}
        <header className="border-b border-border bg-card">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Welcome, {memberName}</h1>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-12 w-12">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="text-lg">
                        {memberName[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover">
                  <DropdownMenuItem 
                    onClick={signOut} 
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950 text-lg py-3"
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
          
          {/* OUTCOME GOALS - Moved to TOP as primary motivator */}
          <GoalsCard
            goals={goals}
            onAddGoal={actions.addGoal}
            onUpdateGoal={actions.updateGoal}
            onDeleteGoal={actions.deleteGoal}
            onGoalSelect={() => {}}
            selectedGoalId={null}
          />

          {/* BIG ACTION BUTTONS - 3 Huge, High-Contrast Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Speaking Assessment Button */}
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 border-primary/20 hover:border-primary bg-primary/5"
              onClick={() => navigate(viewingMemberId ? `/speaking-assessment?memberId=${viewingMemberId}` : '/speaking-assessment')}
            >
              <CardContent className="flex flex-col items-center justify-center py-12 px-6">
                <div className="bg-primary text-primary-foreground rounded-full p-6 mb-4">
                  <Mic2 className="h-12 w-12" />
                </div>
                <h2 className="text-2xl font-bold text-center mb-2">
                  Speaking Assessment
                </h2>
                <p className="text-muted-foreground text-center text-lg">
                  Test your speaking skills
                </p>
              </CardContent>
            </Card>

            {/* Flashcards Button */}
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 border-green-500/20 hover:border-green-500 bg-green-50 dark:bg-green-950/30"
              onClick={() => navigate(viewingMemberId ? `/phrases?memberId=${viewingMemberId}` : '/phrases')}
            >
              <CardContent className="flex flex-col items-center justify-center py-12 px-6">
                <div className="bg-green-600 text-white rounded-full p-6 mb-4">
                  <BookOpen className="h-12 w-12" />
                </div>
                <h2 className="text-2xl font-bold text-center mb-2">
                  Flashcards
                </h2>
                <p className="text-muted-foreground text-center text-lg">
                  Practice your vocabulary
                </p>
              </CardContent>
            </Card>

            {/* Book Lesson Button (Dummy for now) */}
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 border-blue-500/20 hover:border-blue-500 bg-blue-50 dark:bg-blue-950/30"
              onClick={() => {
                // Dummy action for now - will be implemented later
                alert('Booking feature coming soon! Contact support@solvlanguages.com to schedule a lesson.');
              }}
            >
              <CardContent className="flex flex-col items-center justify-center py-12 px-6">
                <div className="bg-blue-600 text-white rounded-full p-6 mb-4">
                  <Calendar className="h-12 w-12" />
                </div>
                <h2 className="text-2xl font-bold text-center mb-2">
                  Book Lesson
                </h2>
                <p className="text-muted-foreground text-center text-lg">
                  Schedule with a tutor
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Flashcard Stats - Scheduled vs Learned (simplified metrics) */}
          <FlashcardStatsCard memberId={viewingMemberId} />
          
        </main>
      </div>
    </AdminPadding>
  );
}
