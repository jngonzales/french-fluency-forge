import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAudioRecorder, formatTime } from "@/hooks/useAudioRecorder";
import { toast } from "sonner";
import { 
  Mic, 
  Square, 
  Play, 
  Pause, 
  RotateCcw, 
  Check, 
  Loader2,
  AlertCircle,
  ChevronRight,
  Timer,
  Clock
} from "lucide-react";

// 2 fluency prompts - open-ended speaking tasks
const FLUENCY_PROMPTS = [
  {
    id: "fluency-1",
    prompt: "Describe your typical morning routine",
    promptFr: "Décrivez votre routine matinale typique",
    duration: 60, // seconds
    tips: [
      "What time do you wake up?",
      "What do you eat for breakfast?",
      "How do you get ready for the day?",
    ],
  },
  {
    id: "fluency-2",
    prompt: "Tell me about your favorite place to visit",
    promptFr: "Parlez-moi de votre endroit préféré à visiter",
    duration: 60, // seconds
    tips: [
      "Where is this place?",
      "Why do you like it?",
      "What can you do there?",
    ],
  },
];

interface FluencyItemResult {
  itemId: string;
  audioBlob: Blob;
  transcript?: string;
  wordCount?: number;
  duration?: number;
  wpm?: number;
  pauseCount?: number;
  totalPauseDuration?: number;
  status: "pending" | "processing" | "completed" | "error";
}

interface FluencyModuleProps {
  sessionId: string;
  onComplete: (results: FluencyItemResult[]) => void;
}

const FluencyModule = ({ sessionId, onComplete }: FluencyModuleProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<FluencyItemResult[]>([]);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCountingDown, setIsCountingDown] = useState(false);
  
  const recordingAudioRef = useRef<HTMLAudioElement | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentPrompt = FLUENCY_PROMPTS[currentIndex];
  const progress = ((currentIndex) / FLUENCY_PROMPTS.length) * 100;

  const {
    isRecording,
    recordingTime,
    audioBlob,
    audioUrl,
    error: recordingError,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder({ 
    maxDuration: currentPrompt.duration,
    onRecordingComplete: () => {
      toast.info("Time's up! Recording stopped automatically.");
    }
  });

  const remainingTime = currentPrompt.duration - recordingTime;

  // Cleanup countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  const startWithCountdown = () => {
    setIsCountingDown(true);
    setCountdown(3);
    
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownIntervalRef.current!);
          setIsCountingDown(false);
          setCountdown(null);
          startRecording();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const playRecording = () => {
    if (!audioUrl || !recordingAudioRef.current) return;

    if (isPlayingRecording) {
      recordingAudioRef.current.pause();
      recordingAudioRef.current.currentTime = 0;
      setIsPlayingRecording(false);
    } else {
      recordingAudioRef.current.play();
      setIsPlayingRecording(true);
    }
  };

  const handleSubmitItem = async () => {
    if (!audioBlob) {
      toast.error("Please record your response first");
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Audio = btoa(binary);

      // Send to fluency analysis service
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-fluency`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            audio: base64Audio,
            itemId: currentPrompt.id,
            recordingDuration: recordingTime,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to analyze recording");
      }

      const result = await response.json();

      // Store result
      const itemResult: FluencyItemResult = {
        itemId: currentPrompt.id,
        audioBlob,
        transcript: result.transcript,
        wordCount: result.wordCount,
        duration: result.duration,
        wpm: result.wpm,
        pauseCount: result.pauseCount,
        totalPauseDuration: result.totalPauseDuration,
        status: "completed",
      };

      setResults((prev) => [...prev, itemResult]);

      // Show fluency stats
      if (result.wpm) {
        toast.success(`Speech rate: ${result.wpm} words per minute`);
      }

      // Move to next item or complete
      if (currentIndex < FLUENCY_PROMPTS.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        resetRecording();
      } else {
        // All items complete
        const allResults = [...results, itemResult];
        onComplete(allResults);
      }
    } catch (error) {
      console.error("Error submitting item:", error);
      toast.error("Failed to analyze recording. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format remaining time as MM:SS
  const formatRemainingTime = (seconds: number) => {
    const mins = Math.floor(Math.max(0, seconds) / 60);
    const secs = Math.max(0, seconds) % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold">Fluency</h1>
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} of {FLUENCY_PROMPTS.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            Speak freely about the topic. Take your time and express your thoughts naturally.
          </p>
        </div>

        {/* Recording error */}
        {recordingError && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{recordingError}</p>
          </div>
        )}

        {/* Current prompt card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-medium">
              {currentPrompt.promptFr}
            </CardTitle>
            <CardDescription className="italic">
              {currentPrompt.prompt}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Prompt tips */}
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Ideas to help you:
              </p>
              <ul className="space-y-1">
                {currentPrompt.tips.map((tip, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Timer display */}
            <div className="flex items-center justify-center gap-2 py-2">
              <Timer className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {currentPrompt.duration} seconds to speak
              </span>
            </div>

            {/* Hidden audio element */}
            {audioUrl && (
              <audio
                ref={recordingAudioRef}
                src={audioUrl}
                onEnded={() => setIsPlayingRecording(false)}
              />
            )}
          </CardContent>
        </Card>

        {/* Recording controls */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-6">
              {/* Countdown overlay */}
              {isCountingDown && countdown !== null && (
                <div className="text-6xl font-bold text-primary animate-pulse">
                  {countdown}
                </div>
              )}

              {/* Timer display */}
              {!isCountingDown && (
                <div className="text-center">
                  <div className="text-3xl font-mono tabular-nums">
                    {formatTime(recordingTime)}
                  </div>
                  {isRecording && (
                    <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{formatRemainingTime(remainingTime)} remaining</span>
                    </div>
                  )}
                </div>
              )}

              {/* Recording progress bar */}
              {isRecording && (
                <div className="w-full">
                  <Progress 
                    value={(recordingTime / currentPrompt.duration) * 100} 
                    className="h-2"
                  />
                </div>
              )}

              {/* Main controls */}
              {!isCountingDown && (
                <div className="flex items-center gap-4">
                  {!isRecording && !audioBlob && (
                    <Button
                      size="lg"
                      onClick={startWithCountdown}
                      className="h-16 w-16 rounded-full"
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

                  {!isRecording && audioBlob && (
                    <>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={playRecording}
                        className="h-14 w-14 rounded-full"
                      >
                        {isPlayingRecording ? (
                          <Pause className="h-5 w-5" />
                        ) : (
                          <Play className="h-5 w-5" />
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="lg"
                        onClick={resetRecording}
                        className="h-14 w-14 rounded-full"
                      >
                        <RotateCcw className="h-5 w-5" />
                      </Button>
                    </>
                  )}
                </div>
              )}

              {/* Status text */}
              <p className="text-sm text-muted-foreground">
                {isCountingDown
                  ? "Get ready..."
                  : isRecording
                    ? "Speaking... Click to stop early"
                    : audioBlob
                      ? "Review your recording or re-record"
                      : "Click the microphone when ready"}
              </p>

              {/* Submit button */}
              {audioBlob && !isRecording && (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleSubmitItem}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : currentIndex < FLUENCY_PROMPTS.length - 1 ? (
                    <>
                      Submit & Continue
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Complete Fluency
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <div className="mt-6 p-4 rounded-lg bg-muted/50 text-sm">
          <h3 className="font-medium mb-2">Tips for fluency:</h3>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Speak naturally - don't worry about perfection</li>
            <li>• Use connecting words like "et", "mais", "alors"</li>
            <li>• It's okay to pause and think</li>
            <li>• Try to speak for the full time if you can</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FluencyModule;
