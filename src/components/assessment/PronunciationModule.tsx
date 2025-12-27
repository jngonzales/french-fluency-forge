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
  Volume2, 
  Check, 
  Loader2,
  AlertCircle,
  ChevronRight
} from "lucide-react";
import SkipButton from "./SkipButton";

// 6 pronunciation sentences - French-French neutral
const PRONUNCIATION_ITEMS = [
  {
    id: "pron-1",
    text: "Bonjour, je voudrais un café s'il vous plaît.",
    translation: "Hello, I would like a coffee please.",
  },
  {
    id: "pron-2", 
    text: "Est-ce que vous pourriez me dire où se trouve la gare?",
    translation: "Could you tell me where the train station is?",
  },
  {
    id: "pron-3",
    text: "Je suis désolé, je n'ai pas bien compris.",
    translation: "I'm sorry, I didn't understand well.",
  },
  {
    id: "pron-4",
    text: "Qu'est-ce que vous me conseillez comme plat du jour?",
    translation: "What would you recommend as today's special?",
  },
  {
    id: "pron-5",
    text: "J'aimerais prendre rendez-vous pour la semaine prochaine.",
    translation: "I would like to make an appointment for next week.",
  },
  {
    id: "pron-6",
    text: "Excusez-moi, est-ce que cette place est libre?",
    translation: "Excuse me, is this seat free?",
  },
];

interface PronunciationItemResult {
  itemId: string;
  audioBlob: Blob;
  transcript?: string;
  similarity?: number;
  status: "pending" | "processing" | "completed" | "error";
}

interface PronunciationModuleProps {
  sessionId: string;
  onComplete: (results: PronunciationItemResult[]) => void;
  onSkip?: () => void;
}

const PronunciationModule = ({ sessionId, onComplete, onSkip }: PronunciationModuleProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<PronunciationItemResult[]>([]);
  const [isPlayingReference, setIsPlayingReference] = useState(false);
  const [isLoadingReference, setIsLoadingReference] = useState(false);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referenceAudioUrl, setReferenceAudioUrl] = useState<string | null>(null);
  
  const referenceAudioRef = useRef<HTMLAudioElement | null>(null);
  const recordingAudioRef = useRef<HTMLAudioElement | null>(null);

  const currentItem = PRONUNCIATION_ITEMS[currentIndex];
  const progress = ((currentIndex) / PRONUNCIATION_ITEMS.length) * 100;

  const {
    isRecording,
    recordingTime,
    audioBlob,
    audioUrl,
    error: recordingError,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder({ maxDuration: 30 });

  // Load reference audio for current item
  useEffect(() => {
    loadReferenceAudio();
    return () => {
      if (referenceAudioUrl) {
        URL.revokeObjectURL(referenceAudioUrl);
      }
    };
  }, [currentIndex]);

  const loadReferenceAudio = async () => {
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
          body: JSON.stringify({ text: currentItem.text }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load reference audio");
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      setReferenceAudioUrl(url);
    } catch (error) {
      console.error("Error loading reference audio:", error);
      toast.error("Failed to load reference audio. You can still record.");
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
      toast.error("Please record your pronunciation first");
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

      // Send to transcription service
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-pronunciation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            audio: base64Audio,
            targetText: currentItem.text,
            itemId: currentItem.id,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to process recording");
      }

      const result = await response.json();

      // Store result
      const itemResult: PronunciationItemResult = {
        itemId: currentItem.id,
        audioBlob,
        transcript: result.transcript,
        similarity: result.similarity,
        status: "completed",
      };

      setResults((prev) => [...prev, itemResult]);

      // Move to next item or complete
      if (currentIndex < PRONUNCIATION_ITEMS.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        resetRecording();
        toast.success(`Item ${currentIndex + 1} completed!`);
      } else {
        // All items complete
        const allResults = [...results, itemResult];
        onComplete(allResults);
      }
    } catch (error) {
      console.error("Error submitting item:", error);
      toast.error("Failed to process recording. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold">Pronunciation</h1>
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} of {PRONUNCIATION_ITEMS.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            Listen to the reference, then record yourself saying the sentence.
          </p>
        </div>

        {/* Recording error */}
        {recordingError && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{recordingError}</p>
          </div>
        )}

        {/* Current sentence card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-medium leading-relaxed">
              {currentItem.text}
            </CardTitle>
            <CardDescription className="italic">
              {currentItem.translation}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Reference audio player */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={playReferenceAudio}
                disabled={!referenceAudioUrl || isLoadingReference}
                className="flex items-center gap-2"
              >
                {isLoadingReference ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isPlayingReference ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
                {isLoadingReference 
                  ? "Loading..." 
                  : isPlayingReference 
                    ? "Pause Reference" 
                    : "Play Reference"
                }
              </Button>
              <span className="text-xs text-muted-foreground">
                Listen first, then record
              </span>
            </div>

            {/* Hidden audio elements */}
            {referenceAudioUrl && (
              <audio
                ref={referenceAudioRef}
                src={referenceAudioUrl}
                onEnded={() => setIsPlayingReference(false)}
              />
            )}
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
              {/* Timer */}
              <div className="text-3xl font-mono tabular-nums">
                {formatTime(recordingTime)}
              </div>

              {/* Main controls */}
              <div className="flex items-center gap-4">
                {!isRecording && !audioBlob && (
                  <Button
                    size="lg"
                    onClick={startRecording}
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

              {/* Status text */}
              <p className="text-sm text-muted-foreground">
                {isRecording
                  ? "Recording... Click to stop"
                  : audioBlob
                    ? "Review your recording or re-record"
                    : "Click the microphone to start recording"}
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
                      Processing...
                    </>
                  ) : currentIndex < PRONUNCIATION_ITEMS.length - 1 ? (
                    <>
                      Submit & Continue
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Complete Pronunciation
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <div className="mt-6 p-4 rounded-lg bg-muted/50 text-sm">
          <h3 className="font-medium mb-2">Tips for best results:</h3>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Find a quiet space with minimal background noise</li>
            <li>• Speak clearly at a natural pace</li>
            <li>• Listen to the reference audio before recording</li>
            <li>• You can re-record if needed before submitting</li>
          </ul>
        </div>

        {onSkip && <SkipButton onClick={onSkip} />}
      </div>
    </div>
  );
};

export default PronunciationModule;
