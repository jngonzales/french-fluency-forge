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
import { useAdminMode } from "@/hooks/useAdminMode";
import { useAudioRecorder, formatTime } from "@/hooks/useAudioRecorder";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, 
  Square, 
  RotateCcw, 
  Loader2,
  AlertCircle,
  ChevronRight,
  Check,
} from "lucide-react";
import SkipButton from "../SkipButton";
import { StatusIndicator, StatusBadge, type ProcessingStatus } from "./StatusIndicator";
import { PronunciationDebugPanel } from "./PronunciationDebugPanel";
import { EnhancedFeedbackDisplay } from "./EnhancedFeedbackDisplay";
import { IPADisplay } from "./IPADisplay";
import { CoverageProgress } from "./CoverageProgress";
import { 
  selectPhrasesWithCoverage, 
  type PronunciationPhrase 
} from "@/lib/pronunciation/coverageSampler";
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
  const showDevMode = isAdmin || isDev;
  
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
  
  // Dev mode toggle
  const [devModeExpanded, setDevModeExpanded] = useState(false);

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
    getWavBlob,
  } = useAudioRecorder({ 
    maxDuration: 30,
    convertToWavOnStop: true,
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
      '5-10w': 2,
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
  const currentAttemptCount = currentPhrase ? (attemptCounts[currentPhrase.id] || 0) : 0;
  const maxAttemptsReached = currentAttemptCount >= 2;
  const progress = phrases.length > 0 ? ((currentIndex + 1) / phrases.length) * 100 : 0;

  // Auto-submit when recording stops
  useEffect(() => {
    if (isRecording) {
      setProcessingStatus('recording');
    } else if (audioBlob && processingStatus === 'recording') {
      setProcessingStatus('recorded');
      // Auto-submit after brief delay
      setTimeout(() => {
        handleRecordingSubmit();
      }, 300);
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
            referenceText: currentPhrase.text_fr,
            itemId: currentPhrase.id,
            audioFormat: audioFormatToSend,
          }),
        }
      );

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
      setAttemptCounts(prev => ({ ...prev, [currentPhrase.id]: attemptNumber }));

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
          completeness: result.completenessScore || 0,
        },
        words: result.words || [],
        allPhonemes: result.allPhonemes || [],
        strengths: result.strengths || [],
        improvements: result.improvements || [],
        practiceSuggestions: result.practiceSuggestions || [],
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
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 pt-24">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">🎯 Pronunciation Test</h1>
            <div className="flex items-center gap-2">
              {showDevMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDevModeExpanded(!devModeExpanded)}
                  className="text-xs"
                >
                  {devModeExpanded ? '🐛 Hide Dev' : '🐛 Dev Mode'}
                </Button>
              )}
              {processingStatus !== 'idle' && !showDevMode && (
                <StatusBadge status={processingStatus} provider={currentProvider} />
              )}
            </div>
          </div>
          
          {/* Simple Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Phrase {currentIndex + 1} of {phrases.length}
              </span>
              <span className="font-semibold text-primary">
                {testedPhonemes.size}/39 phonemes
              </span>
            </div>
          </div>
        </div>

        {/* Dev Mode: Full Coverage Progress */}
        {showDevMode && devModeExpanded && (
          <CoverageProgress 
            testedPhonemes={testedPhonemes}
            currentPhrase={currentIndex + 1}
            totalPhrases={phrases.length}
          />
        )}

        {/* Dev Mode: Status Flow */}
        {showDevMode && devModeExpanded && processingStatus !== 'idle' && processingStatus !== 'complete' && (
          <StatusIndicator status={processingStatus} provider={currentProvider} />
        )}

        {/* Recording Error */}
        {recordingError && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <div className="font-semibold text-destructive mb-1">Recording Error</div>
              <p className="text-sm text-destructive">{recordingError}</p>
            </div>
          </div>
        )}

        {/* Current Phrase - Show during recording */}
        {!showFeedback && currentPhrase && (
          <>
            {/* IPA Display */}
            <IPADisplay
              textFr={currentPhrase.text_fr}
              ipa={currentPhrase.ipa}
              targetPhonemes={showDevMode && devModeExpanded ? getTargetPhonemes(currentPhrase.ipa) : []}
              showTargets={showDevMode && devModeExpanded}
            />

            {/* Recording Controls */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {isRecording ? '🎤 Recording...' : 
                     processingStatus === 'uploading' || processingStatus === 'processing' ? '⚙️ Analyzing...' :
                     'Record this phrase'}
                  </CardTitle>
                  {currentAttemptCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Attempt {currentAttemptCount}/2
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <SimpleRecordingControls
                  isRecording={isRecording}
                  isProcessing={processingStatus !== 'idle' && processingStatus !== 'recorded'}
                  recordingTime={recordingTime}
                  startRecording={startRecording}
                  stopRecording={stopRecording}
                  resetRecording={resetRecording}
                  showDevInfo={showDevMode && devModeExpanded}
                  wavBlob={wavBlob}
                  isConverting={isConverting}
                />
              </CardContent>
            </Card>
          </>
        )}

        {/* Feedback Display */}
        {showFeedback && currentResult && (
          <div className="space-y-6">
            <EnhancedFeedbackDisplay
              result={currentResult}
              onContinue={advanceToNext}
              onTryAgain={maxAttemptsReached ? null : handleTryAgain}
              attemptNumber={currentAttemptCount}
            />
            {/* Dev Mode Only: Debug Panel */}
            {showDevMode && devModeExpanded && (
              <PronunciationDebugPanel result={currentResult} isOpen={true} />
            )}
          </div>
        )}

        {onSkip && <SkipButton onClick={onSkip} />}
      </div>
    </div>
  );
};

