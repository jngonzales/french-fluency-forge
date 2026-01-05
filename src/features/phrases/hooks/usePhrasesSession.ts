/**
 * Phrases Session Hook
 * Manages session state, queue, and review logic
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { MemberPhraseCard, Rating, PhraseReviewLog, SessionState } from '../types';
import { getPhraseById } from '../data/mockPhrasesData';
import { buildSessionQueue } from '../data/schedulerMock';
import { 
  calculateNextReviewFSRS, 
  previewAllIntervalsFSRS,
  formatIntervalFSRS,
  getFSRSConfigFromSettings,
} from '../data/fsrsScheduler';
import { usePhrasesSettings } from './usePhrasesSettings';
import type { SpeechRecognitionResult } from '../services/speechRecognition';
import { isSimilarityGoodEnough } from '../utils/similarityCalculation';

export function usePhrasesSession() {
  const { user } = useAuth();
  const memberId = user?.id || 'guest';
  const { settings } = usePhrasesSettings();
  
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [cards, setCards] = useState<MemberPhraseCard[]>([]);
  const [reviewLogs, setReviewLogs] = useState<PhraseReviewLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [speechResult, setSpeechResult] = useState<SpeechRecognitionResult | null>(null);

  // Load cards and logs from localStorage
  useEffect(() => {
    const cardsKey = `solv_phrases_cards_${memberId}`;
    const logsKey = `solv_phrases_logs_${memberId}`;
    
    const storedCards = localStorage.getItem(cardsKey);
    const storedLogs = localStorage.getItem(logsKey);
    
    if (storedCards) {
      try {
        setCards(JSON.parse(storedCards));
      } catch (err) {
        console.error('Failed to load cards:', err);
      }
    }
    
    if (storedLogs) {
      try {
        setReviewLogs(JSON.parse(storedLogs));
      } catch (err) {
        console.error('Failed to load logs:', err);
      }
    }
    
    setLoading(false);
  }, [memberId]);

  // Save cards to localStorage
  const saveCards = useCallback((updatedCards: MemberPhraseCard[]) => {
    setCards(updatedCards);
    const key = `solv_phrases_cards_${memberId}`;
    localStorage.setItem(key, JSON.stringify(updatedCards));
  }, [memberId]);

  // Save logs to localStorage
  const saveLogs = useCallback((updatedLogs: PhraseReviewLog[]) => {
    setReviewLogs(updatedLogs);
    const key = `solv_phrases_logs_${memberId}`;
    localStorage.setItem(key, JSON.stringify(updatedLogs));
  }, [memberId]);

  // Start a new session
  const startSession = useCallback(() => {
    const queue = buildSessionQueue(cards, settings.new_per_day, settings.reviews_per_day);
    
    if (queue.length === 0) {
      return null;
    }

    const newSession: SessionState = {
      queue,
      currentIndex: 0,
      isRevealed: false,
      startTime: Date.now(),
      completed: 0,
      total: queue.length,
    };

    setSessionState(newSession);
    return newSession;
  }, [cards, settings]);

  // Get current card
  const currentCard = sessionState && sessionState.currentIndex < sessionState.queue.length
    ? sessionState.queue[sessionState.currentIndex]
    : null;

  const currentPhrase = currentCard ? getPhraseById(currentCard.phrase_id) : null;

  // Reveal card
  const revealCard = useCallback(() => {
    if (!sessionState) return;
    
    setSessionState({
      ...sessionState,
      isRevealed: true,
      revealTime: Date.now(),
    });
  }, [sessionState]);

  // Store speech recognition result
  const handleSpeechResult = useCallback((result: SpeechRecognitionResult) => {
    setSpeechResult(result);
    
    // Auto-assess if enabled
    if (settings.auto_assess_enabled) {
      // Suggest rating based on similarity
      let suggestedRating: Rating = 'good';
      if (result.similarity >= 0.90) {
        suggestedRating = 'easy';
      } else if (result.similarity >= 0.75) {
        suggestedRating = 'good';
      } else if (result.similarity >= 0.50) {
        suggestedRating = 'hard';
      } else {
        suggestedRating = 'again';
      }
      
      // Store suggested rating in result (will be used when rating)
      (result as any).suggestedRating = suggestedRating;
    }
  }, [settings.auto_assess_enabled]);

  // Rate card
  const rateCard = useCallback((rating: Rating) => {
    if (!sessionState || !currentCard || !currentPhrase) return;

    const now = new Date();
    const responseTime = sessionState.revealTime && sessionState.startTime
      ? sessionState.revealTime - sessionState.startTime
      : undefined;

    // Calculate overdue metrics
    const lastReviewedAt = currentCard.scheduler.last_reviewed_at 
      ? new Date(currentCard.scheduler.last_reviewed_at)
      : now;
    const dueAt = new Date(currentCard.scheduler.due_at);
    const elapsedMs = now.getTime() - lastReviewedAt.getTime();
    const wasOverdue = dueAt < now;
    const overdueMs = wasOverdue ? now.getTime() - dueAt.getTime() : 0;

    // Store before state
    const stateBefore = currentCard.scheduler.state;
    const dueBefore = currentCard.scheduler.due_at;
    const intervalBeforeMs = currentCard.scheduler.interval_ms;
    const stabilityBefore = currentCard.scheduler.stability;
    const difficultyBefore = currentCard.scheduler.difficulty;

    // Update card with new scheduling using FSRS
    const fsrsConfig = getFSRSConfigFromSettings(settings);
    const { card: updatedCard } = calculateNextReviewFSRS(currentCard, rating, fsrsConfig, now);
    const updatedCards = cards.map((c) => c.id === updatedCard.id ? updatedCard : c);
    saveCards(updatedCards);

    // Enhanced review log with all FSRS fields
    const log: PhraseReviewLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      member_id: memberId,
      phrase_id: currentCard.phrase_id,
      card_id: currentCard.id,
      started_at: new Date(sessionState.startTime || Date.now()).toISOString(),
      revealed_at: sessionState.revealTime ? new Date(sessionState.revealTime).toISOString() : undefined,
      rated_at: now.toISOString(),
      rating,
      response_time_ms: responseTime,
      mode: currentPhrase.mode,
      
      // FSRS scheduling data
      state_before: stateBefore,
      state_after: updatedCard.scheduler.state,
      due_before: dueBefore,
      due_after: updatedCard.scheduler.due_at,
      interval_before_ms: intervalBeforeMs,
      interval_after_ms: updatedCard.scheduler.interval_ms || 0,
      stability_before: stabilityBefore,
      stability_after: updatedCard.scheduler.stability,
      difficulty_before: difficultyBefore,
      difficulty_after: updatedCard.scheduler.difficulty,
      elapsed_ms: elapsedMs,
      was_overdue: wasOverdue,
      overdue_ms: overdueMs > 0 ? overdueMs : undefined,
      
      // Config snapshot
      config_snapshot: {
        fsrs_version: 6,
        request_retention: settings.target_retention,
        learning_steps: ['1m', '10m'], // TODO: get from settings if we add this
        relearning_steps: ['10m'],
        enable_fuzz: false,
      },
      
      // Speech data
      speech_used: speechResult !== null,
      transcript: speechResult?.transcript,
      similarity: speechResult?.similarity,
      auto_assessed: settings.auto_assess_enabled && speechResult !== null,
      suggested_rating: (speechResult as any)?.suggestedRating,
    };
    saveLogs([...reviewLogs, log]);
    
    // Clear speech result for next card
    setSpeechResult(null);

    // Move to next card
    const nextIndex = sessionState.currentIndex + 1;
    
    if (nextIndex >= sessionState.queue.length) {
      // Session complete
      setSessionState({
        ...sessionState,
        currentIndex: nextIndex,
        completed: sessionState.completed + 1,
        isRevealed: false,
      });
    } else {
      // Next card
      setSessionState({
        ...sessionState,
        currentIndex: nextIndex,
        completed: sessionState.completed + 1,
        isRevealed: false,
        startTime: Date.now(),
        revealTime: undefined,
      });
    }

    return updatedCard;
  }, [sessionState, currentCard, currentPhrase, cards, saveCards, reviewLogs, saveLogs, memberId, speechResult, settings]);

  // Card actions during session
  const buryCard = useCallback(() => {
    if (!currentCard) return;
    
    const updatedCard = {
      ...currentCard,
      status: 'buried' as const,
      updated_at: new Date().toISOString(),
    };
    const updatedCards = cards.map((c) => c.id === updatedCard.id ? updatedCard : c);
    saveCards(updatedCards);

    // Remove from queue and move to next
    const newQueue = sessionState!.queue.filter((_, i) => i !== sessionState!.currentIndex);
    setSessionState({
      ...sessionState!,
      queue: newQueue,
      total: newQueue.length,
      isRevealed: false,
      startTime: Date.now(),
      revealTime: undefined,
    });
  }, [currentCard, cards, saveCards, sessionState]);

  const suspendCard = useCallback(() => {
    if (!currentCard) return;
    
    const updatedCard = {
      ...currentCard,
      status: 'suspended' as const,
      updated_at: new Date().toISOString(),
    };
    const updatedCards = cards.map((c) => c.id === updatedCard.id ? updatedCard : c);
    saveCards(updatedCards);

    // Remove from queue and move to next
    const newQueue = sessionState!.queue.filter((_, i) => i !== sessionState!.currentIndex);
    setSessionState({
      ...sessionState!,
      queue: newQueue,
      total: newQueue.length,
      isRevealed: false,
      startTime: Date.now(),
      revealTime: undefined,
    });
  }, [currentCard, cards, saveCards, sessionState]);

  const removeCard = useCallback(() => {
    if (!currentCard) return;
    
    const updatedCard = {
      ...currentCard,
      status: 'removed' as const,
      updated_at: new Date().toISOString(),
    };
    const updatedCards = cards.map((c) => c.id === updatedCard.id ? updatedCard : c);
    saveCards(updatedCards);

    // Remove from queue and move to next
    const newQueue = sessionState!.queue.filter((_, i) => i !== sessionState!.currentIndex);
    setSessionState({
      ...sessionState!,
      queue: newQueue,
      total: newQueue.length,
      isRevealed: false,
      startTime: Date.now(),
      revealTime: undefined,
    });
  }, [currentCard, cards, saveCards, sessionState]);

  const flagCard = useCallback((reason: string) => {
    if (!currentCard) return;
    
    const updatedCard = {
      ...currentCard,
      flag_reason: reason,
      updated_at: new Date().toISOString(),
    };
    const updatedCards = cards.map((c) => c.id === updatedCard.id ? updatedCard : c);
    saveCards(updatedCards);
  }, [currentCard, cards, saveCards]);

  const addNote = useCallback((note: string) => {
    if (!currentCard) return;
    
    const updatedCard = {
      ...currentCard,
      note,
      updated_at: new Date().toISOString(),
    };
    const updatedCards = cards.map((c) => c.id === updatedCard.id ? updatedCard : c);
    saveCards(updatedCards);
  }, [currentCard, cards, saveCards]);

  // Get interval previews for current card (using FSRS)
  const fsrsConfig = getFSRSConfigFromSettings(settings);
  const intervalPreviews = currentCard 
    ? previewAllIntervalsFSRS(currentCard, fsrsConfig)
    : null;
  
  const intervals = intervalPreviews
    ? {
        again: formatIntervalFSRS(intervalPreviews.again.interval_ms),
        hard: formatIntervalFSRS(intervalPreviews.hard.interval_ms),
        good: formatIntervalFSRS(intervalPreviews.good.interval_ms),
        easy: formatIntervalFSRS(intervalPreviews.easy.interval_ms),
      }
    : null;
  
  const exactDueDates = intervalPreviews
    ? {
        again: new Date(intervalPreviews.again.due_at),
        hard: new Date(intervalPreviews.hard.due_at),
        good: new Date(intervalPreviews.good.due_at),
        easy: new Date(intervalPreviews.easy.due_at),
      }
    : null;

  // Calculate time left in session (estimate 20s per card)
  const estimatedTimeLeft = sessionState
    ? (sessionState.total - sessionState.completed) * 20
    : 0;

  // Check if session is complete
  const isComplete = sessionState
    ? sessionState.currentIndex >= sessionState.queue.length
    : false;

  // End session
  const endSession = useCallback(() => {
    setSessionState(null);
  }, []);

  return {
    sessionState,
    currentCard,
    currentPhrase,
    loading,
    isComplete,
    estimatedTimeLeft,
    intervals,
    exactDueDates,
    speechResult,
    actions: {
      startSession,
      revealCard,
      rateCard,
      buryCard,
      suspendCard,
      removeCard,
      flagCard,
      addNote,
      endSession,
      handleSpeechResult,
    },
  };
}

