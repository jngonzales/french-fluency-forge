import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, ArrowRight, Phone } from 'lucide-react';
import { ConfidenceQuestionnaire } from './ConfidenceQuestionnaire';
import { PhoneCallModule } from './PhoneCallModule';
import { ConfidenceSpeakingResults } from './ConfidenceSpeakingResults';
import { selectScenario } from './scenarioSelector';
import type { ConfidenceScenario, ConfidenceSpeakingResult } from './types';

interface ConfidenceModuleProps {
  sessionId: string;
  onComplete: () => void;
}

type Phase = 'intro' | 'questionnaire' | 'phone-intro' | 'phone-call' | 'results';

export function ConfidenceModule({ sessionId, onComplete }: ConfidenceModuleProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [questionnaireScore, setQuestionnaireScore] = useState<number | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<ConfidenceScenario | null>(null);
  const [speakingResult, setSpeakingResult] = useState<ConfidenceSpeakingResult | null>(null);

  // Enable dev mode in development
  const isDev = import.meta.env.DEV || window.location.pathname.startsWith('/dev');

  // Select scenario when moving to phone-intro phase
  useEffect(() => {
    if (phase === 'phone-intro' && !selectedScenario) {
      // For now, select based on questionnaire score (if available)
      // or use default tier 1
      const scenario = selectScenario({
        previousConfidenceScore: questionnaireScore || undefined
      });
      setSelectedScenario(scenario);
    }
  }, [phase, selectedScenario, questionnaireScore]);

  const handleQuestionnaireComplete = (score: number) => {
    setQuestionnaireScore(score);
    setPhase('phone-intro');
  };

  const handlePhoneCallComplete = (result: ConfidenceSpeakingResult) => {
    setSpeakingResult(result);
    setPhase('results');
  };

  const handleFinalComplete = () => {
    onComplete();
  };

  if (phase === 'intro') {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-primary/20">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">{confidenceConfig.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-muted-foreground">
              {confidenceConfig.description}
            </p>
            
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium">This assessment has two parts:</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• <strong>Part 1:</strong> 8 quick self-reflection questions about your speaking habits</li>
                <li>• <strong>Part 2:</strong> Phone call simulation (2-4 minutes) where you handle a conversation scenario</li>
              </ul>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium">What we measure in the phone call:</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• <strong>Response Time</strong> — How quickly you start speaking</li>
                <li>• <strong>Speech Flow</strong> — Keeping momentum without long pauses</li>
                <li>• <strong>Assertiveness</strong> — Stating needs and opinions clearly</li>
                <li>• <strong>Emotional Presence</strong> — Expressing feelings and connecting</li>
                <li>• <strong>Communication Control</strong> — Structured, clear delivery</li>
              </ul>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <strong>Important:</strong> We do NOT grade grammar, accent, or vocabulary. 
                This measures your confidence in speaking, not your French perfection.
              </p>
            </div>

            <div className="text-center pt-4">
              <Button size="lg" onClick={() => setPhase('questionnaire')} className="gap-2">
                Start
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === 'questionnaire') {
    return (
      <ConfidenceQuestionnaire
        sessionId={sessionId}
        onComplete={handleQuestionnaireComplete}
      />
    );
  }

  // Phone call intro
  if (phase === 'phone-intro') {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-primary/20">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Phone className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Part 2: Phone Call Simulation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedScenario && (
              <>
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Scenario: {selectedScenario.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedScenario.context}
                  </p>
                </div>

                <div className="bg-primary/5 rounded-lg p-4 space-y-2">
                  <h4 className="font-medium">Your goals:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {selectedScenario.objectives.map((obj, idx) => (
                      <li key={idx}>• {obj}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    <strong>Remember:</strong> Respond confidently. It's okay to pause briefly, 
                    but keep the conversation moving. Express your needs clearly.
                  </p>
                </div>
              </>
            )}

            <div className="text-center pt-4">
              <Button 
                size="lg" 
                onClick={() => setPhase('phone-call')} 
                className="gap-2"
                disabled={!selectedScenario}
              >
                <Phone className="h-5 w-5" />
                Start Phone Call
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Phone call in progress
  if (phase === 'phone-call') {
    if (!selectedScenario) {
      return <div>Loading scenario...</div>;
    }

    return (
      <PhoneCallModule
        sessionId={sessionId}
        scenario={selectedScenario}
        onComplete={handlePhoneCallComplete}
        devMode={isDev}
      />
    );
  }

  // Results
  if (phase === 'results') {
    if (!speakingResult || questionnaireScore === null) {
      return <div>Loading results...</div>;
    }

    // Calculate combined score (50% questionnaire + 50% speaking)
    const combinedScore = Math.round(
      (questionnaireScore * 0.5) + (speakingResult.scores.speaking_confidence_score_0_100 * 0.5)
    );

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="border-primary/30">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Confidence Assessment Complete</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Questionnaire</div>
                <div className="text-3xl font-bold text-primary">{questionnaireScore}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Speaking</div>
                <div className="text-3xl font-bold text-primary">
                  {speakingResult.scores.speaking_confidence_score_0_100}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Combined</div>
                <div className="text-3xl font-bold text-primary">{combinedScore}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <ConfidenceSpeakingResults result={speakingResult} showDetails={true} />

        <div className="text-center">
          <Button size="lg" onClick={handleFinalComplete}>
            Continue to Next Module
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
