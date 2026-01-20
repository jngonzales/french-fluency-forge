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
import { Plus, Flame, Settings, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { calculateCurrentStreak } from '../data/mockData';
import { getLocalToday, getLocalDateRange, isDateFuture } from '@/lib/dateUtils';
import type { Habit, HabitCell, HabitFrequency, HabitCellStatus, TimeRange } from '../types';

interface HabitGridCardProps {
  habits: Habit[];
  habitGrid: HabitCell[];
  range: TimeRange;
  onCellToggle: (habitId: string, date: string, status: HabitCellStatus, intensity?: number) => void;
  onAddHabit: (habit: Habit) => void;
  onUpdateHabit?: (habitId: string, updates: Partial<Habit>) => void;
  onDeleteHabit?: (habitId: string) => void;
  onBadgeUnlock: (badgeId: string) => void;
}

export function HabitGridCard({
  habits,
  habitGrid,
  range,
  onCellToggle,
  onAddHabit,
  onUpdateHabit,
  onDeleteHabit,
  onBadgeUnlock,
}: HabitGridCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitFrequency, setNewHabitFrequency] = useState<HabitFrequency>('daily');
  
  // Edit habit state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [editHabitName, setEditHabitName] = useState('');
  const [editHabitFrequency, setEditHabitFrequency] = useState<HabitFrequency>('daily');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setEditHabitName(habit.name);
    setEditHabitFrequency(habit.frequency);
    setShowDeleteConfirm(false);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingHabit || !editHabitName.trim() || !onUpdateHabit) return;
    
    onUpdateHabit(editingHabit.id, {
      name: editHabitName.trim(),
      frequency: editHabitFrequency,
    });
    
    setEditDialogOpen(false);
    setEditingHabit(null);
    toast.success('Practice updated!');
  };

  const handleDeleteHabit = () => {
    if (!editingHabit || !onDeleteHabit) return;
    
    onDeleteHabit(editingHabit.id);
    setEditDialogOpen(false);
    setEditingHabit(null);
    setShowDeleteConfirm(false);
    toast.success('Practice removed from tracker');
  };

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
  // Use local timezone dates (not UTC)
  const dates: string[] = getLocalDateRange(daysCount);
  const todayStr = getLocalToday();

  const handleCellClick = (habitId: string, date: string, currentStatus: HabitCellStatus) => {
    if (isDateFuture(date)) {
      toast.error("You can't track future progress yet!");
      return;
    }

    // Cycle through states: na → done → missed → na
    let newStatus: HabitCellStatus;
    let intensity: number | undefined;

    switch (currentStatus) {
      case 'na':
        newStatus = 'done';
        intensity = 1; // Fixed intensity - solid green
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

    // Life Demonstration Feature: Logic for 3-day streak unlock
    if (newStatus === 'done') {
      // Find the habit grid cells for this habit
      const habitCells = habitGrid
        .filter(c => c.habitId === habitId)
        .sort((a, b) => b.date.localeCompare(a.date));
      
      // Update the current cell status in our local copy for checking
      const updatedCells = habitCells.map(c => 
        c.date === date ? { ...c, status: newStatus } : c
      );

      // Check for 3 days in a row (including today/the clicked day)
      let hasThreeDayStreak = false;
      
      // Sort all "done" cells by date
      const doneDates = updatedCells
        .filter(c => c.status === 'done')
        .map(c => c.date)
        .sort((a, b) => b.localeCompare(a));

      for (let i = 0; i < doneDates.length - 2; i++) {
        const d1 = new Date(doneDates[i]);
        const d2 = new Date(doneDates[i+1]);
        const d3 = new Date(doneDates[i+2]);
        
        const diff1 = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
        const diff2 = Math.round((d3.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diff1 === 1 && diff2 === 1) {
          hasThreeDayStreak = true;
          break;
        }
      }

      if (hasThreeDayStreak) {
        onBadgeUnlock('badge-streak-3');
        toast.success('🎉 3-Day Streak Unlock!', {
          description: "You've been consistent for 3 days! Momentum is building.",
        });
      }
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
    setDialogOpen(false);
    setNewHabitName('');
    setNewHabitFrequency('daily');
    
    toast.success('Practice added to your momentum tracker!');
  };

  const getCellColor = (status: HabitCellStatus, _intensity?: number) => {
    switch (status) {
      case 'done':
        return 'rgb(34, 197, 94)'; // solid green
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
      <Card className="border-border bg-card shadow-sm overflow-hidden w-full">
        <CardHeader className="pb-4 bg-muted/30 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-serif">Daily Momentum</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                  <Flame className="w-3 h-3 fill-orange-500" />
                  <span className="text-xs font-bold uppercase tracking-tight">
                    {currentStreak} day streak
                  </span>
                </div>
              </div>
            </div>
            <Button onClick={() => setDialogOpen(true)} size="sm" variant="ghost" className="hover:bg-primary/10 hover:text-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Practice
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {habits.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
              <p className="font-medium">Build consistency by tracking your daily practices</p>
              <Button variant="outline" onClick={() => setDialogOpen(true)} className="mt-4">
                Set Your First Habit
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto pb-4 custom-scrollbar">
              <div className="inline-block min-w-full px-1">
                {/* Day Headers */}
                <div className="flex mb-3">
                  <div className="w-52 flex-shrink-0 pr-4" />
                  {dates.map((date) => {
                    const d = new Date(date + 'T12:00:00'); // Parse as noon local to avoid timezone shift
                    const isToday = date === todayStr;
                    return (
                      <div
                        key={date}
                        className={`w-6 text-center text-[10px] font-bold uppercase tracking-tighter flex-shrink-0 ${
                          isToday ? 'text-primary' : 'text-muted-foreground/60'
                        }`}
                      >
                        {d.getDate()}
                      </div>
                    );
                  })}
                </div>

                {/* Habit Rows */}
                {habits.map((habit) => (
                  <div key={habit.id} className="flex items-center mb-3 group/row">
                    <div className="w-52 flex-shrink-0 pr-4 flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground leading-tight truncate" title={habit.name}>
                          {habit.name}
                        </p>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 mt-1 h-4">
                          {habit.frequency}
                        </Badge>
                      </div>
                      {/* Edit button - appears on hover */}
                      {onUpdateHabit && onDeleteHabit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover/row:opacity-100 transition-opacity shrink-0"
                          onClick={() => handleEditHabit(habit)}
                        >
                          <Settings className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {dates.map((date) => {
                        const cell = habitGrid.find(
                          (c) => c.habitId === habit.id && c.date === date
                        );
                        const status = cell?.status || 'na';

                        return (
                          <div
                            key={date}
                            className="w-5 h-5 flex-shrink-0 cursor-pointer transition-all hover:scale-125 hover:z-10"
                            onClick={() => handleCellClick(habit.id, date, status)}
                            title={`${date}: ${status}`}
                          >
                            <div
                              className="w-full h-full rounded-sm border border-border/30 transition-all duration-150 hover:border-border"
                              style={{
                                backgroundColor: getCellColor(status, cell?.intensity),
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
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
            <DialogTitle>Add Practice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="habitName">Practice Name</Label>
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
              Add Practice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Habit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Practice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editHabitName">Practice Name</Label>
              <Input
                id="editHabitName"
                value={editHabitName}
                onChange={(e) => setEditHabitName(e.target.value)}
                placeholder="e.g., Morning phrases session"
              />
            </div>
            <div>
              <Label htmlFor="editFrequency">Frequency</Label>
              <Select
                value={editHabitFrequency}
                onValueChange={(v) => setEditHabitFrequency(v as HabitFrequency)}
              >
                <SelectTrigger id="editFrequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {/* Delete button */}
            <div className="flex-1 flex justify-start">
              {showDeleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-destructive">Delete this practice?</span>
                  <Button variant="destructive" size="sm" onClick={handleDeleteHabit}>
                    Yes, delete
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={!editHabitName.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

