import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getRandomPrompts, type FluencyPictureCard } from "./fluencyPictureCards";
import type { RecordingState } from "./FluencyRecordingCard";
import type { Json } from "@/integrations/supabase/types";

// Number of prompts per assessment
const CARDS_PER_ASSESSMENT = 3;

interface ItemState {
  recordingState: RecordingState;
  attemptCount: number;
  recordingId?: string;
  errorMessage?: string;
  score?: number;
  speedSubscore?: number;
  pauseSubscore?: number;
}

export function useFluencyModule(sessionId: string) {
  const { user } = useAuth();
  const [pictureCards, setPictureCards] = useState<FluencyPictureCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemStates, setItemStates] = useState<Record<string, ItemState>>({});
  const [moduleAttemptCount, setModuleAttemptCount] = useState(1);
  const [allComplete, setAllComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize prompts on mount
  useEffect(() => {
    const cards = getRandomPrompts(CARDS_PER_ASSESSMENT);
    setPictureCards(cards);
    
    const initial: Record<string, ItemState> = {};
    cards.forEach((card) => {
      initial[card.id] = { recordingState: "ready", attemptCount: 1 };
    });
    setItemStates(initial);
    setIsLoading(false);
  }, []);

  const currentCard = pictureCards[currentIndex];
  const currentState = currentCard ? itemStates[currentCard.id] : { recordingState: "ready" as RecordingState, attemptCount: 1 };

  const logEvent = useCallback(async (
    eventType: "fluency_recording_started" | "fluency_recording_completed" | "fluency_redo_clicked" | "fluency_redo_confirmed" | "fluency_redo_cancelled" | "fluency_module_locked",
    itemId?: string,
    attemptNumber?: number,
    metadata?: Record<string, unknown>
  ) => {
    if (!user) return;
    
    try {
      const insertData = {
        session_id: sessionId,
        user_id: user.id,
        event_type: eventType,
        item_id: itemId ?? null,
        attempt_number: attemptNumber ?? null,
        metadata: (metadata ?? null) as Json,
      };
      await supabase.from("fluency_events").insert(insertData);
    } catch (error) {
      console.error("Failed to log event:", error);
    }
  }, [sessionId, user]);

  const setRecordingState = useCallback((state: RecordingState) => {
    if (!currentCard) return;
    
    setItemStates((prev) => ({
      ...prev,
      [currentCard.id]: { ...prev[currentCard.id], recordingState: state },
    }));
    
    if (state === "recording") {
      logEvent("fluency_recording_started", currentCard.id, currentState.attemptCount);
    }
  }, [currentCard, currentState.attemptCount, logEvent]);

  const handleRecordingComplete = useCallback(async (audioBlob: Blob, duration: number): Promise<void> => {
    if (!user || !currentCard) throw new Error("Not authenticated");

    console.log("[Fluency] Starting recording upload for", currentCard.id, "attempt", currentState.attemptCount);

    // Convert blob to base64
    const arrayBuffer = await audioBlob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64Audio = btoa(binary);
    console.log("[Fluency] Audio converted to base64, size:", base64Audio.length);

    // Get the max attempt number for this item
    const { data: existingRecordings } = await supabase
      .from("fluency_recordings")
      .select("attempt_number")
      .eq("session_id", sessionId)
      .eq("item_id", currentCard.id)
      .order("attempt_number", { ascending: false })
      .limit(1);

    const nextAttemptNumber = existingRecordings && existingRecordings.length > 0 
      ? existingRecordings[0].attempt_number + 1 
      : 1;

    console.log("[Fluency] Next attempt number:", nextAttemptNumber);

    // Mark previous attempts as superseded
    await supabase
      .from("fluency_recordings")
      .update({ superseded: true, used_for_scoring: false })
      .eq("session_id", sessionId)
      .eq("item_id", currentCard.id)
      .eq("used_for_scoring", true);

    // Create new recording entry
    const { data: recording, error: insertError } = await supabase
      .from("fluency_recordings")
      .insert({
        session_id: sessionId,
        user_id: user.id,
        item_id: currentCard.id,
        attempt_number: nextAttemptNumber,
        status: "processing",
        duration_seconds: duration,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[Fluency] Insert error:", insertError);
      throw new Error(`Database error: ${insertError.message}`);
    }

    console.log("[Fluency] Recording created with ID:", recording.id);

    // Set state to processing
    setItemStates((prev) => ({
      ...prev,
      [currentCard.id]: { 
        ...prev[currentCard.id], 
        recordingState: "processing",
        recordingId: recording.id,
        attemptCount: nextAttemptNumber,
      },
    }));

    // Send to analysis service
    console.log("[Fluency] Sending to analyze-fluency edge function...");
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-fluency`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          audio: base64Audio,
          itemId: currentCard.id,
          recordingDuration: duration,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Fluency] Edge function error:", response.status, errorText);
      
      let errorMessage = "Analysis failed";
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorMessage;
        
        if (errorMessage.includes("429") || errorMessage.includes("quota")) {
          errorMessage = "Speech analysis quota exceeded. Please try again later.";
        }
      } catch {
        errorMessage = `Analysis failed (${response.status})`;
      }
      
      await supabase
        .from("fluency_recordings")
        .update({ status: "error", error_message: errorMessage })
        .eq("id", recording.id);
      
      setItemStates((prev) => ({
        ...prev,
        [currentCard.id]: { 
          ...prev[currentCard.id], 
          errorMessage,
        },
      }));
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log("[Fluency] Analysis complete:", { 
      articulationWpm: result.articulationWpm, 
      wordCount: result.wordCount,
      totalScore: result.totalScore,
    });

    // Update recording with results
    await supabase
      .from("fluency_recordings")
      .update({
        status: "completed",
        transcript: result.transcript,
        word_count: result.wordCount,
        wpm: result.articulationWpm,
        pause_count: result.longPauseCount,
        total_pause_duration: result.totalPauseDuration,
        completed_at: new Date().toISOString(),
      })
      .eq("id", recording.id);

    // Update state with scores
    setItemStates((prev) => ({
      ...prev,
      [currentCard.id]: { 
        ...prev[currentCard.id], 
        score: result.totalScore,
        speedSubscore: result.speedSubscore,
        pauseSubscore: result.pauseSubscore,
      },
    }));

    logEvent("fluency_recording_completed", currentCard.id, nextAttemptNumber, {
      articulationWpm: result.articulationWpm,
      wordCount: result.wordCount,
      totalScore: result.totalScore,
    });
  }, [user, sessionId, currentCard, currentState.attemptCount, logEvent]);

  const handleNext = useCallback(() => {
    if (currentIndex < pictureCards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setAllComplete(true);
    }
  }, [currentIndex, pictureCards.length]);

  const handleRedoItem = useCallback((confirmed: boolean) => {
    if (!currentCard) return;
    
    if (!confirmed) {
      logEvent("fluency_redo_cancelled", currentCard.id);
      return;
    }
    
    logEvent("fluency_redo_confirmed", currentCard.id, currentState.attemptCount);
    
    setItemStates((prev) => ({
      ...prev,
      [currentCard.id]: {
        recordingState: "ready",
        attemptCount: prev[currentCard.id].attemptCount + 1,
      },
    }));
  }, [currentCard, currentState.attemptCount, logEvent]);

  const handleRedoModule = useCallback((confirmed: boolean) => {
    if (!confirmed) {
      logEvent("fluency_redo_cancelled");
      return;
    }
    
    logEvent("fluency_redo_confirmed", undefined, moduleAttemptCount);
    
    // Get new random prompts
    const newCards = getRandomPrompts(CARDS_PER_ASSESSMENT);
    setPictureCards(newCards);
    
    // Reset all items
    const resetStates: Record<string, ItemState> = {};
    newCards.forEach((card) => {
      resetStates[card.id] = { recordingState: "ready", attemptCount: 1 };
    });
    
    setItemStates(resetStates);
    setCurrentIndex(0);
    setAllComplete(false);
    setModuleAttemptCount((prev) => prev + 1);
  }, [moduleAttemptCount, logEvent]);

  const lockModule = useCallback(async () => {
    await supabase
      .from("assessment_sessions")
      .update({ 
        fluency_locked: true, 
        fluency_locked_at: new Date().toISOString() 
      })
      .eq("id", sessionId);
    
    logEvent("fluency_module_locked");
  }, [sessionId, logEvent]);

  return {
    pictureCards,
    currentCard,
    currentIndex,
    currentState,
    allComplete,
    moduleAttemptCount,
    isLoading,
    setRecordingState,
    handleRecordingComplete,
    handleNext,
    handleRedoItem,
    handleRedoModule,
    lockModule,
  };
}
