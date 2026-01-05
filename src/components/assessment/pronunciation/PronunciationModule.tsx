import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useAudioRecorder, formatTime } from "@/hooks/useAudioRecorder";
import { 
  Mic, 
  Square, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  Check, 
  Loader2,
  AlertCircle,
  ChevronRight,
  BookOpen,
  Repeat,
  Gamepad2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import SkipButton from "../SkipButton";
import { useAdminMode } from "@/hooks/useAdminMode";
import { 
  READING_ITEMS, 
  REPEAT_ITEMS, 
  MINIMAL_PAIR_ITEMS,
  SCORING_WEIGHTS,
  getHeatmapColor,
  getRandomMinimalPairs,
  type ReadingItem,
  type RepeatItem,
  type MinimalPairItem
} from "./pronunciationItems";

type Section = "reading" | "repeat" | "minimalPairs";

interface WordScore {
  word: string;
  accuracyScore: number;
  errorType: string;
  color: "green" | "yellow" | "red";
}

interface ItemResult {
  itemId: string;
  section: Section;
  pronScore: number;
  accuracyScore: number;
  words?: WordScore[];
  attemptNumber: number;
}

interface PronunciationModuleProps {
  sessionId: string;
  onComplete: (results: ItemResult[]) => void;
  onSkip?: () => void;
}

const PronunciationModule = ({ sessionId, onComplete, onSkip }: PronunciationModuleProps) => {
  const { isAdmin, isDev } = useAdminMode();
  
  // Section state
  const [currentSection, setCurrentSection] = useState<Section>("reading");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<ItemResult[]>([]);
  
  // Minimal pairs game state
  const [minimalPairItems] = useState(() => getRandomMinimalPairs(6));
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showMinimalPairResult, setShowMinimalPairResult] = useState(false);
  
  // Audio state
  const [isPlayingReference, setIsPlayingReference] = useState(false);
  const [isLoadingReference, setIsLoadingReference] = useState(false);
  const [referenceAudioUrl, setReferenceAudioUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastWordScores, setLastWordScores] = useState<WordScore[] | null>(null);
  
  // Feedback state - NEW
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentResult, setCurrentResult] = useState<ItemResult | null>(null);
  const [attemptCounts, setAttemptCounts] = useState<Record<string, number>>({});
  
  // Debug/Dev mode state
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [devModeEnabled, setDevModeEnabled] = useState(true); // Toggle for dev features
  
  // Computed: show dev features only if toggle is on AND user is admin/dev
  const showDevFeatures = devModeEnabled && (isAdmin || isDev);
  
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
  
  // Get attempt count for current item (AFTER currentItem is defined)
  const currentAttemptCount = attemptCounts[currentItem?.id] || 0;
  const maxAttemptsReached = currentAttemptCount >= 2;
  
  // Calculate overall progress
  const totalItems = READING_ITEMS.length + REPEAT_ITEMS.length + minimalPairItems.length;
  const completedItems = results.length;
  const progress = (completedItems / totalItems) * 100;

  // Load reference audio for repeat section
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
    
    setIsProcessing(true);
    setLastWordScores(null);
    setShowFeedback(false); // Clear previous feedback

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

      // Call Azure Speech assessment
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

      if (!response.ok) throw new Error("Assessment failed");

      const result = await response.json();
      
      // Store debug info
      console.log('[Pronunciation] Full API response:', result);
      setDebugInfo({
        ...result,
        timestamp: new Date().toISOString(),
        itemId: currentItem.id,
        referenceText,
      });
      
      // Process word scores
      const wordScores: WordScore[] = (result.words || []).map((w: any) => ({
        word: w.word,
        accuracyScore: w.accuracyScore,
        errorType: w.errorType,
        color: getHeatmapColor(w.accuracyScore),
      }));

      setLastWordScores(wordScores);

      // FIX: Use accuracyScore if pronScore is 0 (backend bug)
      const finalScore = result.pronScore || result.accuracyScore || 0;

      // Increment attempt count
      const attemptNumber = (attemptCounts[currentItem.id] || 0) + 1;
      setAttemptCounts(prev => ({ ...prev, [currentItem.id]: attemptNumber }));

      // Store result
      const itemResult: ItemResult = {
        itemId: currentItem.id,
        section: currentSection,
        pronScore: finalScore,
        accuracyScore: result.accuracyScore || 0,
        words: wordScores,
        attemptNumber,
      };

      setResults((prev) => {
        // Replace previous attempt if exists, otherwise add
        const filtered = prev.filter(r => r.itemId !== currentItem.id);
        return [...filtered, itemResult];
      });
      
      // Show feedback immediately on same page
      setCurrentResult(itemResult);
      setShowFeedback(true);
      
      // DON'T auto-advance - wait for user to click Continue
      
    } catch (error) {
      console.error("Pronunciation assessment error:", error);
      toast.error("Assessment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMinimalPairSelect = (option: string) => {
    setSelectedOption(option);
    setShowMinimalPairResult(true);

    const correct = option === (currentItem as MinimalPairItem).target;
    const score = correct ? 100 : 0;

    // Increment attempt count
    const attemptNumber = (attemptCounts[currentItem.id] || 0) + 1;
    setAttemptCounts(prev => ({ ...prev, [currentItem.id]: attemptNumber }));

    const itemResult: ItemResult = {
      itemId: currentItem.id,
      section: "minimalPairs",
      pronScore: score,
      accuracyScore: score,
      attemptNumber,
    };

    setResults((prev) => {
      const filtered = prev.filter(r => r.itemId !== currentItem.id);
      return [...filtered, itemResult];
    });

    // Auto-advance after 1.5s
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
    setLastWordScores(null);
    
    if (currentIndex < currentItems.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Move to next section or complete
      if (currentSection === "reading") {
        setCurrentSection("repeat");
        setCurrentIndex(0);
      } else if (currentSection === "repeat") {
        setCurrentSection("minimalPairs");
        setCurrentIndex(0);
      } else {
        // Calculate final scores
        calculateAndComplete();
      }
    }
  };

  const handleTryAgain = () => {
    resetRecording();
    setShowFeedback(false);
    setCurrentResult(null);
    setLastWordScores(null);
  };

  const calculateAndComplete = () => {
    const readingScores = results.filter(r => r.section === "reading").map(r => r.pronScore);
    const repeatScores = results.filter(r => r.section === "repeat").map(r => r.pronScore);
    const minpairScores = results.filter(r => r.section === "minimalPairs").map(r => r.pronScore);

    const readingAvg = readingScores.length ? readingScores.reduce((a, b) => a + b, 0) / readingScores.length : 0;
    const repeatAvg = repeatScores.length ? repeatScores.reduce((a, b) => a + b, 0) / repeatScores.length : 0;
    const minpairAvg = minpairScores.length ? minpairScores.reduce((a, b) => a + b, 0) / minpairScores.length : 0;

    const finalScore = 
      readingAvg * SCORING_WEIGHTS.reading + 
      repeatAvg * SCORING_WEIGHTS.repeat + 
      minpairAvg * SCORING_WEIGHTS.minimalPairs;

    console.log('[Pronunciation] Final scores:', { readingAvg, repeatAvg, minpairAvg, finalScore });
    onComplete(results);
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
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Pronunciation Test</h1>
              {/* Dev Mode Toggle - only visible to admins */}
              {(isAdmin || isDev) && (
                <div className="flex items-center gap-2 border rounded-lg px-2 py-1 bg-muted/50">
                  <Switch
                    id="dev-mode"
                    checked={devModeEnabled}
                    onCheckedChange={setDevModeEnabled}
                    className="scale-75"
                  />
                  <Label htmlFor="dev-mode" className="text-xs font-medium cursor-pointer">
                    Dev
                  </Label>
                </div>
              )}
              {showDevFeatures && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDebug(!showDebug)}
                  className="text-xs"
                >
                  {showDebug ? 'Hide Debug' : 'Debug'}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {getSectionIcon(currentSection)}
              <span>{getSectionTitle(currentSection)}</span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            {currentSection === "reading" && "Read the French text aloud"}
            {currentSection === "repeat" && "Listen, then repeat what you hear"}
            {currentSection === "minimalPairs" && "Listen and select the word you hear"}
          </p>
        </div>

        {/* Debug Panel - only when dev mode is enabled */}
        {showDevFeatures && showDebug && debugInfo && (
          <div className="mb-6 p-4 rounded-lg bg-muted border text-xs font-mono overflow-auto max-h-80">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-sm">Debug Info</span>
              <Button size="sm" variant="ghost" onClick={() => advanceToNext()}>
                Next Item →
              </Button>
            </div>
            <div className="space-y-2">
              <div><strong>Item:</strong> {debugInfo.itemId}</div>
              <div><strong>Reference:</strong> {debugInfo.referenceText}</div>
              <div><strong>Pron Score:</strong> {debugInfo.pronScore}</div>
              <div><strong>Accuracy:</strong> {debugInfo.accuracyScore}</div>
              <div><strong>Fluency:</strong> {debugInfo.fluencyScore}</div>
              <div><strong>Completeness:</strong> {debugInfo.completenessScore}</div>
              <div><strong>Audio Size:</strong> {debugInfo.debug?.audioSize} bytes</div>
              <div><strong>Audio Format:</strong> {debugInfo.debug?.audioFormat}</div>
              <details className="mt-2">
                <summary className="cursor-pointer font-bold">Raw Response</summary>
                <pre className="mt-2 whitespace-pre-wrap break-all text-[10px]">
                  {JSON.stringify(debugInfo.debug?.rawResponse, null, 2)}
                </pre>
              </details>
              <details className="mt-2">
                <summary className="cursor-pointer font-bold">Words ({debugInfo.words?.length || 0})</summary>
                <pre className="mt-2 whitespace-pre-wrap break-all text-[10px]">
                  {JSON.stringify(debugInfo.words, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )}

        {/* Recording error */}
        {recordingError && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-sm text-destructive">{recordingError}</p>
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
        {currentSection === "reading" && currentItem && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm text-primary">
                  <span>Focus: {(currentItem as ReadingItem).focus.join(", ")}</span>
                </div>
                {currentAttemptCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    Attempt {currentAttemptCount}/2
                  </Badge>
                )}
              </div>
              <CardTitle className="text-xl leading-relaxed">
                {(currentItem as ReadingItem).referenceText}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!showFeedback ? (
                <RecordingControls
                  isRecording={isRecording}
                  isProcessing={isProcessing}
                  audioBlob={audioBlob}
                  recordingTime={recordingTime}
                  startRecording={startRecording}
                  stopRecording={stopRecording}
                  resetRecording={resetRecording}
                  onSubmit={handleRecordingSubmit}
                />
              ) : (
                <FeedbackDisplay
                  result={currentResult!}
                  wordScores={lastWordScores}
                  onContinue={advanceToNext}
                  onTryAgain={maxAttemptsReached ? null : handleTryAgain}
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* REPEAT SECTION */}
        {currentSection === "repeat" && currentItem && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm text-primary">
                  <span>Focus: {(currentItem as RepeatItem).focus.join(", ")}</span>
                </div>
                {currentAttemptCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    Attempt {currentAttemptCount}/2
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg">Listen, then repeat:</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!showFeedback && (
                <>
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
                    isProcessing={isProcessing}
                    audioBlob={audioBlob}
                    recordingTime={recordingTime}
                    startRecording={startRecording}
                    stopRecording={stopRecording}
                    resetRecording={resetRecording}
                    onSubmit={handleRecordingSubmit}
                  />
                </>
              )}
              
              {showFeedback && (
                <FeedbackDisplay
                  result={currentResult!}
                  wordScores={lastWordScores}
                  onContinue={advanceToNext}
                  onTryAgain={maxAttemptsReached ? null : handleTryAgain}
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* MINIMAL PAIRS GAME */}
        {currentSection === "minimalPairs" && currentItem && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-2 text-sm text-primary mb-2">
                <span>Focus: {(currentItem as MinimalPairItem).focus.join(", ")}</span>
              </div>
              <CardTitle className="text-lg">Which word do you hear?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Play button */}
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

              {/* Options */}
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
            <Button onClick={onSubmit} disabled={isProcessing}>
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

// Word heatmap component
function WordHeatmap({ words }: { words: WordScore[] }) {
  return (
    <div className="mt-4 p-4 rounded-lg bg-muted/50">
      <p className="text-xs font-medium text-muted-foreground mb-2">Word accuracy:</p>
      <div className="flex flex-wrap gap-2">
        {words.map((w, i) => (
          <span
            key={i}
            className={`px-2 py-1 rounded text-sm font-medium ${
              w.color === "green" 
                ? "bg-green-500/20 text-green-700 dark:text-green-400" 
                : w.color === "yellow"
                  ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
                  : "bg-red-500/20 text-red-700 dark:text-red-400"
            }`}
            title={`${w.accuracyScore}% - ${w.errorType}`}
          >
            {w.word}
          </span>
        ))}
      </div>
    </div>
  );
}

// Feedback display component
interface FeedbackDisplayProps {
  result: ItemResult;
  wordScores: WordScore[] | null;
  onContinue: () => void;
  onTryAgain: (() => void) | null;
}

function FeedbackDisplay({ result, wordScores, onContinue, onTryAgain }: FeedbackDisplayProps) {
  const score = result.pronScore;
  const isGood = score >= 75;
  const isOk = score >= 50 && score < 75;
  const needsWork = score < 50;

  return (
    <div className="space-y-6">
      {/* Score Display */}
      <div className={`p-6 rounded-xl text-center ${
        isGood ? 'bg-green-500/10 border border-green-500/20' :
        isOk ? 'bg-yellow-500/10 border border-yellow-500/20' :
        'bg-red-500/10 border border-red-500/20'
      }`}>
        <div className="mb-4">
          {isGood ? (
            <Check className="h-12 w-12 text-green-500 mx-auto mb-2" />
          ) : isOk ? (
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
          ) : (
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
          )}
          <h3 className="text-2xl font-bold mb-2">
            {isGood ? 'Excellent!' : isOk ? 'Good effort!' : 'Keep practicing!'}
          </h3>
          <p className="text-4xl font-bold mb-2">
            {Math.round(score)}<span className="text-2xl text-muted-foreground">/100</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Accuracy: {Math.round(result.accuracyScore)}%
          </p>
        </div>

        {/* Encouragement Message */}
        <p className="text-sm">
          {isGood && "Your pronunciation is spot on! Great job with those sounds."}
          {isOk && "You're on the right track. A few sounds need fine-tuning."}
          {needsWork && "Don't worry, pronunciation takes practice. Focus on the highlighted words."}
        </p>
      </div>

      {/* Word Heatmap */}
      {wordScores && wordScores.length > 0 && <WordHeatmap words={wordScores} />}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {onTryAgain && (
          <Button
            variant="outline"
            size="lg"
            onClick={onTryAgain}
            className="flex-1"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Try Again {result.attemptNumber === 1 ? '(1 more chance)' : ''}
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

      {result.attemptNumber === 2 && (
        <p className="text-xs text-center text-muted-foreground">
          Maximum attempts reached. Moving forward helps get a complete assessment.
        </p>
      )}
    </div>
  );
}

export default PronunciationModule;
