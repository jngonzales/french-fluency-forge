import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Headphones, 
  ArrowRight, 
  Play, 
  Mic, 
  Square, 
  Volume2, 
  Check,
  Loader2,
  RefreshCw,
  VolumeX
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useAudioRecorder, formatTime } from '@/hooks/useAudioRecorder';
import { getAssessmentItems, type ComprehensionItem } from './comprehensionItems';

interface ComprehensionModuleProps {
  sessionId: string;
  onComplete: () => void;
}

interface RecordingResult {
  transcript: string;
  score: number;
  feedbackFr: string;
  understoodFacts: Array<{ fact: string; ok: boolean; evidence: string }>;
  intentMatch: { ok: boolean; type: string };
}

type ItemPhase = 'ready' | 'playing' | 'played' | 'recording' | 'processing' | 'complete';

export function ComprehensionModule({ sessionId, onComplete }: ComprehensionModuleProps) {
  const { user } = useAuth();
  const [showIntro, setShowIntro] = useState(true);
  const [items] = useState<ComprehensionItem[]>(getAssessmentItems());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemPhase, setItemPhase] = useState<ItemPhase>('ready');
  const [results, setResults] = useState<Record<string, RecordingResult>>({});
  const [audioPlayedAt, setAudioPlayedAt] = useState<Record<string, Date>>({});
  const [generatedAudio, setGeneratedAudio] = useState<Record<string, string>>({});
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  
  // Dev mode states
  const isDev = import.meta.env.DEV || window.location.pathname.startsWith('/dev');
  const [useTextInput, setUseTextInput] = useState(false);
  const [devTextInput, setDevTextInput] = useState('');
  const [skipAudio, setSkipAudio] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { 
    isRecording, 
    recordingTime, 
    audioBlob, 
    startRecording, 
    stopRecording, 
    resetRecording 
  } = useAudioRecorder({ maxDuration: 30 });

  const currentItem = items[currentIndex];
  const isLastItem = currentIndex === items.length - 1;

  // Generate TTS audio for current item
  const generateAudio = useCallback(async () => {
    if (!currentItem || generatedAudio[currentItem.id]) return;
    
    setIsGeneratingAudio(true);
    try {
      const { data, error } = await supabase.functions.invoke('french-tts', {
        body: { 
          text: currentItem.audioScript,
          speed: 1.2,  // Slightly fast, natural pace
          stability: 0.35  // More natural variation
        }
      });
      
      if (error) throw error;
      
      if (data?.audioContent) {
        const audioUrl = `data:audio/mp3;base64,${data.audioContent}`;
        setGeneratedAudio(prev => ({ ...prev, [currentItem.id]: audioUrl }));
      }
    } catch (err) {
      console.error('Error generating audio:', err);
      toast.error('Failed to generate audio');
    } finally {
      setIsGeneratingAudio(false);
    }
  }, [currentItem, generatedAudio]);

  // Pre-generate audio when item changes
  useEffect(() => {
    if (currentItem && !showIntro) {
      generateAudio();
    }
  }, [currentItem, showIntro, generateAudio]);

  const handlePlayAudio = () => {
    if (!currentItem) return;
    
    // Dev mode: skip audio
    if (isDev && skipAudio) {
      setAudioPlayedAt(prev => ({ ...prev, [currentItem.id]: new Date() }));
      setItemPhase('played');
      return;
    }
    
    const audioUrl = generatedAudio[currentItem.id];
    if (!audioUrl) {
      toast.error('Audio not ready yet');
      return;
    }
    
    setItemPhase('playing');
    
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    
    audio.onended = () => {
      setAudioPlayedAt(prev => ({ ...prev, [currentItem.id]: new Date() }));
      setItemPhase('played');
    };
    
    audio.onerror = () => {
      toast.error('Failed to play audio');
      setItemPhase('ready');
    };
    
    audio.play();
  };

  const handleStartRecording = async () => {
    setItemPhase('recording');
    await startRecording();
  };

  const handleStopRecording = () => {
    stopRecording();
  };

  // Process recording when audioBlob is ready
  useEffect(() => {
    if (audioBlob && itemPhase === 'recording') {
      handleSubmitRecording(audioBlob);
    }
  }, [audioBlob]);

  const handleSubmitRecording = async (blob: Blob) => {
    if (!currentItem || !user) return;
    
    setItemPhase('processing');
    
    try {
      // Create recording entry
      const { data: recording, error: insertError } = await supabase
        .from('comprehension_recordings')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          item_id: currentItem.id,
          audio_played_at: audioPlayedAt[currentItem.id]?.toISOString(),
          status: 'pending'
        })
        .select('id')
        .single();
      
      if (insertError) throw insertError;
      
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
      });
      reader.readAsDataURL(blob);
      const audioBase64 = await base64Promise;
      
      // Analyze comprehension
      const { data, error } = await supabase.functions.invoke('analyze-comprehension', {
        body: {
          audioBase64,
          itemId: currentItem.id,
          recordingId: recording.id,
          itemConfig: {
            context: currentItem.context,
            audioScript: currentItem.audioScript,
            keyFacts: currentItem.keyFacts,
            acceptableIntents: currentItem.acceptableIntents
          }
        }
      });
      
      if (error) throw error;
      
      setResults(prev => ({
        ...prev,
        [currentItem.id]: {
          transcript: data.transcript,
          score: data.score,
          feedbackFr: data.feedbackFr,
          understoodFacts: data.understoodFacts,
          intentMatch: data.intentMatch
        }
      }));
      
      setItemPhase('complete');
      
    } catch (err) {
      console.error('Error processing recording:', err);
      toast.error('Failed to process your response');
      setItemPhase('played');
    }
  };

  const handleTextSubmit = async () => {
    if (!currentItem || !user || !devTextInput.trim()) return;
    
    setItemPhase('processing');
    
    try {
      // Create recording entry
      const { data: recording, error: insertError } = await supabase
        .from('comprehension_recordings')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          item_id: currentItem.id,
          audio_played_at: audioPlayedAt[currentItem.id]?.toISOString() || new Date().toISOString(),
          status: 'pending'
        })
        .select('id')
        .single();
      
      if (insertError) throw insertError;
      
      // Analyze with text input
      const { data, error } = await supabase.functions.invoke('analyze-comprehension', {
        body: {
          transcript: devTextInput,
          itemId: currentItem.id,
          recordingId: recording.id,
          itemConfig: {
            context: currentItem.context,
            audioScript: currentItem.audioScript,
            keyFacts: currentItem.keyFacts,
            acceptableIntents: currentItem.acceptableIntents
          }
        }
      });
      
      if (error) throw error;
      
      setResults(prev => ({
        ...prev,
        [currentItem.id]: {
          transcript: data.transcript,
          score: data.score,
          feedbackFr: data.feedbackFr,
          understoodFacts: data.understoodFacts,
          intentMatch: data.intentMatch
        }
      }));
      
      setItemPhase('complete');
      setDevTextInput('');
      
    } catch (err) {
      console.error('Error processing text:', err);
      toast.error('Failed to process your response');
      setItemPhase('played');
    }
  };

  const handleNext = () => {
    if (isLastItem) {
      // Lock module and complete
      supabase
        .from('assessment_sessions')
        .update({ 
          comprehension_locked: true, 
          comprehension_locked_at: new Date().toISOString() 
        })
        .eq('id', sessionId)
        .then(() => onComplete());
    } else {
      resetRecording();
      setCurrentIndex(prev => prev + 1);
      setItemPhase('ready');
    }
  };

  const handleRedo = () => {
    resetRecording();
    setItemPhase('played');
  };

  // Intro screen
  if (showIntro) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-primary/20">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Headphones className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Listening Comprehension</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-muted-foreground">
              Listen to short French audio clips and respond naturally. This tests your ability to understand spoken French at natural speed.
            </p>
            
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium">How it works:</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• You'll see a context (e.g., "You're at a bakery")</li>
                <li>• Click play to hear the audio <strong>once</strong></li>
                <li>• Respond by speaking as you would in real life</li>
                <li>• We'll evaluate if you understood the key information</li>
              </ul>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <strong>Important:</strong> You can only play each audio clip once. Listen carefully!
              </p>
            </div>

            <div className="text-center pt-4">
              <Button size="lg" onClick={() => setShowIntro(false)} className="gap-2">
                Start Listening Test
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentItem) {
    return <div>Loading...</div>;
  }

  const result = results[currentItem.id];
  const hasPlayed = !!audioPlayedAt[currentItem.id];
  const isAudioReady = !!generatedAudio[currentItem.id];

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Progress bar */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Item {currentIndex + 1} of {items.length}</span>
        <Badge variant="outline" className="gap-1">
          <Headphones className="h-3 w-3" />
          Listening
        </Badge>
      </div>
      
      {/* Dev mode toggle */}
      {isDev && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="py-3">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="text-input"
                  checked={useTextInput}
                  onCheckedChange={setUseTextInput}
                />
                <Label htmlFor="text-input" className="text-xs">Text input</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="skip-audio"
                  checked={skipAudio}
                  onCheckedChange={setSkipAudio}
                />
                <Label htmlFor="skip-audio" className="text-xs">Skip audio</Label>
              </div>
              <Badge variant="outline" className="text-xs">DEV</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="text-sm text-muted-foreground mb-2">Context:</div>
          <CardTitle className="text-xl">{currentItem.context}</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Audio section */}
          <div className="bg-muted/30 rounded-lg p-6 text-center space-y-4">
            {itemPhase === 'ready' && (
              <>
                {isGeneratingAudio ? (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Preparing audio...</span>
                  </div>
                ) : !isAudioReady ? (
                  <Button onClick={generateAudio} variant="outline" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Load Audio
                  </Button>
                ) : (
                  <Button 
                    size="lg" 
                    onClick={handlePlayAudio}
                    className="gap-2"
                  >
                    <Play className="h-5 w-5" />
                    Play Audio (One Time Only)
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">
                  Listen carefully — you can only play this once
                </p>
              </>
            )}
            
            {itemPhase === 'playing' && (
              <div className="flex items-center justify-center gap-3">
                <Volume2 className="h-6 w-6 text-primary animate-pulse" />
                <span className="text-lg">Playing audio...</span>
              </div>
            )}
            
            {(itemPhase === 'played' || itemPhase === 'recording' || itemPhase === 'processing' || itemPhase === 'complete') && hasPlayed && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <VolumeX className="h-5 w-5" />
                <span className="text-sm">Audio played</span>
              </div>
            )}
          </div>

          {/* Recording section */}
          {(itemPhase === 'played' || itemPhase === 'recording') && (
            <div className="space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                Now respond as you would in this situation:
              </div>
              
              {isDev && useTextInput ? (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Type your response in French..."
                    value={devTextInput}
                    onChange={(e) => setDevTextInput(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <Button 
                    onClick={handleTextSubmit}
                    disabled={!devTextInput.trim()}
                    className="w-full"
                  >
                    Submit Response
                  </Button>
                </div>
              ) : (
                <div className="flex justify-center">
                  {!isRecording ? (
                    <Button 
                      size="lg" 
                      onClick={handleStartRecording}
                      className="gap-2"
                    >
                      <Mic className="h-5 w-5" />
                      Start Recording
                    </Button>
                  ) : (
                    <div className="space-y-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-lg font-mono">{formatTime(recordingTime)}</span>
                      </div>
                      <Button 
                        variant="destructive" 
                        size="lg"
                        onClick={handleStopRecording}
                        className="gap-2"
                      >
                        <Square className="h-5 w-5" />
                        Stop Recording
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Processing state */}
          {itemPhase === 'processing' && (
            <div className="flex items-center justify-center gap-3 py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Analyzing your response...</span>
            </div>
          )}

          {/* Result */}
          {itemPhase === 'complete' && result && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
                <span className="font-medium">Score</span>
                <Badge variant="default" className="text-lg px-3">
                  {result.score}/100
                </Badge>
              </div>
              
              <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                <div className="font-medium text-sm">Feedback:</div>
                <p className="text-muted-foreground">{result.feedbackFr}</p>
              </div>
              
              {isDev && (
                <div className="p-4 bg-amber-500/10 rounded-lg space-y-2 text-xs">
                  <div className="font-medium">Dev Details:</div>
                  <div><strong>Transcript:</strong> {result.transcript}</div>
                  <div><strong>Intent:</strong> {result.intentMatch.type} ({result.intentMatch.ok ? '✓' : '✗'})</div>
                  <div><strong>Facts:</strong></div>
                  <ul className="ml-4">
                    {result.understoodFacts.map((f, i) => (
                      <li key={i}>{f.ok ? '✓' : '✗'} {f.fact}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={handleRedo} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                <Button onClick={handleNext} className="flex-1 gap-2">
                  {isLastItem ? (
                    <>
                      Complete
                      <Check className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Next Item
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
