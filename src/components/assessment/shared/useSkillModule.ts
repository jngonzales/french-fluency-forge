import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { SkillPrompt, SkillRecordingResult } from './types';

interface UseSkillModuleProps {
  sessionId: string;
  moduleType: 'confidence' | 'syntax' | 'conversation';
  prompts: SkillPrompt[];
  onComplete: () => void;
}

export function useSkillModule({ sessionId, moduleType, prompts, onComplete }: UseSkillModuleProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [attempts, setAttempts] = useState<Record<string, number>>({});
  const [results, setResults] = useState<Record<string, SkillRecordingResult>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  
  const currentPrompt = prompts[currentIndex];
  const isLastPrompt = currentIndex === prompts.length - 1;

  const getAttemptCount = useCallback((itemId: string) => {
    return attempts[itemId] || 1;
  }, [attempts]);

  const handleRecordingComplete = useCallback(async (
    audioBlob: Blob,
    durationSeconds: number
  ): Promise<SkillRecordingResult | null> => {
    if (!user || !currentPrompt) return null;

    setIsProcessing(true);
    const itemId = currentPrompt.id;
    const attemptNumber = getAttemptCount(itemId);

    try {
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const audioBase64 = btoa(binary);

      // Mark previous attempts as superseded
      if (attemptNumber > 1) {
        await supabase
          .from('skill_recordings')
          .update({ superseded: true, used_for_scoring: false })
          .eq('session_id', sessionId)
          .eq('item_id', itemId)
          .eq('module_type', moduleType);
      }

      // Create recording record
      const { data: recording, error: insertError } = await supabase
        .from('skill_recordings')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          module_type: moduleType,
          item_id: itemId,
          attempt_number: attemptNumber,
          duration_seconds: durationSeconds,
          status: 'uploading'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Call analyze-skill edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-skill`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            audioBase64,
            audioMimeType: audioBlob.type || 'audio/webm',
            moduleType,
            itemId,
            promptText: currentPrompt.text,
            recordingId: recording.id
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const analysisResult = await response.json();

      const result: SkillRecordingResult = {
        id: recording.id,
        transcript: analysisResult.transcript,
        wordCount: analysisResult.wordCount,
        score: analysisResult.score,
        feedback: analysisResult.feedback,
        breakdown: analysisResult.breakdown
      };

      setResults(prev => ({ ...prev, [itemId]: result }));
      setIsProcessing(false);

      return result;

    } catch (error) {
      console.error('Recording submission error:', error);
      setIsProcessing(false);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process recording',
        variant: 'destructive'
      });
      return null;
    }
  }, [user, currentPrompt, sessionId, moduleType, getAttemptCount, toast]);

  // Dev mode: submit text directly (bypasses Whisper)
  const handleTextSubmit = useCallback(async (text: string): Promise<SkillRecordingResult | null> => {
    if (!user || !currentPrompt) return null;

    setIsProcessing(true);
    const itemId = currentPrompt.id;
    const attemptNumber = getAttemptCount(itemId);

    try {
      // Mark previous attempts as superseded
      if (attemptNumber > 1) {
        await supabase
          .from('skill_recordings')
          .update({ superseded: true, used_for_scoring: false })
          .eq('session_id', sessionId)
          .eq('item_id', itemId)
          .eq('module_type', moduleType);
      }

      // Create recording record
      const { data: recording, error: insertError } = await supabase
        .from('skill_recordings')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          module_type: moduleType,
          item_id: itemId,
          attempt_number: attemptNumber,
          duration_seconds: 0,
          transcript: text,
          status: 'processing'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Call analyze-skill with text directly (skip Whisper)
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-skill`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            transcript: text, // Pass text directly instead of audio
            moduleType,
            itemId,
            promptText: currentPrompt.text,
            recordingId: recording.id
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const analysisResult = await response.json();

      const result: SkillRecordingResult = {
        id: recording.id,
        transcript: text,
        wordCount: text.split(/\s+/).filter(Boolean).length,
        score: analysisResult.score,
        feedback: analysisResult.feedback,
        breakdown: analysisResult.breakdown
      };

      setResults(prev => ({ ...prev, [itemId]: result }));
      setIsProcessing(false);

      return result;

    } catch (error) {
      console.error('Text submission error:', error);
      setIsProcessing(false);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process text',
        variant: 'destructive'
      });
      return null;
    }
  }, [user, currentPrompt, sessionId, moduleType, getAttemptCount, toast]);

  const handleNext = useCallback(() => {
    if (isLastPrompt) {
      onComplete();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  }, [isLastPrompt, onComplete]);

  const handleRedo = useCallback(() => {
    if (!currentPrompt) return;
    setAttempts(prev => ({
      ...prev,
      [currentPrompt.id]: (prev[currentPrompt.id] || 1) + 1
    }));
    setResults(prev => {
      const updated = { ...prev };
      delete updated[currentPrompt.id];
      return updated;
    });
  }, [currentPrompt]);

  return {
    currentPrompt,
    currentIndex,
    totalPrompts: prompts.length,
    isLastPrompt,
    isProcessing,
    getAttemptCount,
    getResult: (itemId: string) => results[itemId],
    handleRecordingComplete,
    handleTextSubmit,
    handleNext,
    handleRedo
  };
}
