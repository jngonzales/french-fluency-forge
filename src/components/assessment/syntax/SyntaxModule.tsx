import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, ArrowRight } from 'lucide-react';
import { SkillRecordingCard, useSkillModule } from '../shared';
import { syntaxPrompts, syntaxConfig } from './syntaxPrompts';

interface SyntaxModuleProps {
  sessionId: string;
  onComplete: () => void;
}

export function SyntaxModule({ sessionId, onComplete }: SyntaxModuleProps) {
  const [showIntro, setShowIntro] = useState(true);

  const {
    currentPrompt,
    currentIndex,
    totalPrompts,
    isLastPrompt,
    getAttemptCount,
    getResult,
    handleRecordingComplete,
    handleNext,
    handleRedo
  } = useSkillModule({
    sessionId,
    moduleType: 'syntax',
    prompts: syntaxPrompts,
    onComplete
  });

  if (showIntro) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-primary/20">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">{syntaxConfig.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-muted-foreground">
              {syntaxConfig.description}
            </p>
            
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium">What we're assessing:</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• <strong>Verb Conjugation</strong> — Correct tense and agreement</li>
                <li>• <strong>Sentence Complexity</strong> — Use of compound/complex sentences</li>
                <li>• <strong>Gender & Agreement</strong> — Noun-adjective matching</li>
                <li>• <strong>Word Order</strong> — Proper French structure</li>
              </ul>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                <strong>Tip:</strong> Focus on practical communication. Minor errors that don't 
                impede understanding are penalized less than confusing mistakes.
              </p>
            </div>

            <div className="text-center pt-4">
              <Button size="lg" onClick={() => setShowIntro(false)} className="gap-2">
                Start
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentPrompt) {
    return <div>Loading...</div>;
  }

  return (
    <SkillRecordingCard
      prompt={currentPrompt}
      attemptNumber={getAttemptCount(currentPrompt.id)}
      questionNumber={currentIndex + 1}
      totalQuestions={totalPrompts}
      moduleTitle={syntaxConfig.title}
      onRecordingComplete={handleRecordingComplete}
      onNext={handleNext}
      onRedo={handleRedo}
      existingResult={getResult(currentPrompt.id)}
      isLast={isLastPrompt}
    />
  );
}
