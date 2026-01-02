/**
 * Goals Manager Card
 * List and create/edit goals
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GoalDialog } from './GoalDialog';
import { Plus, Lock, Target, TrendingUp, FileText } from 'lucide-react';
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Goals</CardTitle>
            <Button onClick={handleCreate} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Create Goal
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Pick a real-world outcome and lock it in</p>
              <Button variant="outline" onClick={handleCreate} className="mt-4">
                Create Your First Goal
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {goals.map((goal) => {
                const isSelected = selectedGoalId === goal.id;
                const daysUntilDeadline = Math.ceil(
                  (new Date(goal.deadline).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                );

                return (
                  <div
                    key={goal.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'
                    }`}
                    onClick={() => onGoalSelect(isSelected ? null : goal.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getGoalIcon(goal.type)}
                          <h4 className="font-medium">{goal.name}</h4>
                          {goal.locked && (
                            <Lock className="w-3 h-3 text-muted-foreground" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {goal.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {goal.type}
                          </Badge>
                          {goal.type === 'skill' && goal.dimension && (
                            <Badge variant="outline" className="text-xs">
                              {goal.dimension}: {goal.targetScore}/100
                            </Badge>
                          )}
                          {goal.type === 'volume' && goal.metric && (
                            <Badge variant="outline" className="text-xs">
                              {goal.metric}: {goal.targetValue}
                            </Badge>
                          )}
                          <Badge
                            variant={daysUntilDeadline < 7 ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {daysUntilDeadline > 0
                              ? `${daysUntilDeadline} days left`
                              : 'Overdue'}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(goal);
                        }}
                      >
                        {goal.locked ? 'View' : 'Edit'}
                      </Button>
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

