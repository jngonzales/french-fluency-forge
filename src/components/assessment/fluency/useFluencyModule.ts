import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { RecordingState } from "./FluencyRecordingCard";
import type { Json } from "@/integrations/supabase/types";

const FLUENCY_PROMPTS = [
  {
    id: "fluency-1",
    prompt: "Describe your typical morning routine",
    promptFr: "Décrivez votre routine matinale typique",
    duration: 30,
    tips: [
      "What time do you wake up?",
      "What do you eat for breakfast?",
      "How do you get ready for the day?",
    ],
  },
  {
    id: "fluency-2",
    prompt: "Tell me about your favorite place to visit",
    promptFr: "Parlez-moi de votre endroit préféré à visiter",
    duration: 30,
    tips: [
      "Where is this place?",
      "Why do you like it?",
      "What can you do there?",
    ],
  },
];

interface ItemState {
  recordingState: RecordingState;
  attemptCount: number;
  recordingId?: string;
  errorMessage?: string;
}

export function useFluencyModule(sessionId: string) {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemStates, setItemStates] = useState<Record<string, ItemState>>(() => {
    const initial: Record<string, ItemState> = {};
    FLUENCY_PROMPTS.forEach((p) => {
      initial[p.id] = { recordingState: "ready", attemptCount: 1 };
    });
    return initial;
  });
  const [moduleAttemptCount, setModuleAttemptCount] = useState(1);
  const [allComplete, setAllComplete] = useState(false);

  const currentPrompt = FLUENCY_PROMPTS[currentIndex];
  const currentState = itemStates[currentPrompt.id];

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
    setItemStates((prev) => ({
      ...prev,
      [currentPrompt.id]: { ...prev[currentPrompt.id], recordingState: state },
    }));
    
    if (state === "recording") {
      logEvent("fluency_recording_started", currentPrompt.id, currentState.attemptCount);
    }
  }, [currentPrompt.id, currentState.attemptCount, logEvent]);

  const handleRecordingComplete = useCallback(async (audioBlob: Blob, duration: number): Promise<void> => {
    if (!user) throw new Error("Not authenticated");

    // Convert blob to base64
    const arrayBuffer = await audioBlob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64Audio = btoa(binary);

    // Mark previous attempts as superseded
    await supabase
      .from("fluency_recordings")
      .update({ superseded: true, used_for_scoring: false })
      .eq("session_id", sessionId)
      .eq("item_id", currentPrompt.id)
      .eq("used_for_scoring", true);

    // Create new recording entry
    const { data: recording, error: insertError } = await supabase
      .from("fluency_recordings")
      .insert({
        session_id: sessionId,
        user_id: user.id,
        item_id: currentPrompt.id,
        attempt_number: currentState.attemptCount,
        status: "processing",
        duration_seconds: duration,
      })
      .select("id")
      .single();

    if (insertError) throw insertError;

    // Set state to processing
    setItemStates((prev) => ({
      ...prev,
      [currentPrompt.id]: { 
        ...prev[currentPrompt.id], 
        recordingState: "processing",
        recordingId: recording.id,
      },
    }));

    // Send to analysis service
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
          itemId: currentPrompt.id,
          recordingDuration: duration,
        }),
      }
    );

    if (!response.ok) {
      await supabase
        .from("fluency_recordings")
        .update({ status: "error", error_message: "Analysis failed" })
        .eq("id", recording.id);
      throw new Error("Failed to analyze recording");
    }

    const result = await response.json();

    // Update recording with results (transcript never shown to user)
    await supabase
      .from("fluency_recordings")
      .update({
        status: "completed",
        transcript: result.transcript,
        word_count: result.wordCount,
        wpm: result.wpm,
        pause_count: result.pauseCount,
        total_pause_duration: result.totalPauseDuration,
        completed_at: new Date().toISOString(),
      })
      .eq("id", recording.id);

    logEvent("fluency_recording_completed", currentPrompt.id, currentState.attemptCount, {
      wpm: result.wpm,
      wordCount: result.wordCount,
    });
  }, [user, sessionId, currentPrompt.id, currentState.attemptCount, logEvent]);

  const handleNext = useCallback(() => {
    if (currentIndex < FLUENCY_PROMPTS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setAllComplete(true);
    }
  }, [currentIndex]);

  const handleRedoItem = useCallback((confirmed: boolean) => {
    if (!confirmed) {
      logEvent("fluency_redo_cancelled", currentPrompt.id);
      return;
    }
    
    logEvent("fluency_redo_confirmed", currentPrompt.id, currentState.attemptCount);
    
    setItemStates((prev) => ({
      ...prev,
      [currentPrompt.id]: {
        recordingState: "ready",
        attemptCount: prev[currentPrompt.id].attemptCount + 1,
      },
    }));
  }, [currentPrompt.id, currentState.attemptCount, logEvent]);

  const handleRedoModule = useCallback((confirmed: boolean) => {
    if (!confirmed) {
      logEvent("fluency_redo_cancelled");
      return;
    }
    
    logEvent("fluency_redo_confirmed", undefined, moduleAttemptCount);
    
    // Reset all items
    const resetStates: Record<string, ItemState> = {};
    FLUENCY_PROMPTS.forEach((p) => {
      resetStates[p.id] = { recordingState: "ready", attemptCount: 1 };
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
    prompts: FLUENCY_PROMPTS,
    currentPrompt,
    currentIndex,
    currentState,
    allComplete,
    moduleAttemptCount,
    setRecordingState,
    handleRecordingComplete,
    handleNext,
    handleRedoItem,
    handleRedoModule,
    lockModule,
  };
}
