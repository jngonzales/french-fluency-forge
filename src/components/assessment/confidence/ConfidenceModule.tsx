import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, ArrowRight } from 'lucide-react';
import { SkillRecordingCard, useSkillModule } from '../shared';
import { confidencePrompts, confidenceConfig } from './confidencePrompts';

interface ConfidenceModuleProps {
  sessionId: string;
  onComplete: () => void;
}

export function ConfidenceModule({ sessionId, onComplete }: ConfidenceModuleProps) {
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
    moduleType: 'confidence',
    prompts: confidencePrompts,
    onComplete
  });

  if (showIntro) {
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
              <h4 className="font-medium">What we're assessing:</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• <strong>Length & Development</strong> — How fully you develop your response</li>
                <li>• <strong>Assertiveness</strong> — How clearly you state your opinions</li>
                <li>• <strong>Emotional Engagement</strong> — How openly you express feelings</li>
                <li>• <strong>Clarity & Control</strong> — How smoothly you communicate</li>
              </ul>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <strong>Note:</strong> We are NOT judging your grammar or accent. 
                This is purely about how confidently you express yourself.
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
      moduleTitle={confidenceConfig.title}
      onRecordingComplete={handleRecordingComplete}
      onNext={handleNext}
      onRedo={handleRedo}
      existingResult={getResult(currentPrompt.id)}
      isLast={isLastPrompt}
    />
  );
}
