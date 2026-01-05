/**
 * Confidence Speaking Results Component
 * 
 * Displays D1-D5 dimension scores, timing aggregates, strengths,
 * focus areas, and behavioral micro-drills.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Target, Zap, Clock, TrendingUp } from 'lucide-react';
import type { ConfidenceSpeakingResult } from './types';
import { generateStrengths, generateFocusAreas, generateDrillsForScores } from '@/lib/confidence/microDrills';
import { useEffect, useState } from 'react';

interface ConfidenceSpeakingResultsProps {
  result: ConfidenceSpeakingResult;
  showDetails?: boolean;
}

const dimensionLabels: Record<string, { label: string; icon: any; description: string }> = {
  d1: {
    label: 'Response Initiation',
    icon: Zap,
    description: 'How quickly you start speaking after prompts'
  },
  d2: {
    label: 'Silence Management',
    icon: TrendingUp,
    description: 'Keeping momentum without long pauses'
  },
  d3: {
    label: 'Ownership & Assertiveness',
    icon: Target,
    description: 'Stating needs and opinions clearly'
  },
  d4: {
    label: 'Emotional Engagement',
    icon: CheckCircle2,
    description: 'Expressing feelings and connecting'
  },
  d5: {
    label: 'Clarity & Control',
    icon: CheckCircle2,
    description: 'Structured, controlled communication'
  }
};

function ScoreBadge({ score }: { score: number }) {
  const percentage = (score / 5) * 100;
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
  let colorClass = '';
  
  if (percentage >= 80) {
    variant = 'default';
    colorClass = 'bg-green-500 text-white';
  } else if (percentage >= 60) {
    variant = 'default';
    colorClass = 'bg-blue-500 text-white';
  } else if (percentage >= 40) {
    variant = 'secondary';
    colorClass = 'bg-amber-500 text-white';
  } else {
    variant = 'destructive';
  }
  
  return (
    <Badge variant={variant} className={colorClass}>
      {score}/5
    </Badge>
  );
}

export function ConfidenceSpeakingResults({ result, showDetails = true }: ConfidenceSpeakingResultsProps) {
  const [strengths, setStrengths] = useState<Array<{ dimension: string; label: string }>>([]);
  const [focusAreas, setFocusAreas] = useState<Array<{ dimension: string; label: string }>>([]);
  const [microDrills, setMicroDrills] = useState<Array<any>>([]);

  useEffect(() => {
    // Generate feedback
    const scores = {
      d1: result.scores.d1_response_initiation.score_0_5,
      d2: result.scores.d2_silence_management.score_0_5,
      d3: result.scores.d3_ownership_assertiveness.score_0_5,
      d4: result.scores.d4_emotional_engagement.score_0_5,
      d5: result.scores.d5_clarity_control.score_0_5
    };

    setStrengths(result.strengths || generateStrengths(scores));
    setFocusAreas(result.focus_areas || generateFocusAreas(scores));
    setMicroDrills(result.micro_drills || generateDrillsForScores(scores));
  }, [result]);

  const overallScore = result.scores.speaking_confidence_score_0_100;
  const d1Score = result.scores.d1_response_initiation.score_0_5;
  const d2Score = result.scores.d2_silence_management.score_0_5;
  const d3Score = result.scores.d3_ownership_assertiveness.score_0_5;
  const d4Score = result.scores.d4_emotional_engagement.score_0_5;
  const d5Score = result.scores.d5_clarity_control.score_0_5;

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="pt-6">
          <div className="text-center space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Speaking Confidence Score
            </h3>
            <div className="text-6xl font-bold text-primary">
              {overallScore}
            </div>
            <div className="text-sm text-muted-foreground">out of 100</div>
            <Progress value={overallScore} className="h-3 mt-4" />
          </div>
        </CardContent>
      </Card>

      {/* Dimension Scores */}
      <Card>
        <CardHeader>
          <CardTitle>Confidence Dimensions (D1-D5)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'd1', score: d1Score },
            { key: 'd2', score: d2Score },
            { key: 'd3', score: d3Score },
            { key: 'd4', score: d4Score },
            { key: 'd5', score: d5Score }
          ].map(({ key, score }) => {
            const dim = dimensionLabels[key];
            const Icon = dim.icon;
            const percentage = (score / 5) * 100;

            return (
              <div key={key} className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <div className="font-medium">{dim.label}</div>
                      {showDetails && (
                        <div className="text-xs text-muted-foreground">{dim.description}</div>
                      )}
                    </div>
                  </div>
                  <ScoreBadge score={score} />
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Timing Aggregates */}
      {showDetails && result.timing_aggregates && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Timing Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {(result.timing_aggregates.start_latency_ms_median / 1000).toFixed(1)}s
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Median Response Time
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {Math.round(result.timing_aggregates.speech_ratio_avg * 100)}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Speech Ratio
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {(result.timing_aggregates.longest_silence_ms / 1000).toFixed(1)}s
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Longest Silence
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strengths */}
      {strengths.length > 0 && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              Your Strengths
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {strengths.map((strength, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm leading-relaxed">{strength.label}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Focus Areas */}
      {focusAreas.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Target className="h-5 w-5" />
              Focus Areas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {focusAreas.map((area, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Target className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-sm leading-relaxed">{area.label}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Micro-Drills */}
      {microDrills.length > 0 && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Micro-Drills (Practice Exercises)
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Quick behavioral exercises to build your confidence
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {microDrills.map((drill, idx) => (
              <div key={idx} className="border-l-4 border-primary pl-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{drill.title}</h4>
                  <Badge variant="outline">{drill.duration}</Badge>
                </div>
                <p className="text-sm leading-relaxed">{drill.instruction}</p>
                {drill.example && (
                  <div className="bg-muted/50 rounded-lg p-3 mt-2">
                    <div className="text-xs font-medium text-muted-foreground mb-1">Example:</div>
                    <p className="text-sm italic">{drill.example}</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Signal Evidence (Optional Debug) */}
      {showDetails && result.signals && (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer hover:text-foreground">
            Show detected signals (debug)
          </summary>
          <pre className="mt-2 p-4 bg-muted rounded-lg overflow-auto max-h-96">
            {JSON.stringify(result.signals, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

