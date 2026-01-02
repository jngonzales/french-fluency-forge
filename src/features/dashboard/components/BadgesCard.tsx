/**
 * Badges & Points Card
 * Gamification with unlock animations
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge as BadgeUI } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  Target,
  Flame,
  Zap,
  Trophy,
  Crown,
  BookOpen,
  MessageCircle,
  TrendingUp,
  Lock,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Badge } from '../types';

interface BadgesCardProps {
  badges: Badge[];
  points: number;
  onUnlock: (badgeId: string) => void;
  isAdmin: boolean;
}

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  CheckCircle,
  Target,
  Flame,
  Zap,
  Trophy,
  Crown,
  BookOpen,
  MessageCircle,
  TrendingUp,
};

export function BadgesCard({ badges, points, onUnlock, isAdmin }: BadgesCardProps) {
  const handleDemoUnlock = (badgeId: string) => {
    const badge = badges.find((b) => b.id === badgeId);
    if (!badge) return;

    onUnlock(badgeId);
    toast.success(`🎉 Badge Unlocked: ${badge.name}`, {
      description: `+${badge.points} points`,
    });
  };

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Badges & Points</CardTitle>
            <p className="text-sm text-muted-foreground">
              {unlockedCount} / {badges.length} unlocked
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">{points}</p>
              <p className="text-xs text-muted-foreground">Points</p>
            </div>
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem disabled className="text-xs font-bold">
                    Demo Tools
                  </DropdownMenuItem>
                  {badges
                    .filter((b) => !b.unlocked)
                    .map((badge) => (
                      <DropdownMenuItem
                        key={badge.id}
                        onClick={() => handleDemoUnlock(badge.id)}
                      >
                        Unlock {badge.name}
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {badges.map((badge) => {
            const IconComponent = ICON_MAP[badge.icon] || Lock;

            return (
              <motion.div
                key={badge.id}
                initial={false}
                animate={
                  badge.unlocked
                    ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }
                    : {}
                }
                transition={{ duration: 0.5 }}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border ${
                  badge.unlocked
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-muted/30'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    badge.unlocked
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <IconComponent className="w-6 h-6" />
                </div>
                <p className="text-xs font-medium text-center">{badge.name}</p>
                <p className="text-xs text-muted-foreground text-center">
                  {badge.points} pts
                </p>
                {badge.unlocked && (
                  <BadgeUI variant="secondary" className="text-[10px] px-1 py-0">
                    ✓
                  </BadgeUI>
                )}
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

