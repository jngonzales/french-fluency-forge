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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Mic, Square, RotateCcw, Loader2, AlertCircle, ChevronRight, Check } from "lucide-react";
import { useAdminMode } from "@/hooks/useAdminMode";
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
  const { user } = useAuth();
  const { isAdmin, isDev } = useAdminMode();

  // Dev mode toggle state
  const [devModeEnabled, setDevModeEnabled] = useState(true);
  const showDevFeatures = devModeEnabled && (isAdmin || isDev);

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

  // Track recording state
  useEffect(() => {
    if (isRecording) {
      setProcessingStatus('recording');
    } else if (audioBlob && processingStatus === 'recording') {
      setProcessingStatus('recorded');
    }
  }, [isRecording, audioBlob, processingStatus]);

  // Auto-submit when WAV is ready (user mode only)
  useEffect(() => {
    if (!showDevFeatures && wavBlob && processingStatus === 'recorded') {
      console.log('[Pronunciation] WAV ready, auto-submitting...');
      handleRecordingSubmit();
    }
  }, [wavBlob, showDevFeatures, processingStatus]);
  // Helper for staged status with delays (user mode only)
  const setStatusWithDelay = async (status: ProcessingStatus, delayMs: number = 100) => {
    if (!showDevFeatures && delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    setProcessingStatus(status);
  };

  const handleRecordingSubmit = async () => {
    if (!audioBlob || !currentPhrase) return;
    setProcessingStatus('uploading');
    setShowFeedback(false);
    if (showDevFeatures) {
      toast.info('Preparing audio for analysis...');
    }
    try {
      // Get WAV audio
      let audioToSend = wavBlob;
      let audioFormatToSend = 'audio/wav';
      if (!audioToSend) {
        console.log('[Pronunciation] Converting to WAV...');
        if (showDevFeatures) toast.info('Converting to optimal format...');
        audioToSend = await getWavBlob();
      }
      if (!audioToSend) {
        console.warn('[Pronunciation] WAV conversion failed, using WebM');
        audioToSend = audioBlob;
        audioFormatToSend = audioBlob.type || 'audio/webm';
        if (showDevFeatures) toast.warning('Using original format');
      } else {
        if (showDevFeatures) toast.success('Audio optimized (WAV)');
      }

      // Staged status progression with delays for user mode
      await setStatusWithDelay('recorded', 100);  // Processing
      
      // Convert to base64
      const arrayBuffer = await audioToSend.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Audio = btoa(binary);
      
      await setStatusWithDelay('processing', 100);  // Understanding
      if (showDevFeatures) toast.info('Analyzing pronunciation...');

      await setStatusWithDelay('uploading', 100);  // Analyzing

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
      
      // "Almost there" - no extra delay before this (natural API response time)
      await setStatusWithDelay('analyzed', 0);
      
      const result = await response.json();
      console.log('[Pronunciation] Result:', result);
      setCurrentProvider(result.provider || 'azure');
      
      // Final "Magic!" step with small delay for dramatic effect
      await setStatusWithDelay('complete', 100);
      if (showDevFeatures) {
        toast.success(`Complete (${result.provider === 'speechsuper' ? 'SpeechSuper' : 'Azure'})`);
      }
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
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Pronunciation Test</h1>
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
            </div>
            {processingStatus !== 'idle' && <StatusBadge status={processingStatus} provider={currentProvider} devMode={showDevFeatures} />}
          </div>
          <Progress value={progress} className="h-2 mb-2" />
          <p className="text-sm text-muted-foreground">
            Phrase {currentIndex + 1} of {phrases.length}
          </p>
        </div>

        {/* Coverage Progress - only in dev mode */}
        {showDevFeatures && <CoverageProgress testedPhonemes={testedPhonemes} currentPhrase={currentIndex + 1} totalPhrases={phrases.length} />}

        {/* Status Flow */}
        {processingStatus !== 'idle' && processingStatus !== 'complete' && <StatusIndicator status={processingStatus} provider={currentProvider} devMode={showDevFeatures} />}

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
            {/* IPA Display - show IPA and targets only in dev mode */}
            <IPADisplay 
              textFr={currentPhrase.text_fr} 
              ipa={currentPhrase.ipa} 
              targetPhonemes={getTargetPhonemes(currentPhrase.ipa)} 
              showTargets={showDevFeatures}
              showIPA={showDevFeatures}
            />

            {/* Recording Controls */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {showDevFeatures ? 'Record this phrase' : 'Say this phrase'}
                  </CardTitle>
                  {currentAttemptCount > 0 && <Badge variant="secondary" className="text-xs">
                      Attempt {currentAttemptCount}/2
                    </Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <RecordingControls 
                  isRecording={isRecording} 
                  isProcessing={processingStatus !== 'idle' && processingStatus !== 'recorded'} 
                  isConverting={isConverting} 
                  audioBlob={audioBlob} 
                  wavBlob={wavBlob} 
                  recordingTime={recordingTime} 
                  startRecording={startRecording} 
                  stopRecording={stopRecording} 
                  resetRecording={resetRecording} 
                  onSubmit={handleRecordingSubmit}
                  devMode={showDevFeatures}
                />
              </CardContent>
            </Card>
          </>}

        {/* Feedback Display */}
        {showFeedback && currentResult && <div className="space-y-6">
            <EnhancedFeedbackDisplay result={currentResult} onContinue={advanceToNext} onTryAgain={maxAttemptsReached ? null : handleTryAgain} attemptNumber={currentAttemptCount} />
            {showDevFeatures && <PronunciationDebugPanel result={currentResult} isOpen={false} />}
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
  devMode?: boolean;
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
  onSubmit,
  devMode = false
}: RecordingControlsProps) {
  return <div className="flex flex-col items-center space-y-4">
      <div className="text-3xl font-mono tabular-nums">
        {formatTime(recordingTime)}
      </div>

      {/* Only show technical messages in dev mode */}
      {devMode && isConverting && <div className="text-sm text-primary flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Converting to WAV for Azure...
        </div>}
      
      {/* Hide WAV optimization text in user mode */}
      {devMode && wavBlob && !isConverting && !isRecording && <div className="text-xs text-green-600 flex items-center gap-1">
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

        {/* In user mode: auto-submits, so only show redo button. In dev mode: show submit button */}
        {audioBlob && !isRecording && (
          devMode ? (
            <div className="flex items-center gap-3">
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
            </div>
          ) : (
            /* User mode - just show processing state or redo */
            <div className="flex items-center gap-3">
              {!isProcessing && (
                <Button variant="outline" onClick={resetRecording} disabled={isProcessing || isConverting}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}
              {(isProcessing || isConverting) && (
                <div className="flex items-center gap-2 text-primary">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm font-medium">Working magic...</span>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>;
}
export default PronunciationModuleWithPhrases;