import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, ArrowRight, Mic, Square, Loader2 } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { syntaxExercises, SYNTAX_SCORING } from './syntaxItems';
import { getPrompts, type SyntaxPrompt } from '@/components/assessment/promptBank/loadPromptBank';

interface SyntaxModuleProps {
  sessionId: string;
  onComplete: () => void;
}

interface ExerciseRecording {
  exerciseType: 'E1' | 'E2' | 'E3';
  transcript?: string;
  audioBase64?: string;
  audioMimeType?: string;
}

interface SyntaxResult {
  overall: number;
  subscores: {
    structure_connectors: { score: number };
    tenses_time: { score: number };
    pronouns: { score: number };
    questions_modality_negation: { score: number };
  };
  errors: { category: string; example: string; fix_hint_fr: string }[];
  feedback: string;
}

export function SyntaxModule({ sessionId, onComplete }: SyntaxModuleProps) {
  const { user } = useAuth();
  const [showIntro, setShowIntro] = useState(true);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exerciseRecordings, setExerciseRecordings] = useState<ExerciseRecording[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<SyntaxResult | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingAdvanceRef = useRef(false);
  
  const isDev = import.meta.env.DEV || window.location.pathname.startsWith('/dev');
  const [devTranscript, setDevTranscript] = useState('');

  // Select prompts deterministically (one for each exercise type)
  const selectedPrompts = useMemo(() => {
    const allPrompts = getPrompts('syntax') as SyntaxPrompt[];
    const e1Prompts = allPrompts.filter(p => p.payload.exerciseType === 'E1');
    const e2Prompts = allPrompts.filter(p => p.payload.exerciseType === 'E2');
    const e3Prompts = allPrompts.filter(p => p.payload.exerciseType === 'E3');
    
    // Use sessionId hash to select deterministically
    const hash = sessionId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const e1Index = hash % e1Prompts.length;
    const e2Index = (hash * 2) % e2Prompts.length;
    const e3Index = (hash * 3) % e3Prompts.length;
    
    return {
      E1: e1Prompts[e1Index] || e1Prompts[0],
      E2: e2Prompts[e2Index] || e2Prompts[0],
      E3: e3Prompts[e3Index] || e3Prompts[0],
    };
  }, [sessionId]);

  const exerciseOrder: ('E1' | 'E2' | 'E3')[] = ['E1', 'E2', 'E3'];
  const currentExerciseType = exerciseOrder[currentExerciseIndex];
  const currentPrompt = selectedPrompts[currentExerciseType];
  const currentDuration = syntaxExercises[currentExerciseType].duration;
  const totalExercises = exerciseOrder.length;
  const progress = ((currentExerciseIndex) / totalExercises) * 100;

  // Callback for when recording completes
  const handleRecordingComplete = useCallback((blob: Blob) => {
    const mimeType = blob.type || 'audio/webm';
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      
      setExerciseRecordings(prev => {
        const updated = [
          ...prev.filter(r => r.exerciseType !== currentExerciseType),
          { exerciseType: currentExerciseType, audioBase64: base64, audioMimeType: mimeType }
        ];
        
        // Check if this was the last exercise
        if (pendingAdvanceRef.current) {
          pendingAdvanceRef.current = false;
          
          if (currentExerciseIndex < totalExercises - 1) {
            setCurrentExerciseIndex(idx => idx + 1);
          } else {
            // Process all recordings
            setTimeout(() => processAllRecordings(updated), 100);
          }
        }
        
        return updated;
      });
    };
    reader.readAsDataURL(blob);
  }, [currentExerciseType, currentExerciseIndex, totalExercises]);

  const { isRecording, startRecording, stopRecording } = useAudioRecorder({
    onRecordingComplete: handleRecordingComplete,
    maxDuration: currentDuration
  });

  // Timer effect
  useEffect(() => {
    if (isRecording && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleStopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, timeLeft]);

  const handleStartRecording = async () => {
    setTimeLeft(currentDuration);
    await startRecording();
  };

  const handleStopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    pendingAdvanceRef.current = true;
    stopRecording();
  };

  const handleDevSubmit = () => {
    if (!devTranscript.trim()) return;
    
    const newRecording = { exerciseType: currentExerciseType, transcript: devTranscript };
    const updatedRecordings = [
      ...exerciseRecordings.filter(r => r.exerciseType !== currentExerciseType),
      newRecording
    ];
    
    setExerciseRecordings(updatedRecordings);
    setDevTranscript('');
    
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
    } else {
      processAllRecordings(updatedRecordings);
    }
  };

  const processAllRecordings = async (recordings: ExerciseRecording[]) => {
    if (!user) return;
    
    setIsProcessing(true);
    
    try {
      // Create a skill recording entry
      const { data: recording, error: insertError } = await supabase
        .from('skill_recordings')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          module_type: 'syntax',
          item_id: 'syntax-combined',
          status: 'pending',
          attempt_number: 1
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Call the analyze-syntax edge function
      const { data, error } = await supabase.functions.invoke('analyze-syntax', {
        body: {
          sessionId,
          exerciseTranscripts: recordings,
          recordingId: recording.id
        }
      });

      if (error) throw error;

      setResult({
        overall: data.overall,
        subscores: data.subscores,
        errors: data.errors || [],
        feedback: data.feedback || data.feedback_fr || ''
      });

    } catch (error) {
      console.error('Error processing syntax:', error);
      toast.error('Failed to analyze your responses. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Intro screen
  if (showIntro) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-primary/20">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Structure & Syntax</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-muted-foreground">
              3 exercises to assess your A2→B1 French grammar structures.
            </p>
            
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium">What we're assessing:</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                {Object.entries(SYNTAX_SCORING.subscores).map(([key, { label, max }]) => (
                  <li key={key}>• <strong>{label}</strong> — up to {max} points</li>
                ))}
              </ul>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                <strong>Tip:</strong> Dropped "ne" is OK if you use "pas/jamais/rien" correctly. 
                Focus on clear communication!
              </p>
            </div>

            <div className="text-center pt-4">
              <Button size="lg" onClick={() => setShowIntro(false)} className="gap-2">
                Start
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Processing screen
  if (isProcessing) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-primary/20">
          <CardContent className="py-12 text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <h3 className="text-xl font-medium">Analyzing your responses...</h3>
            <p className="text-muted-foreground">
              Our AI is evaluating your A2→B1 French structures.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results screen
  if (result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Your Syntax Score</CardTitle>
            <div className="text-5xl font-bold text-primary mt-4">{result.overall}/100</div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Subscores */}
            <div className="space-y-3">
              <h4 className="font-medium">Breakdown:</h4>
              {Object.entries(result.subscores).map(([key, { score }]) => {
                const config = SYNTAX_SCORING.subscores[key as keyof typeof SYNTAX_SCORING.subscores];
                const percentage = (score / config.max) * 100;
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{config.label}</span>
                      <span className="font-medium">{score}/{config.max}</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>

            {/* Top errors */}
            {result.errors.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-amber-700 dark:text-amber-400">Top Errors:</h4>
                {result.errors.slice(0, 3).map((err, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-medium">{err.category}:</span> "{err.example}"
                    <br />
                    <span className="text-muted-foreground">→ {err.fix_hint_fr}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Feedback */}
            {result.feedback && (
              <p className="text-muted-foreground">{result.feedback}</p>
            )}

            <div className="text-center pt-4">
              <Button size="lg" onClick={onComplete} className="gap-2">
                Continue
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Exercise recording screen
  if (!currentPrompt) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-primary/20">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading exercise...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Exercise {currentExerciseIndex + 1} of {totalExercises}</span>
          <span>{syntaxExercises[currentExerciseType].name}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
              {currentExerciseType} ({currentDuration}s)
            </span>
            <span>• {currentPrompt.payload.targetStructures.join(', ')}</span>
          </div>
          <CardTitle className="text-xl">{currentPrompt.payload.instruction}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Timer */}
          {isRecording && (
            <div className="text-center">
              <span className="text-3xl font-mono font-bold text-primary">{timeLeft}s</span>
            </div>
          )}

          {/* Recording controls */}
          <div className="flex justify-center gap-4">
            {!isRecording ? (
              <Button size="lg" onClick={handleStartRecording} className="gap-2">
                <Mic className="h-5 w-5" />
                Start Recording
              </Button>
            ) : (
              <Button 
                size="lg" 
                variant="destructive" 
                onClick={handleStopRecording}
                className="gap-2"
              >
                <Square className="h-5 w-5" />
                Stop ({timeLeft}s)
              </Button>
            )}
          </div>

          {/* Dev mode text input */}
          {isDev && !isRecording && (
            <div className="border-t pt-4 space-y-3">
              <p className="text-xs text-muted-foreground">Dev mode: Type response instead</p>
              <textarea
                className="w-full p-3 border rounded-lg text-sm"
                rows={3}
                placeholder="Type your French response..."
                value={devTranscript}
                onChange={(e) => setDevTranscript(e.target.value)}
              />
              <Button 
                variant="outline" 
                onClick={handleDevSubmit}
                disabled={!devTranscript.trim()}
              >
                Submit Text
              </Button>
            </div>
          )}

          {/* Completed exercises */}
          {exerciseRecordings.length > 0 && (
            <div className="text-sm text-muted-foreground">
              <span className="text-green-500">✓</span> {exerciseRecordings.length} exercise(s) recorded
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
