import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { FluencyIntroPanel } from "./FluencyIntroPanel";
import { FluencyRecordingCard } from "./FluencyRecordingCard";
import { FluencyRedoDialog } from "./FluencyRedoDialog";
import { useFluencyModule } from "./useFluencyModule";
import { RotateCcw, ChevronRight, Check, Loader2 } from "lucide-react";
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
    pictureCards,
    currentCard,
    currentIndex,
    currentState,
    allComplete,
    moduleAttemptCount,
    isLoading,
    setRecordingState,
    handleRecordingComplete,
    handleNext,
    handleRedoItem,
    handleRedoModule,
    lockModule,
  } = useFluencyModule(sessionId);

  const progress = pictureCards.length > 0 
    ? ((currentIndex + (currentState.recordingState === "done" ? 1 : 0)) / pictureCards.length) * 100
    : 0;

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
        {!allComplete && currentCard && (
          <FluencyRecordingCard
            card={currentCard}
            questionNumber={currentIndex + 1}
            totalQuestions={pictureCards.length}
            attemptCount={currentState.attemptCount}
            recordingState={currentState.recordingState}
            setRecordingState={setRecordingState}
            onRecordingComplete={handleRecordingComplete}
            onNext={handleNext}
            onRedo={() => setShowRedoItemDialog(true)}
            isLast={currentIndex === pictureCards.length - 1}
            errorMessage={currentState.errorMessage}
            score={currentState.score}
            speedSubscore={currentState.speedSubscore}
            pauseSubscore={currentState.pauseSubscore}
          />
        )}

        {/* All Complete State */}
        {allComplete && (
          <div className="space-y-4">
            <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
              <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Fluency Complete!</h2>
              <p className="text-muted-foreground">
                Tu as terminé les {pictureCards.length} questions. Prêt(e) à continuer ?
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button size="lg" onClick={handleFinishModule} className="w-full">
                Continuer vers la section suivante
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>

              <Button 
                variant="outline" 
                onClick={() => setShowRedoModuleDialog(true)}
                className="w-full"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Refaire Fluency (recommencer)
              </Button>
            </div>

            <p className="text-center text-sm text-amber-600 dark:text-amber-400">
              Une fois que tu continues, tu ne pourras plus revenir en arrière.
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