// Simplified Recording Controls Component
interface SimpleRecordingControlsProps {
  isRecording: boolean;
  isProcessing: boolean;
  recordingTime: number;
  startRecording: () => void;
  stopRecording: () => void;
  resetRecording: () => void;
  showDevInfo: boolean;
  wavBlob: Blob | null;
  isConverting: boolean;
}

function SimpleRecordingControls({
  isRecording,
  isProcessing,
  recordingTime,
  startRecording,
  stopRecording,
  resetRecording,
  showDevInfo,
  wavBlob,
  isConverting,
}: SimpleRecordingControlsProps) {
  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Timer */}
      <div className="text-3xl font-mono tabular-nums">
        {formatTime(recordingTime)}
      </div>

      {/* Dev Mode: Conversion Status */}
      {showDevInfo && isConverting && (
        <div className="text-sm text-primary flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Converting to WAV...
        </div>
      )}
      
      {showDevInfo && wavBlob && !isConverting && !isRecording && !isProcessing && (
        <div className="text-xs text-green-600 flex items-center gap-1">
          <Check className="h-3 w-3" />
          WAV optimized
        </div>
      )}

      {/* Recording Button - Auto-submits on stop */}
      <div className="flex items-center gap-4">
        {!isRecording && !isProcessing && (
          <div className="flex flex-col items-center gap-2">
            <Button
              size="lg"
              onClick={startRecording}
              className="h-20 w-20 rounded-full"
              disabled={isProcessing}
            >
              <Mic className="h-8 w-8" />
            </Button>
            <p className="text-xs text-muted-foreground">
              Click to record
            </p>
          </div>
        )}

        {isRecording && (
          <div className="flex flex-col items-center gap-2">
            <Button
              size="lg"
              variant="destructive"
              onClick={stopRecording}
              className="h-20 w-20 rounded-full animate-pulse"
            >
              <Square className="h-8 w-8" />
            </Button>
            <p className="text-xs text-muted-foreground">
              Click to stop (auto-submits)
            </p>
          </div>
        )}

        {isProcessing && (
          <div className="flex flex-col items-center gap-2">
            <div className="h-20 w-20 rounded-full border-4 border-primary/20 border-t-primary flex items-center justify-center animate-spin">
              <Loader2 className="h-8 w-8" />
            </div>
            <p className="text-sm font-medium">
              {isConverting ? 'Preparing...' : 'Analyzing...'}
            </p>
          </div>
        )}
      </div>

      {/* Dev Mode: Reset Button */}
      {showDevInfo && !isRecording && !isProcessing && recordingTime > 0 && (
        <Button 
          variant="ghost" 
          size="sm"
          onClick={resetRecording}
          className="text-xs"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset Recording
        </Button>
      )}
    </div>
  );
}

export default PronunciationModuleWithPhrases;

