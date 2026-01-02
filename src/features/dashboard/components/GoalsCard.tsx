/**
 * Goals Manager Card
 * List and create/edit goals
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GoalDialog } from './GoalDialog';
import { Plus, Lock, Target, TrendingUp, FileText, Settings } from 'lucide-react';
import type { Goal } from '../types';

interface GoalsCardProps {
  goals: Goal[];
  onAddGoal: (goal: Goal) => void;
  onUpdateGoal: (goalId: string, updates: Partial<Goal>) => void;
  onGoalSelect: (goalId: string | null) => void;
  selectedGoalId: string | null;
}

export function GoalsCard({
  goals,
  onAddGoal,
  onUpdateGoal,
  onGoalSelect,
  selectedGoalId,
}: GoalsCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>();

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingGoal(undefined);
    setDialogOpen(true);
  };

  const handleSave = (goal: Goal) => {
    if (editingGoal) {
      onUpdateGoal(goal.id, goal);
    } else {
      onAddGoal(goal);
    }
    setDialogOpen(false);
    setEditingGoal(undefined);
  };

  const getGoalIcon = (type: Goal['type']) => {
    switch (type) {
      case 'skill':
        return <Target className="w-4 h-4" />;
      case 'volume':
        return <TrendingUp className="w-4 h-4" />;
      case 'freeform':
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <>
      <Card className="border-border bg-card shadow-sm overflow-hidden w-full">
        <CardHeader className="pb-4 bg-muted/30 border-b border-border/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="text-xl font-serif">Outcome Goals</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Real-world milestones you're working towards</p>
            </div>
            <Button onClick={handleCreate} size="sm" variant="ghost" className="hover:bg-primary/10 hover:text-primary shrink-0 self-start sm:self-auto">
              <Plus className="w-4 h-4 mr-2" />
              Lock-in New Goal
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {goals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
              <p className="font-medium">Define a clear real-world outcome to maintain momentum</p>
              <Button variant="outline" onClick={handleCreate} className="mt-4">
                Set Your First Goal
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goals.map((goal) => {
                const isSelected = selectedGoalId === goal.id;
                const daysUntilDeadline = Math.ceil(
                  (new Date(goal.deadline).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                );

                return (
                  <div
                    key={goal.id}
                    className={`p-5 border rounded-2xl cursor-pointer transition-all duration-300 relative group ${
                      isSelected 
                        ? 'border-primary bg-primary/[0.03] shadow-md ring-1 ring-primary/20' 
                        : 'border-border/60 hover:border-primary/40 hover:bg-muted/30'
                    }`}
                    onClick={() => onGoalSelect(isSelected ? null : goal.id)}
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-primary text-white' : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors'}`}>
                            {getGoalIcon(goal.type)}
                          </div>
                          <h4 className="font-bold text-sm sm:text-base leading-tight truncate">{goal.name}</h4>
                          {goal.locked && (
                            <Lock className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(goal);
                          }}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <p className="text-sm text-muted-foreground/80 leading-relaxed line-clamp-2">
                        {goal.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-2">
                        {goal.type === 'skill' && goal.dimension && (
                          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-white/50 border-primary/20 text-primary whitespace-nowrap">
                            {goal.dimension} {goal.targetScore}%
                          </Badge>
                        )}
                        <Badge
                          variant={daysUntilDeadline < 7 ? 'destructive' : 'secondary'}
                          className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
                        >
                          {daysUntilDeadline > 0
                            ? `${daysUntilDeadline} days to go`
                            : 'Final deadline'}
                        </Badge>
                      </div>
                      
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <GoalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        goal={editingGoal}
        onSave={handleSave}
      />
    </>
  );
}

