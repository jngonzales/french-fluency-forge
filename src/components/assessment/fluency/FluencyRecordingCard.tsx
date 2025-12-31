import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAudioRecorder, formatTime } from "@/hooks/useAudioRecorder";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mic, 
  Square, 
  Loader2, 
  AlertCircle, 
  Check,
  RotateCcw,
  ChevronRight,
  ImageIcon
} from "lucide-react";
import type { FluencyPictureCard } from "./fluencyPictureCards";

export type RecordingState = 
  | "ready" 
  | "countdown" 
  | "recording" 
  | "uploading" 
  | "processing" 
  | "done" 
  | "error";

interface Props {
  card: FluencyPictureCard;
  questionNumber: number;
  totalQuestions: number;
  attemptCount: number;
  onRecordingComplete: (blob: Blob, duration: number) => Promise<void>;
  onNext: () => void;
  onRedo: () => void;
  isLast: boolean;
  recordingState: RecordingState;
  setRecordingState: (state: RecordingState) => void;
  errorMessage?: string;
  score?: number;
  speedSubscore?: number;
  pauseSubscore?: number;
}

const RECORDING_DURATION = 45; // seconds

export function FluencyRecordingCard({
  card,
  questionNumber,
  totalQuestions,
  attemptCount,
  onRecordingComplete,
  onNext,
  onRedo,
  isLast,
  recordingState,
  setRecordingState,
  errorMessage,
  score,
  speedSubscore,
  pauseSubscore,
}: Props) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    isRecording,
    recordingTime,
    audioBlob,
    error: recordingError,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder({ 
    maxDuration: RECORDING_DURATION,
    onRecordingComplete: () => {}
  });

  const remainingTime = RECORDING_DURATION - recordingTime;

  // Reset image state when card changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [card.id]);

  // Cleanup countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  // Handle recording completion
  useEffect(() => {
    if (audioBlob && !isRecording && recordingState === "recording") {
      handleRecordingFinished();
    }
  }, [audioBlob, isRecording, recordingState]);

  const startWithCountdown = () => {
    setRecordingState("countdown");
    setCountdown(3);
    
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownIntervalRef.current!);
          setCountdown(null);
          setRecordingState("recording");
          startRecording();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleStopRecording = () => {
    stopRecording();
  };

  const handleRecordingFinished = async () => {
    if (!audioBlob) return;
    
    setRecordingState("uploading");
    
    try {
      await onRecordingComplete(audioBlob, recordingTime);
      setRecordingState("done");
    } catch (error) {
      console.error("Error processing recording:", error);
      setRecordingState("error");
    }
  };

  const handleRedo = () => {
    resetRecording();
    onRedo();
  };

  const handleTryAgain = () => {
    resetRecording();
    setRecordingState("ready");
  };

  // Convert OpenClipart detail URL to actual image URL
  const getImageUrl = (url: string): string => {
    // OpenClipart detail URLs need to be converted to actual image URLs
    // Format: https://openclipart.org/detail/191160/messy-room
    // Actual: https://openclipart.org/image/800px/191160
    const match = url.match(/\/detail\/(\d+)/);
    if (match) {
      return `https://openclipart.org/image/400px/${match[1]}`;
    }
    return url;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            Picture {questionNumber} of {totalQuestions}
          </span>
          {attemptCount > 1 && (
            <span className="text-xs text-muted-foreground">
              Attempt #{attemptCount}
            </span>
          )}
        </div>
        <CardTitle className="text-lg">{card.promptFr}</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Picture Card Image */}
        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          {imageError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <ImageIcon className="h-12 w-12 mb-2" />
              <p className="text-sm">Image unavailable</p>
            </div>
          )}
          <img
            src={getImageUrl(card.image)}
            alt="Speaking prompt"
            className={`w-full h-full object-contain transition-opacity duration-300 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        </div>

        {/* Follow-up question hint */}
        <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Question suivante :
          </p>
          <p className="text-sm text-foreground">{card.followupFr}</p>
        </div>

        {/* Recording Error */}
        {(recordingError || recordingState === "error") && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-destructive font-medium">
                  {recordingError || errorMessage || "Something went wrong with the recording"}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                  onClick={handleTryAgain}
                >
                  <RotateCcw className="h-3 w-3 mr-2" />
                  Try again
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main Recording Area */}
        <div className="flex flex-col items-center py-4">
          <AnimatePresence mode="wait">
            {/* Countdown */}
            {recordingState === "countdown" && countdown !== null && (
              <motion.div
                key="countdown"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                className="text-7xl font-bold text-primary"
              >
                {countdown}
              </motion.div>
            )}

            {/* Ready State */}
            {recordingState === "ready" && (
              <motion.div
                key="ready"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center gap-4"
              >
                <Button
                  size="lg"
                  onClick={startWithCountdown}
                  className="h-20 w-20 rounded-full"
                >
                  <Mic className="h-8 w-8" />
                </Button>
                <p className="text-sm text-muted-foreground">
                  Parle pendant {RECORDING_DURATION} secondes maximum
                </p>
              </motion.div>
            )}

            {/* Recording */}
            {recordingState === "recording" && (
              <motion.div
                key="recording"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4 w-full"
              >
                <div className="text-5xl font-mono tabular-nums text-primary">
                  {formatTime(remainingTime)}
                </div>
                
                <div className="w-full max-w-xs">
                  <Progress 
                    value={(recordingTime / RECORDING_DURATION) * 100} 
                    className="h-2"
                  />
                </div>
                
                <div className="flex items-center gap-2 text-destructive">
                  <span className="h-3 w-3 rounded-full bg-destructive animate-pulse" />
                  <span className="text-sm font-medium">Enregistrement...</span>
                </div>
                
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={handleStopRecording}
                  className="h-16 w-16 rounded-full"
                >
                  <Square className="h-6 w-6" />
                </Button>
                
                <p className="text-xs text-muted-foreground">
                  Clique pour arrêter ou attends la fin automatique
                </p>
              </motion.div>
            )}

            {/* Uploading/Processing */}
            {(recordingState === "uploading" || recordingState === "processing") && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                </div>
                <div className="text-center">
                  <p className="font-medium">
                    {recordingState === "uploading" ? "Envoi..." : "Analyse..."}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Ne ferme pas cette page
                  </p>
                </div>
              </motion.div>
            )}

            {/* Done */}
            {recordingState === "done" && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4 w-full"
              >
                <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Check className="h-10 w-10 text-green-500" />
                </div>
                <p className="font-medium text-green-600 dark:text-green-400">
                  Enregistrement sauvegardé !
                </p>
                
                {/* Score display */}
                {score !== undefined && (
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>Score: <strong className="text-foreground">{score}/100</strong></span>
                    {speedSubscore !== undefined && (
                      <span>Vitesse: {speedSubscore}/60</span>
                    )}
                    {pauseSubscore !== undefined && (
                      <span>Pauses: {pauseSubscore}/40</span>
                    )}
                  </div>
                )}
                
                <div className="flex flex-col gap-2 w-full max-w-xs mt-4">
                  <Button 
                    size="lg" 
                    onClick={onNext}
                    className="w-full"
                  >
                    {isLast ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Terminer Fluency
                      </>
                    ) : (
                      <>
                        Image suivante
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleRedo}
                    className="w-full"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Refaire cette réponse
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
