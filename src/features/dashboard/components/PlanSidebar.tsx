/**
 * Plan Sidebar Component
 * Shows plan-gated features with lock icons
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, BookOpen, Mic2, MessageSquare, Users, GraduationCap, UserCircle } from 'lucide-react';
import type { PlanKey, PlanFeatures } from '../types';

interface PlanSidebarProps {
  plan: PlanKey;
  features: PlanFeatures;
}

// Reordered: Group Coaching → 1:1 Coaching → Group Conversations → AI Tutor → Fluency Analyzer → Phrases
const FEATURE_LIST = [
  { key: 'groupCoaching', label: 'Group Coaching Sessions', icon: GraduationCap },
  { key: 'oneOnOneCoaching', label: '1:1 Conversation Coaching', icon: UserCircle },
  { key: 'groupConversations', label: 'Group Conversation Sessions', icon: Users },
  { key: 'aiTutor', label: 'AI Tutor', icon: MessageSquare },
  { key: 'fluencyAnalyzer', label: 'My Fluency Analyzer', icon: Mic2 },
  { key: 'phrases', label: 'My Phrases', icon: BookOpen },
] as const;

export function PlanSidebar({ plan, features }: PlanSidebarProps) {
  const planNames: Record<PlanKey, string> = {
    '3090': '30/90 Challenge',
    'continuity': 'Continuity',
    'software': 'Software Only',
  };

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-serif">Your Plan</CardTitle>
          <p className="text-sm text-muted-foreground font-medium">{planNames[plan]}</p>
        </CardHeader>
        <CardContent className="space-y-1 px-2">
          {FEATURE_LIST.map((feature) => {
            const isUnlocked = features[feature.key as keyof PlanFeatures];
            const Icon = feature.icon;
            
            return (
              <button
                key={feature.key}
                disabled={!isUnlocked}
                onClick={() => {
                  if (isUnlocked) {
                    // TODO: Navigate to feature page
                    console.log(`Navigate to ${feature.key}`);
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
        </CardContent>
      </Card>
      
      <Button variant="outline" className="w-full border-dashed hover:border-primary hover:text-primary transition-all duration-300 py-6" disabled>
        Upgrade Your Access
      </Button>
    </div>
  );
}

