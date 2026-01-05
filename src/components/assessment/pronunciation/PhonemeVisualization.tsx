/**
 * Phoneme Visualization Component
 * Interactive phoneme chart with IPA notation and scores
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Check, X, AlertTriangle } from 'lucide-react';

interface PhonemeDetail {
  phoneme: string;
  score: number;
  expected: string;
  actual: string;
  status: 'correct' | 'incorrect' | 'missing';
  quality?: string;
  feedback?: string;
}

interface PhonemeVisualizationProps {
  phonemes: PhonemeDetail[];
  onPhonemeClick?: (phoneme: PhonemeDetail) => void;
}

export function PhonemeVisualization({ phonemes, onPhonemeClick }: PhonemeVisualizationProps) {
  const [selectedPhoneme, setSelectedPhoneme] = useState<PhonemeDetail | null>(null);

  const handlePhonemeClick = (phoneme: PhonemeDetail) => {
    setSelectedPhoneme(phoneme);
    onPhonemeClick?.(phoneme);
  };

  const getPhonemeColor = (score: number) => {
    if (score >= 90) return 'bg-green-500/20 border-green-500 text-green-700 dark:text-green-400';
    if (score >= 75) return 'bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-400';
    if (score >= 50) return 'bg-yellow-500/20 border-yellow-500 text-yellow-700 dark:text-yellow-400';
    return 'bg-red-500/20 border-red-500 text-red-700 dark:text-red-400';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'correct') return <Check className="h-3 w-3" />;
    if (status === 'incorrect') return <X className="h-3 w-3" />;
    return <AlertTriangle className="h-3 w-3" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {phonemes.map((phoneme, idx) => (
          <TooltipProvider key={idx}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handlePhonemeClick(phoneme)}
                  className={`
                    px-3 py-2 rounded-lg border-2 transition-all
                    ${getPhonemeColor(phoneme.score)}
                    ${selectedPhoneme === phoneme ? 'ring-2 ring-primary' : ''}
                    hover:scale-105 active:scale-95
                  `}
                >
                  <div className="flex items-center gap-1">
                    {getStatusIcon(phoneme.status)}
                    <span className="font-semibold text-lg">{phoneme.phoneme}</span>
                  </div>
                  <div className="text-xs font-bold mt-1">{phoneme.score}%</div>
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-1 text-xs">
                  <div className="font-bold">{phoneme.phoneme}</div>
                  <div>Score: {phoneme.score}/100</div>
                  <div>Quality: {phoneme.quality}</div>
                  {phoneme.expected !== phoneme.actual && (
                    <div className="text-yellow-500">
                      Expected: {phoneme.expected} / Got: {phoneme.actual}
                    </div>
                  )}
                  {phoneme.feedback && (
                    <div className="pt-1 border-t">{phoneme.feedback}</div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>

      {/* Selected Phoneme Detail */}
      {selectedPhoneme && (
        <Card className="border-primary/50">
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">{selectedPhoneme.phoneme}</h3>
                <Badge variant={selectedPhoneme.score >= 75 ? 'default' : 'destructive'}>
                  {selectedPhoneme.score}/100
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Quality: </span>
                  <span className="font-semibold capitalize">{selectedPhoneme.quality}</span>
                </div>
                
                {selectedPhoneme.expected !== selectedPhoneme.actual && (
                  <div className="p-2 bg-yellow-500/10 rounded">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expected:</span>
                      <span className="font-semibold">{selectedPhoneme.expected}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">You said:</span>
                      <span className="font-semibold">{selectedPhoneme.actual}</span>
                    </div>
                  </div>
                )}
                
                {selectedPhoneme.feedback && (
                  <div className="p-2 bg-muted rounded">
                    <div className="text-xs text-muted-foreground mb-1">Feedback:</div>
                    <div>{selectedPhoneme.feedback}</div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-green-500/20 border-2 border-green-500"></div>
          <span>90-100%: Excellent</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-blue-500/20 border-2 border-blue-500"></div>
          <span>75-89%: Good</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-yellow-500/20 border-2 border-yellow-500"></div>
          <span>50-74%: Needs Work</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-red-500/20 border-2 border-red-500"></div>
          <span>0-49%: Incorrect</span>
        </div>
      </div>
    </div>
  );
}

