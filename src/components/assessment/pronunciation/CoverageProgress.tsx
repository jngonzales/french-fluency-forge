/**
 * Coverage Progress Component
 * Shows phoneme coverage progress during test
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import { getAllPhonemes } from '@/lib/pronunciation/phonemeInventory';

interface CoverageProgressProps {
  testedPhonemes: Set<string>;
  currentPhrase?: number;
  totalPhrases?: number;
  compact?: boolean;
}

export function CoverageProgress({ 
  testedPhonemes, 
  currentPhrase, 
  totalPhrases,
  compact = false 
}: CoverageProgressProps) {
  const allPhonemes = getAllPhonemes();
  const tested = testedPhonemes.size;
  const total = allPhonemes.size;
  const percentage = Math.round((tested / total) * 100);

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-sm">
          <span className="font-semibold">{tested}/{total}</span>
          <span className="text-muted-foreground ml-1">phonemes</span>
        </div>
        <Progress value={percentage} className="flex-1 h-2" />
        <span className="text-sm font-semibold text-primary">{percentage}%</span>
      </div>
    );
  }

  const missing = Array.from(allPhonemes).filter(p => !testedPhonemes.has(p));

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Phoneme Coverage</CardTitle>
          <Badge variant={percentage === 100 ? 'default' : 'secondary'}>
            {tested}/{total} ({percentage}%)
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div>
          <Progress value={percentage} className="h-3" />
          {currentPhrase && totalPhrases && (
            <div className="text-xs text-muted-foreground mt-2">
              Phrase {currentPhrase} of {totalPhrases}
            </div>
          )}
        </div>

        {/* Phoneme Grid */}
        <div>
          <div className="text-xs text-muted-foreground mb-2">Phonemes tested:</div>
          <div className="flex flex-wrap gap-1">
            {Array.from(allPhonemes).sort().map(phoneme => {
              const isTested = testedPhonemes.has(phoneme);
              return (
                <div
                  key={phoneme}
                  className={`
                    px-2 py-1 rounded text-xs font-mono border
                    ${isTested 
                      ? 'bg-green-500/20 border-green-500 text-green-700 dark:text-green-400' 
                      : 'bg-muted border-muted-foreground/20 text-muted-foreground'
                    }
                  `}
                  title={isTested ? 'Tested' : 'Not yet tested'}
                >
                  {isTested && <Check className="inline h-2 w-2 mr-0.5" />}
                  /{phoneme}/
                </div>
              );
            })}
          </div>
        </div>

        {/* Missing Phonemes */}
        {missing.length > 0 && (
          <div>
            <div className="text-xs text-muted-foreground mb-2">Still need to test:</div>
            <div className="flex flex-wrap gap-1">
              {missing.slice(0, 10).map(phoneme => (
                <Badge key={phoneme} variant="outline" className="font-mono text-xs">
                  /{phoneme}/
                </Badge>
              ))}
              {missing.length > 10 && (
                <Badge variant="secondary" className="text-xs">
                  +{missing.length - 10} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Success Message */}
        {percentage === 100 && (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-semibold">
            <Check className="h-4 w-4" />
            All phonemes tested! Complete assessment for results.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

