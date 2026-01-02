/**
 * Phrases Session Hook
 * Manages session state, queue, and review logic
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { MemberPhraseCard, Rating, PhraseReviewLog, SessionState } from '../types';
import { getPhraseById } from '../data/mockPhrasesData';
import { calculateNextReview, buildSessionQueue, previewIntervals } from '../data/schedulerMock';
import { usePhrasesSettings } from './usePhrasesSettings';

export function usePhrasesSession() {
  const { user } = useAuth();
  const memberId = user?.id || 'guest';
  const { settings } = usePhrasesSettings();
  
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [cards, setCards] = useState<MemberPhraseCard[]>([]);
  const [reviewLogs, setReviewLogs] = useState<PhraseReviewLog[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Rate card
  const rateCard = useCallback((rating: Rating) => {
    if (!sessionState || !currentCard || !currentPhrase) return;

    const responseTime = sessionState.revealTime && sessionState.startTime
      ? sessionState.revealTime - sessionState.startTime
      : undefined;

    // Update card with new scheduling
    const updatedCard = calculateNextReview(currentCard, rating);
    const updatedCards = cards.map((c) => c.id === updatedCard.id ? updatedCard : c);
    saveCards(updatedCards);

    // Log the review
    const log: PhraseReviewLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      member_id: memberId,
      phrase_id: currentCard.phrase_id,
      card_id: currentCard.id,
      started_at: new Date(sessionState.startTime || Date.now()).toISOString(),
      revealed_at: sessionState.revealTime ? new Date(sessionState.revealTime).toISOString() : undefined,
      rated_at: new Date().toISOString(),
      rating,
      response_time_ms: responseTime,
      mode: currentPhrase.mode,
      speech_used: false,
    };
    saveLogs([...reviewLogs, log]);

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
  }, [sessionState, currentCard, currentPhrase, cards, saveCards, reviewLogs, saveLogs, memberId]);

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

  // Get interval previews for current card
  const intervals = currentCard ? previewIntervals(currentCard) : null;

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
    },
  };
}

