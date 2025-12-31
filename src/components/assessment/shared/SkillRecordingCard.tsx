import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Mic, Square, RotateCcw, ArrowRight, Loader2, CheckCircle2, Keyboard } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { cn } from '@/lib/utils';
import type { SkillPrompt, SkillRecordingState, SkillRecordingResult } from './types';

interface SkillRecordingCardProps {
  prompt: SkillPrompt;
  attemptNumber: number;
  questionNumber: number;
  totalQuestions: number;
  moduleTitle: string;
  onRecordingComplete: (blob: Blob, duration: number) => Promise<SkillRecordingResult | null>;
  onTextSubmit?: (text: string) => Promise<SkillRecordingResult | null>;
  onNext: () => void;
  onRedo: () => void;
  existingResult?: SkillRecordingResult;
  isLast: boolean;
  devMode?: boolean;
}

export function SkillRecordingCard({
  prompt,
  attemptNumber,
  questionNumber,
  totalQuestions,
  moduleTitle,
  onRecordingComplete,
  onTextSubmit,
  onNext,
  onRedo,
  existingResult,
  isLast,
  devMode = false
}: SkillRecordingCardProps) {
  const [recordingState, setRecordingState] = useState<SkillRecordingState>(
    existingResult ? 'done' : 'ready'
  );
  const [countdown, setCountdown] = useState(3);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [result, setResult] = useState<SkillRecordingResult | null>(existingResult || null);
  const [devText, setDevText] = useState('');
  const [useTextInput, setUseTextInput] = useState(false);

  const { startRecording, stopRecording, isRecording, audioBlob, error: recorderError } = useAudioRecorder();

  // Countdown timer
  useEffect(() => {
    if (recordingState !== 'countdown') return;
    
    if (countdown <= 0) {
      setRecordingState('recording');
      startRecording();
      return;
    }

    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [recordingState, countdown, startRecording]);

  // Recording timer
  useEffect(() => {
    if (recordingState !== 'recording') return;

    const interval = setInterval(() => {
      setElapsedTime(prev => {
        const next = prev + 1;
        if (next >= prompt.duration) {
          handleStopRecording();
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [recordingState, prompt.duration]);

  // Handle audio blob when recording finishes
  useEffect(() => {
    if (audioBlob && recordingState === 'uploading') {
      processRecording(audioBlob);
    }
  }, [audioBlob, recordingState]);

  const startWithCountdown = useCallback(() => {
    setCountdown(3);
    setElapsedTime(0);
    setRecordingState('countdown');
  }, []);

  const handleStopRecording = useCallback(() => {
    stopRecording();
    setRecordingState('uploading');
  }, [stopRecording]);

  const processRecording = async (blob: Blob) => {
    setRecordingState('processing');
    const recordingResult = await onRecordingComplete(blob, elapsedTime);
    
    if (recordingResult) {
      setResult(recordingResult);
      setRecordingState('done');
    } else {
      setRecordingState('error');
    }
  };

  const handleRedo = () => {
    setRecordingState('ready');
    setResult(null);
    setElapsedTime(0);
    setDevText('');
    setUseTextInput(false);
    onRedo();
  };

  const handleTryAgain = () => {
    setRecordingState('ready');
    setElapsedTime(0);
  };

  const handleDevTextSubmit = async () => {
    if (!devText.trim() || !onTextSubmit) return;
    setRecordingState('processing');
    const textResult = await onTextSubmit(devText.trim());
    if (textResult) {
      setResult(textResult);
      setRecordingState('done');
    } else {
      setRecordingState('error');
    }
  };

  const progressPercentage = (elapsedTime / prompt.duration) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          {moduleTitle} — Question {questionNumber} of {totalQuestions}
        </p>
        {attemptNumber > 1 && (
          <p className="text-xs text-amber-500">Attempt #{attemptNumber}</p>
        )}
      </div>

      {/* Prompt Card */}
      <Card className="border-2 border-primary/20">
        <CardContent className="p-6 space-y-4">
          <p className="text-xl font-medium text-center leading-relaxed">
            {prompt.text}
          </p>
          {prompt.textTranslation && (
            <p className="text-sm text-muted-foreground text-center italic">
              {prompt.textTranslation}
            </p>
          )}
          {prompt.tips && prompt.tips.length > 0 && (
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Tips:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {prompt.tips.map((tip, i) => (
                  <li key={i}>• {tip}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recording Controls */}
      <Card>
        <CardContent className="p-6">
          {/* Countdown State */}
          {recordingState === 'countdown' && (
            <div className="text-center py-8">
              <div className="text-7xl font-bold text-primary animate-pulse">
                {countdown}
              </div>
              <p className="text-muted-foreground mt-4">Get ready to speak...</p>
            </div>
          )}

          {/* Ready State */}
          {recordingState === 'ready' && !useTextInput && (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                You have {prompt.duration} seconds to respond
              </p>
              <Button
                size="lg"
                onClick={startWithCountdown}
                className="gap-2"
              >
                <Mic className="h-5 w-5" />
                Start Recording
              </Button>
              {devMode && onTextSubmit && (
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUseTextInput(true)}
                    className="gap-2 text-muted-foreground"
                  >
                    <Keyboard className="h-4 w-4" />
                    Dev: Type instead
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Dev Text Input Mode */}
          {recordingState === 'ready' && useTextInput && devMode && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-amber-500 font-medium">Dev Mode: Text Input</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUseTextInput(false)}
                >
                  Use Mic
                </Button>
              </div>
              <Textarea
                value={devText}
                onChange={(e) => setDevText(e.target.value)}
                placeholder="Type your response here (bypasses Whisper transcription)..."
                className="min-h-[100px]"
              />
              <Button
                onClick={handleDevTextSubmit}
                disabled={!devText.trim()}
                className="w-full"
              >
                Submit Text
              </Button>
            </div>
          )}

          {/* Recording State */}
          {recordingState === 'recording' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="font-medium">Recording</span>
                </div>
                <span className="font-mono text-lg">
                  {elapsedTime}s / {prompt.duration}s
                </span>
              </div>
              
              <Progress value={progressPercentage} className="h-2" />
              
              <div className="text-center">
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={handleStopRecording}
                  className="gap-2"
                >
                  <Square className="h-5 w-5" />
                  Stop Recording
                </Button>
              </div>
            </div>
          )}

          {/* Uploading State */}
          {recordingState === 'uploading' && (
            <div className="text-center py-8 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Uploading audio...</p>
            </div>
          )}

          {/* Processing State */}
          {recordingState === 'processing' && (
            <div className="text-center py-8 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Analyzing your response...</p>
            </div>
          )}

          {/* Done State */}
          {recordingState === 'done' && result && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-green-600">
                <CheckCircle2 className="h-6 w-6" />
                <span className="font-medium">Response recorded!</span>
              </div>

              {/* Score Display */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Score</span>
                  <span className={cn(
                    "text-2xl font-bold",
                    result.score >= 70 ? "text-green-600" :
                    result.score >= 50 ? "text-amber-500" : "text-red-500"
                  )}>
                    {result.score}/100
                  </span>
                </div>
                
                {result.transcript && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">What you said:</p>
                    <p className="text-sm italic">"{result.transcript}"</p>
                  </div>
                )}
                
                {result.feedback && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Feedback:</p>
                    <p className="text-sm">{result.feedback}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={handleRedo} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Redo
                </Button>
                <Button onClick={onNext} className="gap-2">
                  {isLast ? 'Finish' : 'Next'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Error State */}
          {recordingState === 'error' && (
            <div className="text-center py-8 space-y-4">
              <p className="text-red-500">Something went wrong. Please try again.</p>
              <Button onClick={handleTryAgain} variant="outline">
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
