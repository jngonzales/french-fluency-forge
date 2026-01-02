/**
 * Phrase Stats Card
 * Anki-inspired recall vs recognition (anti-school: "phrases" not "flashcards")
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Headphones, Mic2 } from 'lucide-react';
import type { PhraseStats } from '../types';

interface PhraseStatsCardProps {
  phrases: PhraseStats;
}

export function PhraseStatsCard({ phrases }: PhraseStatsCardProps) {
  return (
    <Card className="border-border bg-card shadow-sm h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-serif">Phrase Mastery</CardTitle>
        <p className="text-sm text-muted-foreground">
          Active production vs passive understanding
        </p>
      </CardHeader>
      <CardContent className="space-y-8 pt-4">
        {/* Recall (Active) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-orange-100 text-orange-600">
              <Mic2 className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-sm uppercase tracking-wider">Recall (Active Production)</h4>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase text-foreground">New</p>
              <p className="text-2xl font-black text-foreground">{phrases.recall.new}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase text-orange-500">Learning</p>
              <p className="text-2xl font-black text-orange-500">{phrases.recall.learning}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase text-green-600">Known</p>
              <p className="text-2xl font-black text-green-600">{phrases.recall.known}</p>
            </div>
          </div>
          <div className="space-y-1">
            <Progress value={phrases.recall.progress} className="h-1.5" />
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
              <span>0%</span>
              <span className="text-primary">{phrases.recall.progress}% mastery</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Recognition (Passive) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-blue-100 text-blue-600">
              <Headphones className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-sm uppercase tracking-wider">Recognition (Passive Understanding)</h4>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase text-foreground">New</p>
              <p className="text-2xl font-black text-foreground">{phrases.recognition.new}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase text-orange-500">Learning</p>
              <p className="text-2xl font-black text-orange-500">{phrases.recognition.learning}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase text-green-600">Known</p>
              <p className="text-2xl font-black text-green-600">{phrases.recognition.known}</p>
            </div>
          </div>
          <div className="space-y-1">
            <Progress value={phrases.recognition.progress} className="h-1.5" />
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
              <span>0%</span>
              <span className="text-primary">{phrases.recognition.progress}% mastery</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Vocabulary Estimates */}
        <div className="pt-6 border-t border-border/60">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/30 p-4 rounded-xl border border-border/40 text-center">
              <p className="text-3xl font-black text-primary leading-none">{phrases.vocabulary.activeSize}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2">Active Vocab</p>
            </div>
            <div className="bg-muted/30 p-4 rounded-xl border border-border/40 text-center">
              <p className="text-3xl font-black text-primary leading-none">{phrases.vocabulary.passiveSize}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2">Passive Vocab</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

