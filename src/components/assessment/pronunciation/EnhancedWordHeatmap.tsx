/**
 * Enhanced Word Heatmap
 * Clickable words showing phoneme breakdown
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Check, AlertTriangle, X } from 'lucide-react';

interface WordAnalysis {
  word: string;
  score: number;
  status: 'correct' | 'incorrect' | 'omitted' | 'inserted';
  phonemes: Array<{
    phoneme: string;
    score: number;
    expected: string;
    actual: string;
    status: 'correct' | 'incorrect' | 'missing';
    quality?: string;
    feedback?: string;
  }>;
  errorType?: string;
  feedback?: string;
}

interface EnhancedWordHeatmapProps {
  words: WordAnalysis[];
}

export function EnhancedWordHeatmap({ words }: EnhancedWordHeatmapProps) {
  const [selectedWord, setSelectedWord] = useState<WordAnalysis | null>(null);

  // Handle empty or invalid words array
  if (!words || !Array.isArray(words) || words.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-4 text-sm">
        No word data available
      </div>
    );
  }

  const getWordColor = (word: WordAnalysis) => {
    // Safe access to word properties
    const wordScore = word.score ?? word.accuracyScore ?? 0;
    const wordStatus = word.status ?? 'correct';
    if (wordStatus === 'omitted') {
      return 'bg-gray-500/20 border-gray-500 text-gray-700 dark:text-gray-400';
    }
    if (wordStatus === 'inserted') {
      return 'bg-purple-500/20 border-purple-500 text-purple-700 dark:text-purple-400';
    }
    if (wordScore >= 90) {
      return 'bg-green-500/20 border-green-500 text-green-700 dark:text-green-400';
    }
    if (wordScore >= 75) {
      return 'bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-400';
    }
    if (wordScore >= 50) {
      return 'bg-yellow-500/20 border-yellow-500 text-yellow-700 dark:text-yellow-400';
    }
    return 'bg-red-500/20 border-red-500 text-red-700 dark:text-red-400';
  };

  return (
    <div className="space-y-4">
      {/* Word Heatmap */}
      <div className="p-4 rounded-lg bg-muted/30">
        <p className="text-xs font-medium text-muted-foreground mb-3">
          Word accuracy (click to see phonemes):
        </p>
        <div className="flex flex-wrap gap-2">
          {words.map((word, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedWord(selectedWord === word ? null : word)}
              className={`
                px-3 py-2 rounded-lg border-2 text-base font-medium transition-all
                ${getWordColor(word)}
                ${selectedWord === word ? 'ring-2 ring-primary scale-105' : ''}
                hover:scale-105 active:scale-95
              `}
              title={`${word.score}% - ${word.errorType || 'Click for details'}`}
            >
              <div className="flex flex-col items-center">
                <span>{word.word}</span>
                <span className="text-[10px] font-bold mt-1">{word.score ?? word.accuracyScore ?? 0}%</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Word Phoneme Breakdown */}
      {selectedWord && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">"{selectedWord.word}"</h3>
                <Badge variant={(selectedWord.score ?? selectedWord.accuracyScore ?? 0) >= 75 ? 'default' : 'destructive'} className="text-base">
                  {selectedWord.score ?? selectedWord.accuracyScore ?? 0}/100
                </Badge>
              </div>

              {selectedWord.feedback && (
                <div className="p-2 bg-muted rounded text-sm">
                  <span className="text-muted-foreground">Feedback: </span>
                  {selectedWord.feedback}
                </div>
              )}

              {/* Phoneme breakdown */}
              {selectedWord.phonemes && selectedWord.phonemes.length > 0 ? (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Phoneme breakdown ({selectedWord.phonemes.length} sounds):
                </div>
                <div className="space-y-2">
                  {selectedWord.phonemes.map((phoneme, idx) => (
                    <div
                      key={idx}
                      className={`
                        p-3 rounded-lg border
                        ${phoneme.score >= 75 
                          ? 'bg-green-500/10 border-green-500/30' 
                          : phoneme.score >= 50
                            ? 'bg-yellow-500/10 border-yellow-500/30'
                            : 'bg-red-500/10 border-red-500/30'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">{phoneme.phoneme}</span>
                          <Badge variant={phoneme.status === 'correct' ? 'default' : 'destructive'} className="text-xs">
                            {phoneme.quality || phoneme.status}
                          </Badge>
                        </div>
                        <span className="text-xl font-bold">{phoneme.score}%</span>
                      </div>

                      {phoneme.expected !== phoneme.actual && (
                        <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                          <div>
                            <div className="text-xs text-muted-foreground">Expected:</div>
                            <div className="font-semibold">{phoneme.expected}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">You said:</div>
                            <div className="font-semibold text-red-600 dark:text-red-400">{phoneme.actual}</div>
                          </div>
                        </div>
                      )}

                      {phoneme.feedback && (
                        <div className="text-sm text-muted-foreground">
                          💡 {phoneme.feedback}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Phoneme data not available for this word
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground justify-center">
        <div className="flex items-center gap-1">
          <Check className="h-3 w-3 text-green-500" />
          <span>Correct</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 text-yellow-500" />
          <span>Needs Work</span>
        </div>
        <div className="flex items-center gap-1">
          <X className="h-3 w-3 text-red-500" />
          <span>Incorrect</span>
        </div>
      </div>
    </div>
  );
}

