/**
 * Turn Recording Component
 * 
 * Handles audio recording for a single turn with timing constraints.
 * Captures timing metrics for confidence analysis.
 */

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, Square, Loader2 } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

interface TurnRecordingProps {
  turnNumber: number;
  expectedDuration: number; // seconds
  isRecording: boolean;
  isProcessing: boolean;
  onStart: () => void;
  onComplete: (blob: Blob, startTs: Date, endTs: Date) => void;
  onTextSubmit?: (text: string) => void;
  devMode?: boolean;
}

export function TurnRecording({
  turnNumber,
  expectedDuration,
  isRecording,
  isProcessing,
  onStart,
  onComplete,
  onTextSubmit,
  devMode = false
}: TurnRecordingProps) {
  const [recordingStartTime, setRecordingStartTime] = useState<Date | null>(null);
  const [textInput, setTextInput] = useState('');
  
  const {
    isRecording: recorderIsRecording,
    recordingTime,
    audioBlob,
    error: recorderError,
    startRecording,
    stopRecording,
    resetRecording
  } = useAudioRecorder({
    maxDuration: expectedDuration + 10, // Allow some buffer
    convertToWavOnStop: false // We'll use webm for this
  });

  // Handle recording start
  const handleStartRecording = async () => {
    onStart();
    setRecordingStartTime(new Date());
    await startRecording();
  };

  // Handle recording stop
  const handleStopRecording = () => {
    stopRecording();
  };

  // Auto-stop at max duration
  useEffect(() => {
    if (recorderIsRecording && recordingTime >= expectedDuration) {
      handleStopRecording();
    }
  }, [recorderIsRecording, recordingTime, expectedDuration]);

  // Handle recording completion
  useEffect(() => {
    if (audioBlob && recordingStartTime && !recorderIsRecording) {
      const endTime = new Date();
      onComplete(audioBlob, recordingStartTime, endTime);
      resetRecording();
      setRecordingStartTime(null);
    }
  }, [audioBlob, recordingStartTime, recorderIsRecording]);

  // Dev mode text submission
  const handleTextSubmit = () => {
    if (textInput.trim() && onTextSubmit) {
      onTextSubmit(textInput.trim());
      setTextInput('');
    }
  };

  const remainingTime = expectedDuration - recordingTime;
  const progress = (recordingTime / expectedDuration) * 100;

  if (devMode && onTextSubmit) {
    return (
      <div className="space-y-3">
        <Textarea
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Type your response in French..."
          className="min-h-[120px]"
          disabled={isProcessing}
        />
        <Button
          onClick={handleTextSubmit}
          disabled={!textInput.trim() || isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Submit Response'
          )}
        </Button>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Analyzing your response...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Recording Button */}
      {!recorderIsRecording && !isRecording && (
        <Button
          onClick={handleStartRecording}
          size="lg"
          className="w-full h-16 text-lg"
          disabled={isProcessing}
        >
          <Mic className="mr-2 h-5 w-5" />
          Start Recording
        </Button>
      )}

      {/* Recording in Progress */}
      {(recorderIsRecording || isRecording) && (
        <div className="space-y-4">
          {/* Timer and Progress */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-4">
              <div className="text-3xl font-bold tabular-nums">
                {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-sm text-muted-foreground">
                / {Math.floor(expectedDuration / 60)}:{(expectedDuration % 60).toString().padStart(2, '0')}
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-300"
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
            
            {remainingTime > 0 && remainingTime <= 10 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                {remainingTime}s remaining
              </p>
            )}
          </div>

          {/* Stop Button */}
          <Button
            onClick={handleStopRecording}
            size="lg"
            variant="destructive"
            className="w-full h-16 text-lg"
          >
            <Square className="mr-2 h-5 w-5" />
            Stop Recording
          </Button>

          {/* Visual Indicator */}
          <div className="flex items-center justify-center gap-2 text-sm text-red-600 dark:text-red-400">
            <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse"></div>
            <span className="font-medium">Recording in progress...</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {recorderError && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
          {recorderError}
        </div>
      )}
    </div>
  );
}

