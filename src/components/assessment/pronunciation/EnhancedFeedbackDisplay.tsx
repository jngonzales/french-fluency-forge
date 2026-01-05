/**
 * Enhanced Feedback Display
 * Comprehensive pronunciation feedback with phoneme drill-down
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  AlertCircle, 
  RotateCcw, 
  ChevronRight,
  ChevronDown,
  Target,
  Lightbulb,
  TrendingUp,
} from 'lucide-react';
import { PhonemeVisualization } from './PhonemeVisualization';
import { EnhancedWordHeatmap } from './EnhancedWordHeatmap';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScoreGauge } from './ScoreGauge';

interface EnhancedFeedbackDisplayProps {
  result: any; // UnifiedPronunciationResult
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
  const [showPractice, setShowPractice] = useState(false);

  // Extract scores - handle both unified format and old Azure format
  const score = result.scores?.overall ?? result.pronScore ?? result.accuracyScore ?? 0;
  const accuracyScore = result.scores?.accuracy ?? result.accuracyScore ?? 0;
  const fluencyScore = result.scores?.fluency ?? result.fluencyScore ?? 80;
  const completenessScore = result.scores?.completeness ?? result.completenessScore ?? 0;
  
  const isExcellent = score >= 85;
  const isGood = score >= 70 && score < 85;
  const isOk = score >= 50 && score < 70;
  const needsWork = score < 50;

  const scoreColor = 
    isExcellent ? 'text-green-500' :
    isGood ? 'text-blue-500' :
    isOk ? 'text-yellow-500' :
    'text-red-500';

  const bgColor = 
    isExcellent ? 'bg-green-500/10 border-green-500/20' :
    isGood ? 'bg-blue-500/10 border-blue-500/20' :
    isOk ? 'bg-yellow-500/10 border-yellow-500/20' :
    'bg-red-500/10 border-red-500/20';

  return (
    <div className="space-y-6">
      {/* Main Score Card */}
      <Card className="border-2 border-muted">
        <CardContent className="pt-6">
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


      {/* Improvements - Only show if available */}
      {result.improvements && Array.isArray(result.improvements) && result.improvements.length > 0 && (
        <Alert className="border-yellow-500/30 bg-yellow-500/5">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <AlertDescription>
            <div className="font-semibold mb-1">Areas to improve:</div>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {result.improvements.map((improvement: string, idx: number) => (
                <li key={idx}>{improvement}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Practice Suggestions - Only show if available */}
      {result.practiceSuggestions && Array.isArray(result.practiceSuggestions) && result.practiceSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <button
              onClick={() => setShowPractice(!showPractice)}
              className="flex items-center justify-between w-full"
            >
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Practice Suggestions
              </CardTitle>
              {showPractice ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </button>
          </CardHeader>
          {showPractice && (
            <CardContent>
              <div className="space-y-4">
                {result.practiceSuggestions.map((suggestion: any, idx: number) => (
                  <div key={idx} className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xl font-bold">{suggestion.phoneme}</span>
                      <Badge variant={
                        suggestion.difficulty === 'easy' ? 'default' :
                        suggestion.difficulty === 'medium' ? 'secondary' :
                        'destructive'
                      }>
                        {suggestion.difficulty}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Issue: </span>
                        <span>{suggestion.issue}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Tip: </span>
                        <span>{suggestion.tip}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Practice words: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {suggestion.exampleWords.map((word: string) => (
                            <Badge key={word} variant="outline" className="text-xs">
                              {word}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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

