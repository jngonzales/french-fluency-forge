import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { FluencyIntroPanel } from "./FluencyIntroPanel";
import { FluencyRecordingCard } from "./FluencyRecordingCard";
import { FluencyRedoDialog } from "./FluencyRedoDialog";
import { useFluencyModule } from "./useFluencyModule";
import { RotateCcw, ChevronRight, Check } from "lucide-react";
import SkipButton from "../SkipButton";

interface FluencyModuleProps {
  sessionId: string;
  onComplete: () => Promise<void>;
  onSkip?: () => void;
}

export function FluencyModule({ sessionId, onComplete, onSkip }: FluencyModuleProps) {
  const [showRedoItemDialog, setShowRedoItemDialog] = useState(false);
  const [showRedoModuleDialog, setShowRedoModuleDialog] = useState(false);

  const {
    prompts,
    currentPrompt,
    currentIndex,
    currentState,
    allComplete,
    moduleAttemptCount,
    setRecordingState,
    handleRecordingComplete,
    handleNext,
    handleRedoItem,
    handleRedoModule,
    lockModule,
  } = useFluencyModule(sessionId);

  const progress = ((currentIndex + (currentState.recordingState === "done" ? 1 : 0)) / prompts.length) * 100;

  const handleFinishModule = async () => {
    await lockModule();
    await onComplete();
  };

  const onRedoItemConfirm = () => {
    handleRedoItem(true);
    setShowRedoItemDialog(false);
  };

  const onRedoModuleConfirm = () => {
    handleRedoModule(true);
    setShowRedoModuleDialog(false);
  };

  // Check if all questions have been completed (for showing "redo module" option)
  const allQuestionsAnswered = prompts.every((p) => {
    // This is a simplified check - in production you'd check the actual state
    return currentIndex === prompts.length - 1 && allComplete;
  });

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header with progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold">Level Test: Fluency</h1>
            {moduleAttemptCount > 1 && (
              <span className="text-xs text-muted-foreground">
                Module attempt #{moduleAttemptCount}
              </span>
            )}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Intro Panel */}
        <FluencyIntroPanel />

        {/* Recording Card */}
        {!allComplete && (
          <FluencyRecordingCard
            prompt={currentPrompt}
            questionNumber={currentIndex + 1}
            totalQuestions={prompts.length}
            attemptCount={currentState.attemptCount}
            recordingState={currentState.recordingState}
            setRecordingState={setRecordingState}
            onRecordingComplete={handleRecordingComplete}
            onNext={handleNext}
            onRedo={() => setShowRedoItemDialog(true)}
            isLast={currentIndex === prompts.length - 1}
            errorMessage={currentState.errorMessage}
          />
        )}

        {/* All Complete State */}
        {allComplete && (
          <div className="space-y-4">
            <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
              <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Fluency Complete!</h2>
              <p className="text-muted-foreground">
                You've finished both speaking prompts. Ready to continue?
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button size="lg" onClick={handleFinishModule} className="w-full">
                Continue to Next Section
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>

              <Button 
                variant="outline" 
                onClick={() => setShowRedoModuleDialog(true)}
                className="w-full"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Redo Fluency (start over)
              </Button>
            </div>

            <p className="text-center text-sm text-amber-600 dark:text-amber-400">
              Once you continue, you won't be able to come back and redo this section.
            </p>
          </div>
        )}

        {/* Redo Dialogs */}
        <FluencyRedoDialog
          open={showRedoItemDialog}
          onOpenChange={setShowRedoItemDialog}
          onConfirm={onRedoItemConfirm}
          type="item"
        />

        <FluencyRedoDialog
          open={showRedoModuleDialog}
          onOpenChange={setShowRedoModuleDialog}
          onConfirm={onRedoModuleConfirm}
          type="module"
        />

        {onSkip && <SkipButton onClick={onSkip} />}
      </div>
    </div>
  );
}

export default FluencyModule;
