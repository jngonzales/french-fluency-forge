/**
 * Habit Tracker Grid Card
 * Custom grid with clickable cells and streak tracking
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Flame } from 'lucide-react';
import { toast } from 'sonner';
import { calculateCurrentStreak } from '../data/mockData';
import type { Habit, HabitCell, HabitFrequency, HabitCellStatus, TimeRange } from '../types';

interface HabitGridCardProps {
  habits: Habit[];
  habitGrid: HabitCell[];
  range: TimeRange;
  onCellToggle: (habitId: string, date: string, status: HabitCellStatus, intensity?: number) => void;
  onAddHabit: (habit: Habit) => void;
  onBadgeUnlock: (badgeId: string) => void;
}

export function HabitGridCard({
  habits,
  habitGrid,
  range,
  onCellToggle,
  onAddHabit,
  onBadgeUnlock,
}: HabitGridCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitFrequency, setNewHabitFrequency] = useState<HabitFrequency>('daily');

  // Get days to show based on range
  const getDaysCount = () => {
    switch (range) {
      case '7d':
        return 7;
      case '30d':
        return 30;
      case '90d':
        return 90;
      default:
        return 30;
    }
  };

  const daysCount = getDaysCount();
  const today = new Date();
  const dates: string[] = [];

  for (let i = daysCount - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }

  const handleCellClick = (habitId: string, date: string, currentStatus: HabitCellStatus) => {
    const isToday = date === today.toISOString().split('T')[0];
    const isFuture = new Date(date) > today;

    if (isFuture && !isToday) {
      return; // Can't toggle future dates
    }

    // Cycle through states: na → done → missed → na
    let newStatus: HabitCellStatus;
    let intensity: number | undefined;

    switch (currentStatus) {
      case 'na':
        newStatus = 'done';
        intensity = Math.floor(Math.random() * 6) + 1; // Random intensity for demo
        break;
      case 'done':
        newStatus = 'missed';
        intensity = undefined;
        break;
      case 'missed':
        newStatus = 'na';
        intensity = undefined;
        break;
      default:
        newStatus = 'na';
    }

    onCellToggle(habitId, date, newStatus, intensity);

    // Check for streak milestones
    const streak = calculateCurrentStreak(
      habitGrid.map((cell) =>
        cell.habitId === habitId && cell.date === date
          ? { ...cell, status: newStatus, intensity }
          : cell
      )
    );

    if (streak === 7) {
      onBadgeUnlock('badge-streak-7');
      toast.success('🎉 Badge Unlocked: 7-Day Streak!', {
        description: '+150 points',
      });
    } else if (streak === 3) {
      onBadgeUnlock('badge-streak-3');
      toast.success('🎉 Badge Unlocked: 3-Day Streak!', {
        description: '+50 points',
      });
    }
  };

  const handleAddHabit = () => {
    if (!newHabitName.trim()) return;

    const newHabit: Habit = {
      id: `habit-${Date.now()}`,
      name: newHabitName,
      frequency: newHabitFrequency,
      source: 'personal',
      createdAt: new Date().toISOString(),
    };

    onAddHabit(newHabit);
    onBadgeUnlock('badge-habit-created');
    setDialogOpen(false);
    setNewHabitName('');
    setNewHabitFrequency('daily');
    
    toast.success('Habit added!');
  };

  const getCellColor = (status: HabitCellStatus, intensity?: number) => {
    switch (status) {
      case 'done':
        const opacity = intensity ? intensity / 6 : 0.8;
        return `rgba(34, 197, 94, ${opacity})`; // green
      case 'missed':
        return 'rgb(239, 68, 68)'; // red
      case 'na':
        return 'rgb(148, 163, 184)'; // gray
      case 'future':
        return 'rgb(226, 232, 240)'; // light gray
    }
  };

  const currentStreak = calculateCurrentStreak(habitGrid);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Habit Tracker</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Flame className="w-4 h-4 text-orange-500" />
                <p className="text-sm text-muted-foreground">
                  {currentStreak} day streak
                </p>
              </div>
            </div>
            <Button onClick={() => setDialogOpen(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Habit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {habits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Add your first habit and start stacking wins</p>
              <Button variant="outline" onClick={() => setDialogOpen(true)} className="mt-4">
                Add First Habit
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                {/* Day Headers */}
                <div className="flex mb-2">
                  <div className="w-40 flex-shrink-0" /> {/* Habit name column */}
                  {dates.map((date) => {
                    const d = new Date(date);
                    return (
                      <div
                        key={date}
                        className="w-8 text-center text-xs text-muted-foreground flex-shrink-0"
                      >
                        {d.getDate()}
                      </div>
                    );
                  })}
                </div>

                {/* Habit Rows */}
                {habits.map((habit) => (
                  <div key={habit.id} className="flex items-center mb-1">
                    <div className="w-40 flex-shrink-0 pr-2">
                      <p className="text-sm font-medium truncate">{habit.name}</p>
                      <Badge variant="outline" className="text-[10px]">
                        {habit.frequency}
                      </Badge>
                    </div>
                    {dates.map((date) => {
                      const cell = habitGrid.find(
                        (c) => c.habitId === habit.id && c.date === date
                      );
                      const status = cell?.status || 'na';

                      return (
                        <div
                          key={date}
                          className="w-8 h-8 flex-shrink-0 cursor-pointer"
                          onClick={() => handleCellClick(habit.id, date, status)}
                          title={`${date}: ${status}`}
                        >
                          <div
                            className="w-full h-full rounded border border-border hover:border-primary"
                            style={{
                              backgroundColor: getCellColor(status, cell?.intensity),
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Habit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Habit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="habitName">Habit Name</Label>
              <Input
                id="habitName"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                placeholder="e.g., Morning phrases session"
              />
            </div>
            <div>
              <Label htmlFor="frequency">Frequency</Label>
              <Select
                value={newHabitFrequency}
                onValueChange={(v) => setNewHabitFrequency(v as HabitFrequency)}
              >
                <SelectTrigger id="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddHabit} disabled={!newHabitName.trim()}>
              Add Habit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

