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
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Badge } from '../types';

interface BadgesCardProps {
  badges: Badge[];
  points: number;
  onUnlock: (badgeId: string) => void;
  isAdmin: boolean;
}

const ICON_MAP: Record<string, { icon: React.ComponentType<any>, bgColor: string, iconColor: string }> = {
  CheckCircle: { icon: CheckCircle, bgColor: 'bg-gradient-to-br from-green-400 to-emerald-600', iconColor: 'text-white' },
  Target: { icon: Target, bgColor: 'bg-gradient-to-br from-blue-400 to-cyan-600', iconColor: 'text-white' },
  Flame: { icon: Flame, bgColor: 'bg-gradient-to-br from-orange-400 to-red-600', iconColor: 'text-white' },
  Zap: { icon: Zap, bgColor: 'bg-gradient-to-br from-yellow-400 to-amber-600', iconColor: 'text-white' },
  Trophy: { icon: Trophy, bgColor: 'bg-gradient-to-br from-amber-400 to-yellow-600', iconColor: 'text-white' },
  Crown: { icon: Crown, bgColor: 'bg-gradient-to-br from-purple-400 to-pink-600', iconColor: 'text-white' },
  BookOpen: { icon: BookOpen, bgColor: 'bg-gradient-to-br from-emerald-400 to-teal-600', iconColor: 'text-white' },
  MessageCircle: { icon: MessageCircle, bgColor: 'bg-gradient-to-br from-indigo-400 to-blue-600', iconColor: 'text-white' },
  TrendingUp: { icon: TrendingUp, bgColor: 'bg-gradient-to-br from-rose-400 to-pink-600', iconColor: 'text-white' },
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
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-serif">Achievements</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {unlockedCount} of {badges.length} badges earned
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-4xl font-black text-primary leading-none">{points}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Total Points</p>
            </div>
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem disabled className="text-xs font-bold uppercase tracking-widest">
                    Demo Tools
                  </DropdownMenuItem>
                  {badges
                    .filter((b) => !b.unlocked)
                    .map((badge) => (
                      <DropdownMenuItem
                        key={badge.id}
                        onClick={() => handleDemoUnlock(badge.id)}
                        className="text-xs"
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {badges.map((badge) => {
            const iconConfig = ICON_MAP[badge.icon] || { icon: Lock, bgColor: 'bg-muted', iconColor: 'text-muted-foreground' };
            const IconComponent = iconConfig.icon;

            return (
              <motion.div
                key={badge.id}
                initial={false}
                animate={
                  badge.unlocked
                    ? { scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }
                    : {}
                }
                transition={{ duration: 0.5 }}
                className={`group relative flex flex-col items-center gap-3 p-4 rounded-xl border transition-all duration-300 ${
                  badge.unlocked
                    ? 'border-magenta/20 bg-magenta/[0.02] shadow-sm hover:shadow-md'
                    : 'border-border/40 bg-muted/20 opacity-60'
                }`}
              >
                <div
                  className={`w-16 h-16 rounded-xl flex items-center justify-center transition-all duration-500 shadow-lg ${
                    badge.unlocked
                      ? `${iconConfig.bgColor} ${iconConfig.iconColor}`
                      : 'bg-muted/50 text-muted-foreground/40'
                  }`}
                >
                  <IconComponent className={`w-8 h-8 ${badge.unlocked ? 'drop-shadow-md' : ''}`} />
                </div>
                
                <div className="text-center space-y-1.5 w-full">
                  <p className={`text-xs font-bold ${badge.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {badge.name}
                  </p>
                  <p className="text-[10px] font-semibold text-muted-foreground/80">
                    {badge.points} pts
                  </p>
                  {badge.unlocked && badge.unlockedAt && (
                    <p className="text-[9px] text-muted-foreground/60 mt-1">
                      {new Date(badge.unlockedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </div>

                {badge.unlocked && (
                  <div className="absolute top-2 right-2">
                    <div className="bg-green-500 text-white rounded-full p-1 shadow-md flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

