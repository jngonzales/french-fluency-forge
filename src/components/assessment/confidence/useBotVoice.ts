/**
 * Bot Voice Controller Hook
 * 
 * Manages TTS audio generation and playback for phone call simulation.
 * Pre-generates audio for all scenario turns on load.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ConfidenceScenario } from './types';

interface UseBotVoiceOptions {
  scenario: ConfidenceScenario;
  onAudioStart?: (turnNumber: number) => void;
  onAudioEnd?: (turnNumber: number) => void;
  onError?: (error: string) => void;
}

interface BotVoiceState {
  isLoading: boolean;
  isPlaying: boolean;
  currentTurn: number | null;
  audioUrls: Record<number, string>; // turnNumber -> audio URL
  error: string | null;
}

export function useBotVoice({ scenario, onAudioStart, onAudioEnd, onError }: UseBotVoiceOptions) {
  const [state, setState] = useState<BotVoiceState>({
    isLoading: true,
    isPlaying: false,
    currentTurn: null,
    audioUrls: {},
    error: null
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const generationAbortController = useRef<AbortController | null>(null);

  /**
   * Generate TTS audio for a single turn
   */
  const generateTurnAudio = useCallback(async (
    turnNumber: number,
    text: string,
    signal?: AbortSignal
  ): Promise<string> => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/french-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            text,
            speed: 0.95, // Slightly slower for clarity in conversation
            stability: 0.6, // Balanced naturalness
            outputFormat: 'mp3_44100_128'
          }),
          signal
        }
      );

      if (!response.ok) {
        throw new Error(`TTS generation failed: ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      console.log(`[BotVoice] Generated audio for turn ${turnNumber}`);
      return url;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log(`[BotVoice] Generation aborted for turn ${turnNumber}`);
        throw error;
      }
      console.error(`[BotVoice] Error generating audio for turn ${turnNumber}:`, error);
      throw error;
    }
  }, []);

  /**
   * Pre-generate audio for all turns
   */
  const preGenerateAudio = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    // Create abort controller for cancellation
    generationAbortController.current = new AbortController();
    const { signal } = generationAbortController.current;

    try {
      const audioUrls: Record<number, string> = {};

      // Generate audio for each turn sequentially
      for (const turn of scenario.turns) {
        if (signal.aborted) break;
        
        const url = await generateTurnAudio(
          turn.turnNumber,
          turn.botScript,
          signal
        );
        
        audioUrls[turn.turnNumber] = url;
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        audioUrls,
        error: null
      }));
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        const errorMsg = error instanceof Error ? error.message : 'Failed to generate audio';
        setState(prev => ({ ...prev, isLoading: false, error: errorMsg }));
        onError?.(errorMsg);
      }
    }
  }, [scenario, generateTurnAudio, onError]);

  /**
   * Play audio for a specific turn
   */
  const playTurn = useCallback((turnNumber: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      const audioUrl = state.audioUrls[turnNumber];
      
      if (!audioUrl) {
        const error = `Audio not ready for turn ${turnNumber}`;
        setState(prev => ({ ...prev, error }));
        reject(new Error(error));
        return;
      }

      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setState(prev => ({ ...prev, isPlaying: true, currentTurn: turnNumber }));
        onAudioStart?.(turnNumber);
      };

      audio.onended = () => {
        setState(prev => ({ ...prev, isPlaying: false, currentTurn: null }));
        onAudioEnd?.(turnNumber);
        resolve();
      };

      audio.onerror = () => {
        const error = `Failed to play audio for turn ${turnNumber}`;
        setState(prev => ({ ...prev, isPlaying: false, currentTurn: null, error }));
        onError?.(error);
        reject(new Error(error));
      };

      audio.play().catch((err) => {
        const error = `Audio playback error: ${err.message}`;
        setState(prev => ({ ...prev, isPlaying: false, currentTurn: null, error }));
        onError?.(error);
        reject(err);
      });
    });
  }, [state.audioUrls, onAudioStart, onAudioEnd, onError]);

  /**
   * Stop current audio playback
   */
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setState(prev => ({ ...prev, isPlaying: false, currentTurn: null }));
    }
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    // Pre-generate audio on mount
    preGenerateAudio();

    return () => {
      // Abort any ongoing generation
      generationAbortController.current?.abort();
      
      // Stop playback
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Revoke object URLs to free memory
      Object.values(state.audioUrls).forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [scenario.id]); // Re-generate if scenario changes

  return {
    isLoading: state.isLoading,
    isPlaying: state.isPlaying,
    currentTurn: state.currentTurn,
    error: state.error,
    playTurn,
    stop,
    isReady: !state.isLoading && Object.keys(state.audioUrls).length === scenario.turns.length
  };
}

