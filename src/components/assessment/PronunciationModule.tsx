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

// 6 pronunciation paragraphs with embedded minimal pairs
// Each paragraph focuses on specific French pronunciation challenges
const PRONUNCIATION_ITEMS = [
  {
    id: "pron-1",
    text: "Ce matin, j'ai bu mon café dans la rue. Il y avait de la boue partout près de la roue du bus. C'était vraiment une drôle de vue!",
    translation: "This morning, I drank my coffee in the street. There was mud everywhere near the bus wheel. It was really a funny sight!",
    minimalPairs: ["bu", "boue", "rue", "roue", "vue"], // /y/ vs /u/
    focusArea: "Vowel pairs: /u/ (ou) vs /y/ (u)",
  },
  {
    id: "pron-2", 
    text: "Le vin était excellent malgré le vent d'automne. Un brin de romarin décorait le plat brun. L'an dernier, on a trouvé un bon restaurant.",
    translation: "The wine was excellent despite the autumn wind. A sprig of rosemary decorated the brown dish. Last year, we found a good restaurant.",
    minimalPairs: ["vin", "vent", "brin", "brun", "an", "on", "bon"], // nasal vowels
    focusArea: "Nasal vowels: /ɛ̃/ vs /ɑ̃/ vs /ɔ̃/",
  },
  {
    id: "pron-3",
    text: "Attention: le poisson n'est pas un poison! La prononciation française peut être délicate. Faisons une pause et écoutons bien la différence.",
    translation: "Attention: fish is not poison! French pronunciation can be tricky. Let's take a pause and listen carefully to the difference.",
    minimalPairs: ["poisson", "poison", "pause"], // /s/ vs /z/
    focusArea: "Consonant pairs: /s/ vs /z/",
  },
  {
    id: "pron-4",
    text: "Le chat est sous la table, pas dessus. Mais le livre est sur l'étagère, pas dessous. Sur ou sous? Dessus ou dessous? C'est souvent confus!",
    translation: "The cat is under the table, not on top. But the book is on the shelf, not underneath. On or under? Above or below? It's often confusing!",
    minimalPairs: ["sous", "dessus", "sur", "dessous", "sourd"], // position words
    focusArea: "Position words: sur/sous, dessus/dessous",
  },
  {
    id: "pron-5",
    text: "Dans mon lit, je ris souvent en lisant. La pâte à tarte est douce comme une patte de chat. J'ai mis le rat près du ras du mur.",
    translation: "In my bed, I often laugh while reading. The pie dough is soft like a cat's paw. I put the rat near the edge of the wall.",
    minimalPairs: ["lit", "ris", "pâte", "patte", "rat", "ras"], // /l/ vs /ʁ/, open vs closed vowels
    focusArea: "Consonants: /l/ vs /ʁ/, Vowels: open /a/ vs back /ɑ/",
  },
  {
    id: "pron-6",
    text: "Le feu brillait dans le foin. Peu de gens traversaient le pont vers les maisons. C'était une chasse au trésor, pas une jasse de paille!",
    translation: "The fire shone in the hay. Few people crossed the bridge toward the houses. It was a treasure hunt, not a bundle of straw!",
    minimalPairs: ["feu", "foin", "peu", "pont", "chasse", "jasse"], // oral vs nasal, /ʃ/ vs /ʒ/
    focusArea: "Oral vs nasal vowels, /ʃ/ (ch) vs /ʒ/ (j)",
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
  } = useAudioRecorder({ maxDuration: 45 }); // Longer duration for paragraphs

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

      // Send to transcription service with minimal pairs context
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
            minimalPairs: currentItem.minimalPairs, // Pass minimal pairs for weighted scoring
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
        toast.success(`Paragraph ${currentIndex + 1} completed!`);
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
            Listen to the reference, then record yourself saying the paragraph.
          </p>
        </div>

        {/* Recording error */}
        {recordingError && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{recordingError}</p>
          </div>
        )}

        {/* Current paragraph card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-base font-medium text-primary">
                {currentItem.focusArea}
              </CardTitle>
            </div>
            <CardTitle className="text-lg font-medium leading-relaxed">
              {currentItem.text}
            </CardTitle>
            <CardDescription className="italic">
              {currentItem.translation}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Minimal pairs highlight */}
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs font-medium text-amber-600 mb-1">Key sounds to practice:</p>
              <p className="text-sm text-amber-700">
                {currentItem.minimalPairs.join(" • ")}
              </p>
            </div>

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
            <li>• Pay special attention to the highlighted minimal pairs</li>
            <li>• Speak clearly but at a natural pace</li>
            <li>• Listen to the reference audio before recording</li>
            <li>• Focus on the difference between similar sounds</li>
            <li>• You can re-record if needed before submitting</li>
          </ul>
        </div>

        {onSkip && <SkipButton onClick={onSkip} />}
      </div>
    </div>
  );
};

export default PronunciationModule;