import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessagesSquare, ArrowRight } from 'lucide-react';
import { SkillRecordingCard, useSkillModule } from '../shared';
import { conversationPrompts, conversationConfig } from './conversationPrompts';

interface ConversationModuleProps {
  sessionId: string;
  onComplete: () => void;
}

export function ConversationModule({ sessionId, onComplete }: ConversationModuleProps) {
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
    moduleType: 'conversation',
    prompts: conversationPrompts,
    onComplete
  });

  if (showIntro) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-primary/20">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <MessagesSquare className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">{conversationConfig.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-muted-foreground">
              {conversationConfig.description}
            </p>
            
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium">What we're assessing:</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• <strong>Comprehension</strong> — How well you understood the prompt</li>
                <li>• <strong>Handling Misunderstanding</strong> — How gracefully you clarify confusion</li>
                <li>• <strong>Conversational Flow</strong> — Natural turn-taking and engagement</li>
              </ul>
            </div>

            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 space-y-2">
              <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                What to do if you don't understand:
              </p>
              <ul className="text-sm text-green-700 dark:text-green-400 space-y-1">
                <li>• "Pardon, vous voulez dire que… ?"</li>
                <li>• "Je crois que j'ai compris X, mais pas Y."</li>
                <li>• "Vous pouvez reformuler ça ?"</li>
              </ul>
              <p className="text-xs text-green-600 dark:text-green-500 pt-2">
                Using repair strategies when confused is actually a GOOD thing!
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
      moduleTitle={conversationConfig.title}
      onRecordingComplete={handleRecordingComplete}
      onNext={handleNext}
      onRedo={handleRedo}
      existingResult={getResult(currentPrompt.id)}
      isLast={isLastPrompt}
    />
  );
}
