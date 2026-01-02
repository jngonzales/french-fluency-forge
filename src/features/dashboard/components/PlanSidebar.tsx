/**
 * Plan Sidebar Component
 * Shows plan-gated features with lock icons
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Check } from 'lucide-react';
import type { PlanKey, PlanFeatures } from '../types';

interface PlanSidebarProps {
  plan: PlanKey;
  features: PlanFeatures;
}

const FEATURE_LIST = [
  { key: 'phrases', label: 'Phrases' },
  { key: 'fluencyAnalyzer', label: 'Fluency Analyzer' },
  { key: 'aiTutor', label: 'AI Tutor' },
  { key: 'groupCoaching', label: 'Group Coaching' },
  { key: 'groupConversations', label: 'Group Conversation Sessions' },
  { key: 'oneOnOneCoaching', label: '1:1 Conversation Coaching' },
] as const;

export function PlanSidebar({ plan, features }: PlanSidebarProps) {
  const planNames: Record<PlanKey, string> = {
    '3090': '30/90 Challenge',
    'continuity': 'Continuity',
    'software': 'Software Only',
  };

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle className="text-lg">Your Plan</CardTitle>
        <p className="text-sm text-muted-foreground">{planNames[plan]}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {FEATURE_LIST.map((feature) => {
          const isUnlocked = features[feature.key as keyof PlanFeatures];
          
          return (
            <div
              key={feature.key}
              className={`flex items-center justify-between p-2 rounded-md ${
                isUnlocked ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              <span className="text-sm">{feature.label}</span>
              {isUnlocked ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
            </div>
          );
        })}

        <Button variant="outline" className="w-full mt-4" disabled>
          Explore upgrades
        </Button>
      </CardContent>
    </Card>
  );
}

