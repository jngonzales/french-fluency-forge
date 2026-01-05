/**
 * Pronunciation Module with Phrase Bank
 * Uses coverage-constrained sampling to test all 39 French phonemes
 */

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useAudioRecorder, formatTime } from "@/hooks/useAudioRecorder";
import { Badge } from "@/components/ui/badge";
import { Mic, Square, RotateCcw, Loader2, AlertCircle, ChevronRight, Check } from "lucide-react";
import SkipButton from "../SkipButton";
import { StatusIndicator, StatusBadge, type ProcessingStatus } from "./StatusIndicator";
import { PronunciationDebugPanel } from "./PronunciationDebugPanel";
import { EnhancedFeedbackDisplay } from "./EnhancedFeedbackDisplay";
import { IPADisplay } from "./IPADisplay";
import { CoverageProgress } from "./CoverageProgress";
import { selectPhrasesWithCoverage, type PronunciationPhrase } from "@/lib/pronunciation/coverageSampler";
import { parseIPA, getTargetPhonemes } from "@/lib/pronunciation/ipaParser";
import { updatePhonemeStats, extractPhonemeScores } from "@/lib/pronunciation/phonemeStats";
import { generateSeed } from "@/lib/random/seededShuffle";
import pronunciationPhrasesBank from "../promptBank/promptBanks/pronunciation-phrases.json";
interface PronunciationModuleWithPhrasesProps {
  sessionId: string;
  onComplete: (results: any[]) => void;
  onSkip?: () => void;
}
const PronunciationModuleWithPhrases = ({
  sessionId,
  onComplete,
  onSkip
}: PronunciationModuleWithPhrasesProps) => {
  const {
    user
  } = useAuth();

  // State
  const [phrases, setPhrases] = useState<PronunciationPhrase[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const [testedPhonemes, setTestedPhonemes] = useState<Set<string>>(new Set());
  const [attemptCounts, setAttemptCounts] = useState<Record<string, number>>({});

  // Processing state
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>('idle');
  const [currentProvider, setCurrentProvider] = useState<'speechsuper' | 'azure' | null>(null);

  // Feedback state
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentResult, setCurrentResult] = useState<any>(null);
  const {
    isRecording,
    recordingTime,
    audioBlob,
    wavBlob,
    isConverting,
    error: recordingError,
    startRecording,
    stopRecording,
    resetRecording,
    getWavBlob
  } = useAudioRecorder({
    maxDuration: 30,
    convertToWavOnStop: true
  });

  // Initialize phrases with coverage sampling
  useEffect(() => {
    const seed = generateSeed();
    console.log('[Pronunciation] Selecting phrases with coverage, seed:', seed);
    const phrasesData = pronunciationPhrasesBank.phrases as any[];
    const result = selectPhrasesWithCoverage(phrasesData, seed, {
      '2w': 3,
      '3-4w': 3,
      '4-5w': 2,
      '5-10w': 2
    });
    console.log('[Pronunciation] Selected', result.phrases.length, 'phrases');
    console.log('[Pronunciation] Coverage:', result.coveragePercent + '%');
    console.log('[Pronunciation] Swaps made:', result.swapsMade);
    if (result.missingPhonemes.length > 0) {
      console.warn('[Pronunciation] Missing phonemes:', result.missingPhonemes);
    }
    setPhrases(result.phrases);
  }, []);
  const currentPhrase = phrases[currentIndex];
  const currentAttemptCount = currentPhrase ? attemptCounts[currentPhrase.id] || 0 : 0;
  const maxAttemptsReached = currentAttemptCount >= 2;
  const progress = phrases.length > 0 ? (currentIndex + 1) / phrases.length * 100 : 0;

  // Update status when recording changes
  useEffect(() => {
    if (isRecording) {
      setProcessingStatus('recording');
    } else if (audioBlob && processingStatus === 'recording') {
      setProcessingStatus('recorded');
    }
  }, [isRecording, audioBlob]);
  const handleRecordingSubmit = async () => {
    if (!audioBlob || !currentPhrase) return;
    setProcessingStatus('uploading');
    setShowFeedback(false);
    toast.info('Preparing audio for analysis...');
    try {
      // Get WAV audio
      let audioToSend = wavBlob;
      let audioFormatToSend = 'audio/wav';
      if (!audioToSend) {
        console.log('[Pronunciation] Converting to WAV...');
        toast.info('Converting to optimal format...');
        audioToSend = await getWavBlob();
      }
      if (!audioToSend) {
        console.warn('[Pronunciation] WAV conversion failed, using WebM');
        audioToSend = audioBlob;
        audioFormatToSend = audioBlob.type || 'audio/webm';
        toast.warning('Using original format');
      } else {
        toast.success('Audio optimized (WAV)');
      }

      // Convert to base64
      const arrayBuffer = await audioToSend.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Audio = btoa(binary);
      setProcessingStatus('processing');
      toast.info('Analyzing pronunciation...');

      // Call pronunciation API
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-pronunciation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          audio: base64Audio,
          referenceText: currentPhrase.text_fr,
          itemId: currentPhrase.id,
          audioFormat: audioFormatToSend
        })
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Assessment failed');
      }
      setProcessingStatus('analyzed');
      const result = await response.json();
      console.log('[Pronunciation] Result:', result);
      setCurrentProvider(result.provider || 'azure');
      toast.success(`Complete (${result.provider === 'speechsuper' ? 'SpeechSuper' : 'Azure'})`);

      // Update tested phonemes
      const phrasePhonemes = currentPhrase.phonemes || parseIPA(currentPhrase.ipa);
      setTestedPhonemes(prev => {
        const next = new Set(prev);
        phrasePhonemes.forEach(p => next.add(p));
        return next;
      });

      // Increment attempt count
      const attemptNumber = currentAttemptCount + 1;
      setAttemptCounts(prev => ({
        ...prev,
        [currentPhrase.id]: attemptNumber
      }));

      // Store result
      const itemResult = {
        ...result,
        phraseId: currentPhrase.id,
        phraseIpa: currentPhrase.ipa,
        attemptNumber,
        scores: result.scores || {
          overall: result.pronScore || result.accuracyScore || 0,
          accuracy: result.accuracyScore || 0,
          fluency: result.fluencyScore || 80,
          completeness: result.completenessScore || 0
        },
        words: result.words || [],
        allPhonemes: result.allPhonemes || [],
        strengths: result.strengths || [],
        improvements: result.improvements || [],
        practiceSuggestions: result.practiceSuggestions || []
      };
      setResults(prev => [...prev, itemResult]);
      setCurrentResult(itemResult);
      setShowFeedback(true);
      setProcessingStatus('complete');
    } catch (error) {
      console.error("Pronunciation error:", error);
      setProcessingStatus('error');
      toast.error(error instanceof Error ? error.message : "Assessment failed");
    }
  };
  const advanceToNext = async () => {
    resetRecording();
    setShowFeedback(false);
    setCurrentResult(null);
    setProcessingStatus('idle');
    setCurrentProvider(null);
    if (currentIndex < phrases.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Test complete - update phoneme stats
      if (user) {
        console.log('[Pronunciation] Test complete, updating phoneme stats...');

        // Extract all phoneme scores from results
        const allPhonemeScores = results.flatMap(r => extractPhonemeScores(r));
        if (allPhonemeScores.length > 0) {
          await updatePhonemeStats(user.id, allPhonemeScores);
          toast.success('Phoneme stats updated!');
        }
      }
      onComplete(results);
    }
  };
  const handleTryAgain = () => {
    resetRecording();
    setShowFeedback(false);
    setCurrentResult(null);
    setProcessingStatus('idle');
  };
  if (phrases.length === 0) {
    return <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }
  return <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6 py-[30px]">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">🎯 Pronunciation Test 2.0</h1>
            {processingStatus !== 'idle' && <StatusBadge status={processingStatus} provider={currentProvider} />}
          </div>
          <Progress value={progress} className="h-2 mb-2" />
          <p className="text-sm text-muted-foreground">
            Phrase {currentIndex + 1} of {phrases.length}
          </p>
        </div>

        {/* Coverage Progress */}
        <CoverageProgress testedPhonemes={testedPhonemes} currentPhrase={currentIndex + 1} totalPhrases={phrases.length} />

        {/* Status Flow */}
        {processingStatus !== 'idle' && processingStatus !== 'complete' && <StatusIndicator status={processingStatus} provider={currentProvider} />}

        {/* Recording Error */}
        {recordingError && <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <div className="font-semibold text-destructive mb-1">Recording Error</div>
              <p className="text-sm text-destructive">{recordingError}</p>
            </div>
          </div>}

        {/* Current Phrase - Show during recording */}
        {!showFeedback && currentPhrase && <>
            {/* IPA Display */}
            <IPADisplay textFr={currentPhrase.text_fr} ipa={currentPhrase.ipa} targetPhonemes={getTargetPhonemes(currentPhrase.ipa)} showTargets={true} />

            {/* Recording Controls */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Record this phrase</CardTitle>
                  {currentAttemptCount > 0 && <Badge variant="secondary" className="text-xs">
                      Attempt {currentAttemptCount}/2
                    </Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <RecordingControls isRecording={isRecording} isProcessing={processingStatus !== 'idle' && processingStatus !== 'recorded'} isConverting={isConverting} audioBlob={audioBlob} wavBlob={wavBlob} recordingTime={recordingTime} startRecording={startRecording} stopRecording={stopRecording} resetRecording={resetRecording} onSubmit={handleRecordingSubmit} />
              </CardContent>
            </Card>
          </>}

        {/* Feedback Display */}
        {showFeedback && currentResult && <div className="space-y-6">
            <EnhancedFeedbackDisplay result={currentResult} onContinue={advanceToNext} onTryAgain={maxAttemptsReached ? null : handleTryAgain} attemptNumber={currentAttemptCount} />
            <PronunciationDebugPanel result={currentResult} isOpen={false} />
          </div>}

        {onSkip && <SkipButton onClick={onSkip} />}
      </div>
    </div>;
};

// Recording Controls Component
interface RecordingControlsProps {
  isRecording: boolean;
  isProcessing: boolean;
  isConverting: boolean;
  audioBlob: Blob | null;
  wavBlob: Blob | null;
  recordingTime: number;
  startRecording: () => void;
  stopRecording: () => void;
  resetRecording: () => void;
  onSubmit: () => void;
}
function RecordingControls({
  isRecording,
  isProcessing,
  isConverting,
  audioBlob,
  wavBlob,
  recordingTime,
  startRecording,
  stopRecording,
  resetRecording,
  onSubmit
}: RecordingControlsProps) {
  return <div className="flex flex-col items-center space-y-4">
      <div className="text-3xl font-mono tabular-nums">
        {formatTime(recordingTime)}
      </div>

      {isConverting && <div className="text-sm text-primary flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Converting to WAV for Azure...
        </div>}
      
      {wavBlob && !isConverting && !isRecording && <div className="text-xs text-green-600 flex items-center gap-1">
          <Check className="h-3 w-3" />
          Optimized for pronunciation assessment (WAV)
        </div>}

      <div className="flex items-center gap-4">
        {!isRecording && !audioBlob && <Button size="lg" onClick={startRecording} className="h-16 w-16 rounded-full" disabled={isProcessing || isConverting}>
            <Mic className="h-6 w-6" />
          </Button>}

        {isRecording && <Button size="lg" variant="destructive" onClick={stopRecording} className="h-16 w-16 rounded-full animate-pulse">
            <Square className="h-6 w-6" />
          </Button>}

        {audioBlob && !isRecording && <div className="flex items-center gap-3">
            <Button variant="outline" onClick={resetRecording} disabled={isProcessing || isConverting}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Redo
            </Button>
            <Button onClick={onSubmit} disabled={isProcessing || isConverting} size="lg">
              {isProcessing ? <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </> : isConverting ? <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Converting...
                </> : <>
                  Submit {wavBlob && '(WAV)'}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>}
            </Button>
          </div>}
      </div>
    </div>;
}
export default PronunciationModuleWithPhrases;