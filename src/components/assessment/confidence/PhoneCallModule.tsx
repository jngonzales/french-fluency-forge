/**
 * Phone Call Module
 * 
 * Main component managing the phone-call simulation flow:
 * - Scenario loading
 * - Turn progression (bot speaks → user responds → analyze → next turn)
 * - TTS audio playback
 * - Recording with timing instrumentation
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { PhoneCallScreen } from './PhoneCallScreen';
import { useBotVoice } from './useBotVoice';
import type { ConfidenceScenario, TurnRecording, ConfidenceSpeakingResult } from './types';

interface PhoneCallModuleProps {
  sessionId: string;
  scenario: ConfidenceScenario;
  onComplete: (result: ConfidenceSpeakingResult) => void;
  devMode?: boolean;
}

type CallPhase = 'loading' | 'bot-speaking' | 'waiting-for-user' | 'user-recording' | 'processing' | 'completed';

export function PhoneCallModule({ sessionId, scenario, onComplete, devMode = false }: PhoneCallModuleProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [callId, setCallId] = useState<string | null>(null);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [turnRecordings, setTurnRecordings] = useState<TurnRecording[]>([]);
  const [phase, setPhase] = useState<CallPhase>('loading');
  const [promptEndTime, setPromptEndTime] = useState<Date | null>(null);

  const currentTurn = scenario.turns[currentTurnIndex];
  const isLastTurn = currentTurnIndex === scenario.turns.length - 1;

  // Bot voice management
  const {
    isLoading: isTTSLoading,
    isPlaying: isBotSpeaking,
    playTurn,
    stop: stopBot,
    isReady: isTTSReady,
    error: ttsError
  } = useBotVoice({
    scenario,
    onAudioStart: (turnNumber) => {
      console.log(`[PhoneCall] Bot speaking turn ${turnNumber}`);
      setPhase('bot-speaking');
    },
    onAudioEnd: (turnNumber) => {
      console.log(`[PhoneCall] Bot finished speaking turn ${turnNumber}`);
      setPromptEndTime(new Date());
      setPhase('waiting-for-user');
    },
    onError: (error) => {
      toast({
        title: 'Audio Error',
        description: error,
        variant: 'destructive'
      });
    }
  });

  /**
   * Initialize phone call (generate local ID since tables don't exist yet)
   */
  useEffect(() => {
    const initializeCall = async () => {
      if (!user) return;

      try {
        // Generate a local call ID since database tables don't exist yet
        const localCallId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setCallId(localCallId);
        console.log(`[PhoneCall] Initialized local call ${localCallId} for scenario ${scenario.id}`);
      } catch (error) {
        console.error('[PhoneCall] Failed to initialize call:', error);
        toast({
          title: 'Error',
          description: 'Failed to start phone call',
          variant: 'destructive'
        });
      }
    };

    initializeCall();
  }, [sessionId, scenario.id, scenario.tier, user, toast]);

  /**
   * Start first turn when TTS is ready
   */
  useEffect(() => {
    if (isTTSReady && callId && phase === 'loading') {
      startTurn(0);
    }
  }, [isTTSReady, callId, phase]);

  /**
   * Start a turn (bot speaks)
   */
  const startTurn = useCallback(async (turnIndex: number) => {
    const turn = scenario.turns[turnIndex];
    
    if (devMode) {
      // Dev mode: skip audio, go straight to recording
      setPromptEndTime(new Date());
      setPhase('waiting-for-user');
    } else {
      // Play bot audio
      try {
        await playTurn(turn.turnNumber);
      } catch (error) {
        console.error('[PhoneCall] Failed to play turn:', error);
      }
    }
  }, [scenario, playTurn, devMode]);

  /**
   * Handle user starting to record
   */
  const handleStartRecording = useCallback(() => {
    setPhase('user-recording');
  }, []);

  /**
   * Handle user completing recording
   */
  const handleRecordingComplete = useCallback(async (
    audioBlob: Blob,
    recordingStartTs: Date,
    recordingEndTs: Date
  ) => {
    if (!user || !callId || !promptEndTime) return;

    setPhase('processing');

    try {
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const audioBase64 = btoa(binary);

      // Call Whisper for transcription with word timestamps
      const whisperResponse = await fetch(
        'https://api.openai.com/v1/audio/transcriptions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          },
          body: (() => {
            const formData = new FormData();
            formData.append('file', audioBlob, 'audio.webm');
            formData.append('model', 'whisper-1');
            formData.append('language', 'fr');
            formData.append('response_format', 'verbose_json');
            formData.append('timestamp_granularities[]', 'word');
            return formData;
          })()
        }
      );

      if (!whisperResponse.ok) {
        throw new Error('Transcription failed');
      }

      const whisperResult = await whisperResponse.json();
      const transcript = whisperResult.text || '';
      const wordTimestamps = (whisperResult.words || []).map((w: any) => ({
        word: w.word,
        start: w.start,
        end: w.end
      }));

      // Note: Database tables don't exist yet, logging locally only
      console.log(`[PhoneCall] Turn ${currentTurn.turnNumber} recorded:`, {
        call_id: callId,
        turn_number: currentTurn.turnNumber,
        prompt_end_ts: promptEndTime.toISOString(),
        recording_start_ts: recordingStartTs.toISOString(),
        recording_end_ts: recordingEndTs.toISOString(),
        transcript,
        word_timestamps: wordTimestamps
      });

      // Save recording
      const turnRecording: TurnRecording = {
        turnNumber: currentTurn.turnNumber,
        transcript,
        wordTimestamps,
        promptEndTs: promptEndTime,
        recordingStartTs,
        recordingEndTs,
        audioBlob
      };

      setTurnRecordings(prev => [...prev, turnRecording]);

      // Move to next turn or complete
      if (isLastTurn) {
        await completeCall([...turnRecordings, turnRecording]);
      } else {
        setCurrentTurnIndex(prev => prev + 1);
        startTurn(currentTurnIndex + 1);
      }
    } catch (error) {
      console.error('[PhoneCall] Error processing recording:', error);
      toast({
        title: 'Error',
        description: 'Failed to process your response',
        variant: 'destructive'
      });
      setPhase('waiting-for-user'); // Allow retry
    }
  }, [user, callId, promptEndTime, currentTurn, isLastTurn, turnRecordings, currentTurnIndex, startTurn, toast]);

  /**
   * Handle text submit in dev mode
   */
  const handleTextSubmit = useCallback(async (text: string) => {
    if (!user || !callId || !promptEndTime) return;

    setPhase('processing');

    const now = new Date();
    const turnRecording: TurnRecording = {
      turnNumber: currentTurn.turnNumber,
      transcript: text,
      wordTimestamps: [],
      promptEndTs: promptEndTime,
      recordingStartTs: new Date(promptEndTime.getTime() + 1000), // 1 second latency
      recordingEndTs: now
    };

    // Note: Database tables don't exist yet, storing locally only
    console.log(`[PhoneCall] Text turn ${currentTurn.turnNumber} recorded:`, {
      call_id: callId,
      turn_number: currentTurn.turnNumber,
      prompt_end_ts: promptEndTime.toISOString(),
      recording_start_ts: turnRecording.recordingStartTs.toISOString(),
      recording_end_ts: turnRecording.recordingEndTs.toISOString(),
      transcript: text,
      word_timestamps: []
    });

    setTurnRecordings(prev => [...prev, turnRecording]);

    // Move to next turn or complete
    if (isLastTurn) {
      await completeCall([...turnRecordings, turnRecording]);
    } else {
      setCurrentTurnIndex(prev => prev + 1);
      startTurn(currentTurnIndex + 1);
    }
  }, [user, callId, promptEndTime, currentTurn, isLastTurn, turnRecordings, currentTurnIndex, startTurn]);

  /**
   * Complete call and analyze
   */
  const completeCall = useCallback(async (allRecordings: TurnRecording[]) => {
    if (!callId) return;

    setPhase('processing');

    try {
      // Prepare turn data for analysis
      const turnsData = allRecordings.map(rec => ({
        turnNumber: rec.turnNumber,
        transcript: rec.transcript,
        wordTimestamps: rec.wordTimestamps || [],
        promptEndMs: rec.promptEndTs.getTime(),
        recordingStartMs: rec.recordingStartTs.getTime(),
        recordingEndMs: rec.recordingEndTs.getTime()
      }));

      // Call analysis edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-confidence-speaking`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            turns: turnsData,
            tier: scenario.tier,
            scenarioId: scenario.id
          })
        }
      );

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();

      // Note: Database tables don't exist yet, logging results only
      console.log('[PhoneCall] Analysis complete:', result);
      console.log('[PhoneCall] Call completed:', {
        call_id: callId,
        completed_at: new Date().toISOString(),
        scores: result.scores,
        timing_aggregates: result.timing_aggregates,
        signals: result.signals
      });

      setPhase('completed');
      
      // Pass result to parent
      onComplete({
        callId,
        scenarioId: scenario.id,
        tier: scenario.tier,
        ...result
      });
    } catch (error) {
      console.error('[PhoneCall] Error completing call:', error);
      toast({
        title: 'Error',
        description: 'Failed to analyze your responses',
        variant: 'destructive'
      });
    }
  }, [callId, scenario, onComplete, toast]);

  if (phase === 'loading' || isTTSLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Preparing phone call...</p>
        </div>
      </div>
    );
  }

  if (ttsError && !devMode) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-4">
          <p className="text-destructive">Audio Error: {ttsError}</p>
          <p className="text-sm text-muted-foreground">Please refresh and try again</p>
        </div>
      </div>
    );
  }

  return (
    <PhoneCallScreen
      scenario={scenario}
      currentTurn={currentTurn}
      turnNumber={currentTurnIndex + 1}
      totalTurns={scenario.turns.length}
      phase={phase}
      isBotSpeaking={isBotSpeaking}
      onStartRecording={handleStartRecording}
      onRecordingComplete={handleRecordingComplete}
      onTextSubmit={devMode ? handleTextSubmit : undefined}
      devMode={devMode}
    />
  );
}

