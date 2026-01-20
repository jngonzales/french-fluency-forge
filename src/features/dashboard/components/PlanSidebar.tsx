/**
 * Plan Sidebar Component
 * Shows plan-gated features with lock icons
 */

import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, BookOpen, Mic2, MessageSquare, Users, GraduationCap, UserCircle } from 'lucide-react';
import type { PlanKey, PlanFeatures } from '../types';

interface PlanSidebarProps {
  plan: PlanKey;
  features: PlanFeatures;
}

// Reordered: Group Coaching → 1:1 Coaching → Group Conversations → AI Tutor → Speaking Assessment → Phrases
// NOTE: Hidden for v0 demo: groupCoaching, oneOnOneCoaching, groupConversations, aiTutor (not demo-ready)
const FEATURE_LIST = [
  // { key: 'groupCoaching', label: 'Group Coaching Sessions', icon: GraduationCap }, // Hidden for demo
  // { key: 'oneOnOneCoaching', label: '1:1 Conversation Coaching', icon: UserCircle }, // Hidden for demo
  // { key: 'groupConversations', label: 'Group Conversation Sessions', icon: Users }, // Hidden for demo
  // { key: 'aiTutor', label: 'AI Tutor', icon: MessageSquare }, // Hidden for demo
  { key: 'fluencyAnalyzer', label: 'Speaking Assessment', icon: Mic2 },
  { key: 'phrases', label: 'My Phrases', icon: BookOpen },
] as const;

export function PlanSidebar({ plan, features }: PlanSidebarProps) {
  const navigate = useNavigate();
  
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
            // For v0 demo, all visible features (phrases, fluencyAnalyzer) are always unlocked
            const Icon = feature.icon;
            
            return (
              <button
                key={feature.key}
                onClick={() => {
                  if (feature.key === 'phrases') {
                    navigate('/phrases');
                  } else if (feature.key === 'fluencyAnalyzer') {
                    navigate('/speaking-assessment');
                  }
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group hover:bg-primary/5 text-foreground cursor-pointer hover:translate-x-1"
              >
                <div className="p-2 rounded-md flex-shrink-0 bg-primary/10 text-primary">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-left flex-1">{feature.label}</span>
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

