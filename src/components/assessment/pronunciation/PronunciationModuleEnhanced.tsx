/**
 * Enhanced Pronunciation Module
 * Integrates SpeechSuper/Azure with comprehensive debug and feedback
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useAudioRecorder, formatTime } from "@/hooks/useAudioRecorder";
import { 
  Mic, 
  Square, 
  RotateCcw, 
  Volume2, 
  Loader2,
  AlertCircle,
  BookOpen,
  Repeat,
  Gamepad2,
  Pause,
  Check,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import SkipButton from "../SkipButton";
import { 
  READING_ITEMS, 
  REPEAT_ITEMS,
  getRandomMinimalPairs,
  type ReadingItem,
  type RepeatItem,
  type MinimalPairItem
} from "./pronunciationItems";
import { StatusIndicator, StatusBadge, type ProcessingStatus } from "./StatusIndicator";
import { PronunciationDebugPanel } from "./PronunciationDebugPanel";
import { EnhancedFeedbackDisplay } from "./EnhancedFeedbackDisplay";

type Section = "reading" | "repeat" | "minimalPairs";

interface PronunciationModuleProps {
  sessionId: string;
  onComplete: (results: any[]) => void;
  onSkip?: () => void;
}

const PronunciationModuleEnhanced = ({ sessionId, onComplete, onSkip }: PronunciationModuleProps) => {
  // Section state
  const [currentSection, setCurrentSection] = useState<Section>("reading");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  
  // Minimal pairs game state
  const [minimalPairItems] = useState(() => getRandomMinimalPairs(6));
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showMinimalPairResult, setShowMinimalPairResult] = useState(false);
  
  // Audio state
  const [isPlayingReference, setIsPlayingReference] = useState(false);
  const [isLoadingReference, setIsLoadingReference] = useState(false);
  const [referenceAudioUrl, setReferenceAudioUrl] = useState<string | null>(null);
  
  // Processing state
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>('idle');
  const [currentProvider, setCurrentProvider] = useState<'speechsuper' | 'azure' | null>(null);
  
  // Feedback state
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentResult, setCurrentResult] = useState<any>(null);
  const [attemptCounts, setAttemptCounts] = useState<Record<string, number>>({});
  
  const referenceAudioRef = useRef<HTMLAudioElement | null>(null);

  const {
    isRecording,
    recordingTime,
    audioBlob,
    error: recordingError,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder({ maxDuration: 30 });

  // Get current items based on section
  const getCurrentItems = useCallback(() => {
    switch (currentSection) {
      case "reading": return READING_ITEMS;
      case "repeat": return REPEAT_ITEMS;
      case "minimalPairs": return minimalPairItems;
    }
  }, [currentSection, minimalPairItems]);

  const currentItems = getCurrentItems();
  const currentItem = currentItems[currentIndex];
  const currentAttemptCount = attemptCounts[currentItem?.id] || 0;
  const maxAttemptsReached = currentAttemptCount >= 2;
  
  const totalItems = READING_ITEMS.length + REPEAT_ITEMS.length + minimalPairItems.length;
  const completedItems = results.length;
  const progress = (completedItems / totalItems) * 100;

  // Load reference audio
  useEffect(() => {
    if (currentSection === "repeat" || currentSection === "minimalPairs") {
      loadReferenceAudio();
    }
    return () => {
      if (referenceAudioUrl) {
        URL.revokeObjectURL(referenceAudioUrl);
      }
    };
  }, [currentSection, currentIndex]);

  // Update status when recording changes
  useEffect(() => {
    if (isRecording) {
      setProcessingStatus('recording');
    } else if (audioBlob && processingStatus === 'recording') {
      setProcessingStatus('recorded');
    }
  }, [isRecording, audioBlob]);

  const loadReferenceAudio = async () => {
    const text = currentSection === "repeat" 
      ? (currentItem as RepeatItem).referenceText 
      : (currentItem as MinimalPairItem).target;
    
    setIsLoadingReference(true);
    setReferenceAudioUrl(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/french-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text, speed: 0.9, stability: 0.5 }),
        }
      );

      if (!response.ok) throw new Error("Failed to load audio");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setReferenceAudioUrl(url);
    } catch (error) {
      console.error("Error loading reference audio:", error);
    } finally {
      setIsLoadingReference(false);
    }
  };

  const playReferenceAudio = () => {
    if (!referenceAudioUrl || !referenceAudioRef.current) return;

    if (isPlayingReference) {
      referenceAudioRef.current.pause();
      referenceAudioRef.current.currentTime = 0;
      setIsPlayingReference(false);
    } else {
      referenceAudioRef.current.play();
      setIsPlayingReference(true);
    }
  };

  const handleRecordingSubmit = async () => {
    if (!audioBlob) return;
    
    setProcessingStatus('uploading');
    setShowFeedback(false);
    toast.info('Sending audio for analysis...');

    try {
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Audio = btoa(binary);

      const referenceText = currentSection === "reading" 
        ? (currentItem as ReadingItem).referenceText
        : currentSection === "repeat"
          ? (currentItem as RepeatItem).referenceText
          : (currentItem as MinimalPairItem).target;

      setProcessingStatus('processing');
      toast.info('Analyzing pronunciation...');

      // Call enhanced pronunciation API
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-pronunciation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            audio: base64Audio,
            referenceText,
            itemId: currentItem.id,
            audioFormat: audioBlob.type || 'audio/webm',
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Assessment failed');
      }

      setProcessingStatus('analyzed');
      const result = await response.json();
      
      console.log('[Pronunciation] Full result:', result);
      
      // Set provider from result
      setCurrentProvider(result.provider);
      
      toast.success(`Analysis complete (${result.provider === 'speechsuper' ? 'SpeechSuper' : 'Azure'})`);

      // Increment attempt count
      const attemptNumber = (attemptCounts[currentItem.id] || 0) + 1;
      setAttemptCounts(prev => ({ ...prev, [currentItem.id]: attemptNumber }));

      // Store result
      const itemResult = {
        ...result,
        itemId: currentItem.id,
        section: currentSection,
        attemptNumber,
      };

      setResults((prev) => {
        const filtered = prev.filter(r => r.itemId !== currentItem.id);
        return [...filtered, itemResult];
      });
      
      setCurrentResult(itemResult);
      setShowFeedback(true);
      setProcessingStatus('complete');
      
    } catch (error) {
      console.error("Pronunciation assessment error:", error);
      setProcessingStatus('error');
      toast.error(error instanceof Error ? error.message : "Assessment failed. Please try again.");
    }
  };

  const handleMinimalPairSelect = (option: string) => {
    setSelectedOption(option);
    setShowMinimalPairResult(true);

    const correct = option === (currentItem as MinimalPairItem).target;
    const score = correct ? 100 : 0;

    const attemptNumber = (attemptCounts[currentItem.id] || 0) + 1;
    setAttemptCounts(prev => ({ ...prev, [currentItem.id]: attemptNumber }));

    const itemResult = {
      itemId: currentItem.id,
      section: "minimalPairs",
      scores: { overall: score, accuracy: score, fluency: 100, completeness: 100 },
      attemptNumber,
      success: correct,
    };

    setResults((prev) => {
      const filtered = prev.filter(r => r.itemId !== currentItem.id);
      return [...filtered, itemResult];
    });

    setTimeout(() => {
      setSelectedOption(null);
      setShowMinimalPairResult(false);
      advanceToNext();
    }, 1500);
  };

  const advanceToNext = () => {
    resetRecording();
    setShowFeedback(false);
    setCurrentResult(null);
    setProcessingStatus('idle');
    setCurrentProvider(null);
    
    if (currentIndex < currentItems.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      if (currentSection === "reading") {
        setCurrentSection("repeat");
        setCurrentIndex(0);
      } else if (currentSection === "repeat") {
        setCurrentSection("minimalPairs");
        setCurrentIndex(0);
      } else {
        onComplete(results);
      }
    }
  };

  const handleTryAgain = () => {
    resetRecording();
    setShowFeedback(false);
    setCurrentResult(null);
    setProcessingStatus('idle');
  };

  const getSectionIcon = (section: Section) => {
    switch (section) {
      case "reading": return <BookOpen className="h-5 w-5" />;
      case "repeat": return <Repeat className="h-5 w-5" />;
      case "minimalPairs": return <Gamepad2 className="h-5 w-5" />;
    }
  };

  const getSectionTitle = (section: Section) => {
    switch (section) {
      case "reading": return "Reading Aloud";
      case "repeat": return "Listen & Repeat";
      case "minimalPairs": return "Minimal Pairs Game";
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">🎯 Pronunciation Assessment 2.0</h1>
            <div className="flex items-center gap-2">
              {getSectionIcon(currentSection)}
              <span className="text-sm font-medium">{getSectionTitle(currentSection)}</span>
            </div>
          </div>
          <Progress value={progress} className="h-2 mb-2" />
          <p className="text-sm text-muted-foreground">
            {completedItems} of {totalItems} items complete
          </p>
        </div>

        {/* Status Indicator */}
        {processingStatus !== 'idle' && processingStatus !== 'complete' && (
          <div className="mb-6">
            <StatusIndicator status={processingStatus} provider={currentProvider} />
          </div>
        )}

        {/* Recording error */}
        {recordingError && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <div className="font-semibold text-destructive mb-1">Recording Error</div>
              <p className="text-sm text-destructive">{recordingError}</p>
            </div>
          </div>
        )}

        {/* Hidden audio element */}
        {referenceAudioUrl && (
          <audio
            ref={referenceAudioRef}
            src={referenceAudioUrl}
            onEnded={() => setIsPlayingReference(false)}
          />
        )}

        {/* READING SECTION */}
        {currentSection === "reading" && currentItem && !showFeedback && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Focus: {(currentItem as ReadingItem).focus.join(", ")}
                  </Badge>
                  {currentAttemptCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Attempt {currentAttemptCount}/2
                    </Badge>
                  )}
                  {processingStatus !== 'idle' && (
                    <StatusBadge status={processingStatus} provider={currentProvider} />
                  )}
                </div>
              </div>
              <CardTitle className="text-2xl leading-relaxed">
                {(currentItem as ReadingItem).referenceText}
              </CardTitle>
              <p className="text-sm text-muted-foreground">📢 Read this text aloud clearly (Enhanced Debug Mode Active)</p>
            </CardHeader>
            <CardContent>
              <RecordingControls
                isRecording={isRecording}
                isProcessing={processingStatus !== 'idle' && processingStatus !== 'recorded'}
                audioBlob={audioBlob}
                recordingTime={recordingTime}
                startRecording={startRecording}
                stopRecording={stopRecording}
                resetRecording={resetRecording}
                onSubmit={handleRecordingSubmit}
              />
            </CardContent>
          </Card>
        )}

        {/* REPEAT SECTION */}
        {currentSection === "repeat" && currentItem && !showFeedback && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Focus: {(currentItem as RepeatItem).focus.join(", ")}
                  </Badge>
                  {currentAttemptCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Attempt {currentAttemptCount}/2
                    </Badge>
                  )}
                  {processingStatus !== 'idle' && (
                    <StatusBadge status={processingStatus} provider={currentProvider} />
                  )}
                </div>
              </div>
              <CardTitle className="text-xl">Listen carefully, then repeat:</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Play button */}
              <div className="flex justify-center">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={playReferenceAudio}
                  disabled={!referenceAudioUrl || isLoadingReference}
                  className="h-20 w-20 rounded-full"
                >
                  {isLoadingReference ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : isPlayingReference ? (
                    <Pause className="h-8 w-8" />
                  ) : (
                    <Volume2 className="h-8 w-8" />
                  )}
                </Button>
              </div>

              <RecordingControls
                isRecording={isRecording}
                isProcessing={processingStatus !== 'idle' && processingStatus !== 'recorded'}
                audioBlob={audioBlob}
                recordingTime={recordingTime}
                startRecording={startRecording}
                stopRecording={stopRecording}
                resetRecording={resetRecording}
                onSubmit={handleRecordingSubmit}
              />
            </CardContent>
          </Card>
        )}

        {/* MINIMAL PAIRS GAME */}
        {currentSection === "minimalPairs" && currentItem && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-2 text-sm mb-2">
                <Badge variant="outline">
                  Focus: {(currentItem as MinimalPairItem).focus.join(", ")}
                </Badge>
              </div>
              <CardTitle className="text-xl">Which word do you hear?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={playReferenceAudio}
                  disabled={!referenceAudioUrl || isLoadingReference || showMinimalPairResult}
                  className="h-20 w-20 rounded-full"
                >
                  {isLoadingReference ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : isPlayingReference ? (
                    <Pause className="h-8 w-8" />
                  ) : (
                    <Volume2 className="h-8 w-8" />
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {(currentItem as MinimalPairItem).options.map((option) => {
                  const isSelected = selectedOption === option;
                  const isCorrect = option === (currentItem as MinimalPairItem).target;
                  
                  let buttonVariant: "default" | "outline" | "destructive" = "outline";
                  if (showMinimalPairResult) {
                    if (isCorrect) buttonVariant = "default";
                    else if (isSelected) buttonVariant = "destructive";
                  }

                  return (
                    <Button
                      key={option}
                      size="lg"
                      variant={buttonVariant}
                      onClick={() => handleMinimalPairSelect(option)}
                      disabled={showMinimalPairResult}
                      className="h-16 text-xl font-medium"
                    >
                      {option}
                      {showMinimalPairResult && isCorrect && (
                        <Check className="h-5 w-5 ml-2" />
                      )}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ENHANCED FEEDBACK DISPLAY */}
        {showFeedback && currentResult && (
          <div className="space-y-6">
            <EnhancedFeedbackDisplay
              result={currentResult}
              onContinue={advanceToNext}
              onTryAgain={maxAttemptsReached ? null : handleTryAgain}
              attemptNumber={currentAttemptCount}
            />

            {/* Debug Panel - Always Available */}
            <PronunciationDebugPanel result={currentResult} isOpen={true} />
          </div>
        )}

        {onSkip && <SkipButton onClick={onSkip} />}
      </div>
    </div>
  );
};

// Recording controls component
interface RecordingControlsProps {
  isRecording: boolean;
  isProcessing: boolean;
  audioBlob: Blob | null;
  recordingTime: number;
  startRecording: () => void;
  stopRecording: () => void;
  resetRecording: () => void;
  onSubmit: () => void;
}

function RecordingControls({
  isRecording,
  isProcessing,
  audioBlob,
  recordingTime,
  startRecording,
  stopRecording,
  resetRecording,
  onSubmit,
}: RecordingControlsProps) {
  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="text-3xl font-mono tabular-nums">
        {formatTime(recordingTime)}
      </div>

      <div className="flex items-center gap-4">
        {!isRecording && !audioBlob && (
          <Button
            size="lg"
            onClick={startRecording}
            className="h-16 w-16 rounded-full"
            disabled={isProcessing}
          >
            <Mic className="h-6 w-6" />
          </Button>
        )}

        {isRecording && (
          <Button
            size="lg"
            variant="destructive"
            onClick={stopRecording}
            className="h-16 w-16 rounded-full animate-pulse"
          >
            <Square className="h-6 w-6" />
          </Button>
        )}

        {audioBlob && !isRecording && (
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={resetRecording} disabled={isProcessing}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Redo
            </Button>
            <Button onClick={onSubmit} disabled={isProcessing} size="lg">
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Submit
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PronunciationModuleEnhanced;

