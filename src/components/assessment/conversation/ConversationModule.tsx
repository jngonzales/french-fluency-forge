import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessagesSquare, 
  ArrowRight, 
  Mic, 
  Square, 
  Volume2, 
  Check,
  Loader2,
  Send,
  User,
  Bot
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useAudioRecorder, formatTime } from '@/hooks/useAudioRecorder';
import { getRandomScenario, type ConversationScenario } from './conversationScenarios';

interface ConversationModuleProps {
  sessionId: string;
  onComplete: () => void;
}

interface ConversationMessage {
  role: 'agent' | 'user';
  content: string;
}

interface ScoringResult {
  overall: number;
  subs: {
    comprehension_task: { score: number; evidence: string[] };
    repair: { score: number; evidence: string[] };
    flow: { score: number; evidence: string[] };
  };
  flags: string[];
  confidence: number;
}

type ConversationPhase = 'intro' | 'chat' | 'scoring' | 'complete';

const MIN_TURNS = 4; // Minimum user turns before allowing end
const MAX_TURNS = 8; // Maximum user turns

export function ConversationModule({ sessionId, onComplete }: ConversationModuleProps) {
  const { user } = useAuth();
  const [phase, setPhase] = useState<ConversationPhase>('intro');
  const [scenario, setScenario] = useState<ConversationScenario | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [userTurnCount, setUserTurnCount] = useState(0);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  
  // Dev mode states
  const isDev = import.meta.env.DEV || window.location.pathname.startsWith('/dev');
  const [useTextInput, setUseTextInput] = useState(false);
  const [devTextInput, setDevTextInput] = useState('');
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const { 
    isRecording, 
    recordingTime, 
    audioBlob, 
    startRecording, 
    stopRecording, 
    resetRecording 
  } = useAudioRecorder({ maxDuration: 30 });

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Start conversation
  const handleStart = useCallback(async () => {
    const selectedScenario = getRandomScenario();
    setScenario(selectedScenario);
    
    // Create recording entry for storing the full conversation
    if (user) {
      const { data, error } = await supabase
        .from('skill_recordings')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          item_id: selectedScenario.id,
          module_type: 'conversation',
          status: 'pending'
        })
        .select('id')
        .single();
      
      if (!error && data) {
        setRecordingId(data.id);
      }
    }
    
    // Add agent's starter turn
    setMessages([{
      role: 'agent',
      content: selectedScenario.starterAgentTurn
    }]);
    
    setPhase('chat');
  }, [sessionId, user]);

  // Process user's audio/text input
  const processUserInput = async (transcript: string) => {
    if (!scenario || !transcript.trim()) return;
    
    // Add user message
    const newMessages: ConversationMessage[] = [
      ...messages,
      { role: 'user', content: transcript }
    ];
    setMessages(newMessages);
    setUserTurnCount(prev => prev + 1);
    resetRecording();
    
    // Check if conversation should end
    if (userTurnCount + 1 >= MAX_TURNS) {
      // End conversation and score
      handleEndConversation(newMessages);
      return;
    }
    
    // Get agent response
    setIsAgentTyping(true);
    try {
      const { data, error } = await supabase.functions.invoke('conversation-agent', {
        body: {
          action: 'agent_turn',
          conversationHistory: newMessages,
          scenario: {
            title: scenario.title,
            goal: scenario.goal,
            slots: scenario.slots,
            persona_id: scenario.persona_id,
            tier: scenario.tier,
            planned_repair_events: scenario.planned_repair_events,
            required_slots: scenario.required_slots,
            end_conditions: scenario.end_conditions,
            context: scenario.context
          },
          turnNumber: newMessages.length
        }
      });
      
      if (error) throw error;
      
      if (data?.agentResponse) {
        setMessages(prev => [...prev, { role: 'agent', content: data.agentResponse }]);
      }
    } catch (err) {
      console.error('Error getting agent response:', err);
      toast.error('Failed to get response');
    } finally {
      setIsAgentTyping(false);
    }
  };

  // Handle audio blob
  useEffect(() => {
    if (audioBlob && !isTranscribing) {
      handleTranscribeAudio(audioBlob);
    }
  }, [audioBlob]);

  const handleTranscribeAudio = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
      });
      reader.readAsDataURL(blob);
      const audioBase64 = await base64Promise;
      
      const { data, error } = await supabase.functions.invoke('conversation-agent', {
        body: {
          action: 'transcribe',
          audioBase64
        }
      });
      
      if (error) throw error;
      
      if (data?.transcript) {
        await processUserInput(data.transcript);
      }
    } catch (err) {
      console.error('Error transcribing:', err);
      toast.error('Failed to transcribe audio');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleTextSubmit = async () => {
    if (!devTextInput.trim()) return;
    const text = devTextInput;
    setDevTextInput('');
    await processUserInput(text);
  };

  const handleEndConversation = async (finalMessages?: ConversationMessage[]) => {
    const messagesToScore = finalMessages || messages;
    if (!scenario || !recordingId) return;
    
    setPhase('scoring');
    
    try {
      const { data, error } = await supabase.functions.invoke('conversation-agent', {
        body: {
          action: 'score',
          conversationHistory: messagesToScore,
          scenario: {
            title: scenario.title,
            goal: scenario.goal,
            slots: scenario.slots
          },
          recordingId
        }
      });
      
      if (error) throw error;
      
      if (data?.scoring) {
        setScoringResult(data.scoring);
        setPhase('complete');
      }
    } catch (err) {
      console.error('Error scoring:', err);
      toast.error('Failed to score conversation');
      setPhase('complete');
    }
  };

  const handleComplete = async () => {
    // Lock module
    await supabase
      .from('assessment_sessions')
      .update({ 
        conversation_locked: true, 
        conversation_locked_at: new Date().toISOString() 
      })
      .eq('id', sessionId);
    
    onComplete();
  };

  // Intro screen
  if (phase === 'intro') {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-primary/20">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <MessagesSquare className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Conversation Practice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-muted-foreground">
              Have a real conversation with an AI partner in French. You'll be given a scenario and need to communicate naturally to achieve a goal.
            </p>
            
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium">What we're assessing:</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• <strong>Comprehension</strong> — Did you understand and stay on topic?</li>
                <li>• <strong>Repair Strategies</strong> — How you handle confusion</li>
                <li>• <strong>Conversational Flow</strong> — Natural back-and-forth</li>
              </ul>
            </div>

            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 space-y-2">
              <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                Useful phrases if you don't understand:
              </p>
              <ul className="text-sm text-green-700 dark:text-green-400 space-y-1">
                <li>• "Pardon, vous voulez dire que… ?"</li>
                <li>• "Vous pouvez répéter, s'il vous plaît ?"</li>
                <li>• "Je n'ai pas compris la dernière partie."</li>
              </ul>
            </div>

            <div className="text-center pt-4">
              <Button size="lg" onClick={handleStart} className="gap-2">
                Start Conversation
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Chat interface
  if (phase === 'chat') {
    const canEnd = userTurnCount >= MIN_TURNS;
    
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Badge variant="outline" className="gap-1 mb-2">
              <MessagesSquare className="h-3 w-3" />
              {scenario?.title}
            </Badge>
            <p className="text-sm text-muted-foreground">{scenario?.goal}</p>
          </div>
          <div className="text-sm text-muted-foreground">
            Turn {userTurnCount}/{MAX_TURNS}
          </div>
        </div>

        {/* Dev mode toggle */}
        {isDev && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="py-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="text-input"
                    checked={useTextInput}
                    onCheckedChange={setUseTextInput}
                  />
                  <Label htmlFor="text-input" className="text-xs">Text input</Label>
                </div>
                <Badge variant="outline" className="text-xs">DEV</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chat messages */}
        <Card className="h-[400px] flex flex-col">
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === 'agent' ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    {msg.role === 'agent' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>
                  <div className={`rounded-lg px-4 py-2 max-w-[80%] ${
                    msg.role === 'agent' 
                      ? 'bg-muted' 
                      : 'bg-primary text-primary-foreground'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              
              {isAgentTyping && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/10">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          {/* Input area */}
          <div className="border-t p-4 space-y-3">
            {isTranscribing ? (
              <div className="flex items-center justify-center gap-2 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Transcribing...</span>
              </div>
            ) : isDev && useTextInput ? (
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type in French..."
                  value={devTextInput}
                  onChange={(e) => setDevTextInput(e.target.value)}
                  className="min-h-[60px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleTextSubmit();
                    }
                  }}
                />
                <Button 
                  onClick={handleTextSubmit}
                  disabled={!devTextInput.trim() || isAgentTyping}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-4">
                {!isRecording ? (
                  <Button 
                    size="lg" 
                    onClick={startRecording}
                    disabled={isAgentTyping}
                    className="gap-2"
                  >
                    <Mic className="h-5 w-5" />
                    Record Response
                  </Button>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                      <span className="font-mono">{formatTime(recordingTime)}</span>
                    </div>
                    <Button 
                      variant="destructive"
                      onClick={stopRecording}
                      className="gap-2"
                    >
                      <Square className="h-4 w-4" />
                      Stop
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {canEnd && !isRecording && (
              <div className="text-center">
                <Button 
                  variant="outline" 
                  onClick={() => handleEndConversation()}
                  disabled={isAgentTyping || isTranscribing}
                >
                  End Conversation & Get Score
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // Scoring state
  if (phase === 'scoring') {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="text-lg">Evaluating your conversation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Complete state
  if (phase === 'complete') {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Conversation Complete!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {scoringResult && (
              <>
                <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
                  <span className="font-medium text-lg">Overall Score</span>
                  <Badge variant="default" className="text-xl px-4 py-1">
                    {scoringResult.overall}/100
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium">Score Breakdown:</h4>
                  <div className="grid gap-2">
                    <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
                      <span>Comprehension & Task</span>
                      <span className="font-medium">{scoringResult.subs.comprehension_task.score}/45</span>
                    </div>
                    <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
                      <span>Repair Strategies</span>
                      <span className="font-medium">{scoringResult.subs.repair.score}/30</span>
                    </div>
                    <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
                      <span>Conversational Flow</span>
                      <span className="font-medium">{scoringResult.subs.flow.score}/25</span>
                    </div>
                  </div>
                </div>

                {isDev && (
                  <div className="p-4 bg-amber-500/10 rounded-lg text-xs space-y-2">
                    <div className="font-medium">Dev Details:</div>
                    <div><strong>Flags:</strong> {scoringResult.flags.length > 0 ? scoringResult.flags.join(', ') : 'None'}</div>
                    <div><strong>Confidence:</strong> {(scoringResult.confidence * 100).toFixed(0)}%</div>
                    <div><strong>Evidence:</strong></div>
                    <ul className="ml-4 space-y-1">
                      {scoringResult.subs.comprehension_task.evidence.map((e, i) => (
                        <li key={i}>📝 {e}</li>
                      ))}
                      {scoringResult.subs.repair.evidence.map((e, i) => (
                        <li key={i}>🔧 {e}</li>
                      ))}
                      {scoringResult.subs.flow.evidence.map((e, i) => (
                        <li key={i}>💬 {e}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
            
            <div className="text-center pt-4">
              <Button size="lg" onClick={handleComplete} className="gap-2">
                Continue
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
