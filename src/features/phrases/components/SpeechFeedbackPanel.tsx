/**
 * Speech Feedback Panel Component
 * Real speech recognition with transcription and similarity scoring
 */

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { transcribePhraseAudio, type SpeechRecognitionResult } from '../services/speechRecognition';
import type { TokenMatch } from '../utils/similarityCalculation';

interface SpeechFeedbackPanelProps {
  enabled: boolean;
  targetText: string | string[]; // French text to compare against
  onTranscript?: (result: SpeechRecognitionResult) => void; // Callback with transcript and similarity
}

export function SpeechFeedbackPanel({ 
  enabled, 
  targetText,
  onTranscript 
}: SpeechFeedbackPanelProps) {
  const [recognitionResult, setRecognitionResult] = useState<SpeechRecognitionResult | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    isRecording,
    recordingTime,
    audioBlob,
    error: recorderError,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder({
    maxDuration: 10, // 10 seconds max
  });

  // Handle recording completion
  useEffect(() => {
    if (audioBlob && !isRecording && !isTranscribing) {
      handleTranscribe(audioBlob);
    }
  }, [audioBlob, isRecording]);

  const handleTranscribe = async (blob: Blob) => {
    setIsTranscribing(true);
    setError(null);

    try {
      const result = await transcribePhraseAudio(blob, targetText);
      setRecognitionResult(result);
      onTranscript?.(result);
    } catch (err) {
      console.error('Transcription error:', err);
      setError(err instanceof Error ? err.message : 'Failed to transcribe audio');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleStartRecording = async () => {
    setError(null);
    setRecognitionResult(null);
    await startRecording();
  };

  const handleStopRecording = () => {
    stopRecording();
  };

  const handleReset = () => {
    resetRecording();
    setRecognitionResult(null);
    setError(null);
  };

  if (!enabled) return null;

  const hasResult = recognitionResult !== null;
  const displayError = error || recorderError;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-lg p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Speech Feedback</div>
        {hasResult && (
          <Badge variant="secondary" className="font-normal">
            {Math.round(recognitionResult.similarity * 100)}% match
          </Badge>
        )}
      </div>

      {!hasResult && !isTranscribing ? (
        <div className="text-center py-4">
          <Button
            size="lg"
            variant={isRecording ? 'destructive' : 'outline'}
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            className="rounded-full w-16 h-16"
            disabled={isTranscribing}
          >
            {isRecording ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </Button>
          <div className="text-sm text-muted-foreground mt-2">
            {isRecording ? (
              <>
                Recording... {recordingTime}s
              </>
            ) : (
              'Tap to record'
            )}
          </div>
          {displayError && (
            <div className="text-xs text-destructive mt-2">
              {displayError}
            </div>
          )}
        </div>
      ) : isTranscribing ? (
        <div className="text-center py-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <div className="text-sm text-muted-foreground mt-2">
            Transcribing...
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Transcript */}
          <div>
            <div className="text-xs text-muted-foreground mb-1">Your speech:</div>
            <div className="flex flex-wrap gap-1">
              {recognitionResult.similarityDetails.matchedTokens.map((token: TokenMatch, i: number) => (
                <span
                  key={i}
                  className={`px-2 py-1 rounded text-sm ${
                    token.matched
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}
                >
                  {token.text}
                </span>
              ))}
            </div>
            {recognitionResult.transcript && (
              <div className="text-xs text-muted-foreground mt-2 italic">
                "{recognitionResult.transcript}"
              </div>
            )}
          </div>

          {/* Similarity score */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Match:</span>
            <span className={`font-medium ${
              recognitionResult.similarity >= 0.85
                ? 'text-green-600 dark:text-green-400'
                : recognitionResult.similarity >= 0.70
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {Math.round(recognitionResult.similarity * 100)}%
            </span>
          </div>

          {/* Missing/Extra tokens */}
          {(recognitionResult.similarityDetails.missingTokens.length > 0 || 
            recognitionResult.similarityDetails.extraTokens.length > 0) && (
            <div className="text-xs space-y-1">
              {recognitionResult.similarityDetails.missingTokens.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Missing: </span>
                  <span className="text-red-600 dark:text-red-400">
                    {recognitionResult.similarityDetails.missingTokens.join(', ')}
                  </span>
                </div>
              )}
              {recognitionResult.similarityDetails.extraTokens.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Extra: </span>
                  <span className="text-yellow-600 dark:text-yellow-400">
                    {recognitionResult.similarityDetails.extraTokens.join(', ')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Reset */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="w-full"
          >
            Try again
          </Button>
        </div>
      )}
    </motion.div>
  );
}

