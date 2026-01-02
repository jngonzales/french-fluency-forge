/**
 * Phrase Stats Card
 * Anki-inspired recall vs recognition (anti-school: "phrases" not "flashcards")
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Brain } from 'lucide-react';
import type { PhraseStats } from '../types';

interface PhraseStatsCardProps {
  phrases: PhraseStats;
}

export function PhraseStatsCard({ phrases }: PhraseStatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Phrases</CardTitle>
        <p className="text-sm text-muted-foreground">
          Your active and passive vocabulary
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recall (Active) */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            <h4 className="font-medium">Recall (Active)</h4>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <p className="text-muted-foreground">Learning</p>
              <p className="text-xl font-bold">{phrases.recall.learning}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Known</p>
              <p className="text-xl font-bold text-green-600">{phrases.recall.known}</p>
            </div>
            <div>
              <p className="text-muted-foreground">New</p>
              <p className="text-xl font-bold">{phrases.recall.new}</p>
            </div>
          </div>
          <Progress value={phrases.recall.progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">
            {phrases.recall.progress}% mastered
          </p>
        </div>

        {/* Recognition (Passive) */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <h4 className="font-medium">Recognition (Passive)</h4>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <p className="text-muted-foreground">Learning</p>
              <p className="text-xl font-bold">{phrases.recognition.learning}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Known</p>
              <p className="text-xl font-bold text-green-600">{phrases.recognition.known}</p>
            </div>
            <div>
              <p className="text-muted-foreground">New</p>
              <p className="text-xl font-bold">{phrases.recognition.new}</p>
            </div>
          </div>
          <Progress value={phrases.recognition.progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">
            {phrases.recognition.progress}% mastered
          </p>
        </div>

        {/* Vocabulary Estimates */}
        <div className="pt-4 border-t border-border">
          <h4 className="font-medium mb-3 text-sm">Vocabulary Estimates</h4>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{phrases.vocabulary.activeSize}</p>
              <p className="text-xs text-muted-foreground">Active words</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{phrases.vocabulary.passiveSize}</p>
              <p className="text-xs text-muted-foreground">Passive words</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

