/**
 * Enhanced Feedback Display
 * Simplified pronunciation feedback with score gauge
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RotateCcw, 
  ChevronRight,
  ChevronDown,
  Target,
} from 'lucide-react';
import { PhonemeVisualization } from './PhonemeVisualization';
import { EnhancedWordHeatmap } from './EnhancedWordHeatmap';
import { ScoreGauge } from './ScoreGauge';

interface EnhancedFeedbackDisplayProps {
  result: any;
  onContinue: () => void;
  onTryAgain: (() => void) | null;
  attemptNumber: number;
  showScores?: boolean;
}

export function EnhancedFeedbackDisplay({ 
  result, 
  onContinue, 
  onTryAgain, 
  attemptNumber,
  showScores = false
}: EnhancedFeedbackDisplayProps) {
  const [showPhonemes, setShowPhonemes] = useState(false);

  // Extract score - use Azure's PronScore directly
  const score = result.scores?.overall ?? result.pronScore ?? 0;

  return (
    <div className="space-y-6">
      {/* Main Score Card - Clean and centered */}
      <Card className="border-2 border-muted">
        <CardContent className="py-6">
          <div className="flex justify-center">
            <ScoreGauge score={score} />
          </div>
        </CardContent>
      </Card>

      {/* What You Said vs Expected - Only show in dev/admin mode */}
      {showScores && result.recognizedText && result.expectedText && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Recognition Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">What API understood:</div>
              <div className="p-3 bg-muted rounded-lg font-semibold">
                "{result.recognizedText}"
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Expected:</div>
              <div className="p-3 bg-muted rounded-lg">
                "{result.expectedText}"
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">Text match:</span>
              <Badge variant={result.textMatch >= 90 ? 'default' : 'secondary'}>
                {result.textMatch}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Word-Level Analysis - Only show for dev/admin */}
      {showScores && result.words && result.words.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Word-by-Word Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <EnhancedWordHeatmap words={result.words} showScores={showScores} />
          </CardContent>
        </Card>
      )}

      {/* Phoneme Visualization - Only show for dev/admin */}
      {showScores && result.allPhonemes && result.allPhonemes.length > 0 && (
        <Card>
          <CardHeader>
            <button
              onClick={() => setShowPhonemes(!showPhonemes)}
              className="flex items-center justify-between w-full"
            >
              <CardTitle className="text-base flex items-center gap-2">
                🔤 Phoneme Analysis ({result.allPhonemes.length} sounds)
              </CardTitle>
              {showPhonemes ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </button>
          </CardHeader>
          {showPhonemes && (
            <CardContent>
              <PhonemeVisualization phonemes={result.allPhonemes} />
            </CardContent>
          )}
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {onTryAgain && attemptNumber < 2 && (
          <Button
            variant="outline"
            size="lg"
            onClick={onTryAgain}
            className="flex-1"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Try Again {attemptNumber === 1 ? '(1 more chance)' : ''}
          </Button>
        )}
        <Button
          size="lg"
          onClick={onContinue}
          className="flex-1"
        >
          Continue
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {attemptNumber >= 2 && (
        <p className="text-xs text-center text-muted-foreground">
          Maximum attempts reached. Moving forward helps get a complete assessment.
        </p>
      )}
    </div>
  );
}
