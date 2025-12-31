import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import IntakeForm from "@/components/assessment/IntakeForm";
import ConsentForm from "@/components/assessment/ConsentForm";
import PronunciationModule from "@/components/assessment/PronunciationModule";
import { FluencyModule } from "@/components/assessment/fluency";
import { PersonalityQuiz } from "@/components/assessment/personality-quiz";
import { ProcessingView } from "@/components/assessment/ProcessingView";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Database } from "@/integrations/supabase/types";

type SessionStatus = Database["public"]["Enums"]["session_status"];

interface AssessmentSession {
  id: string;
  status: SessionStatus;
  fluency_locked?: boolean;
}

const Assessment = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [assessmentPhase, setAssessmentPhase] = useState<"pronunciation" | "fluency">("pronunciation");
  const [fluencyLockedNotice, setFluencyLockedNotice] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      loadOrCreateSession();
    }
  }, [user, authLoading]);

  const loadOrCreateSession = async () => {
    if (!user) return;

    try {
      // Check for existing in-progress session
      const { data: existingSession, error: fetchError } = await supabase
        .from("assessment_sessions")
        .select("id, status, fluency_locked")
        .eq("user_id", user.id)
        .in("status", ["intake", "consent", "quiz", "mic_check", "assessment", "processing"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingSession) {
        setSession(existingSession);
        // Check if user is trying to access fluency but it's locked
        if (existingSession.fluency_locked && existingSession.status === "assessment") {
          // Skip fluency and move to processing if locked
          setFluencyLockedNotice(true);
        }
      } else {
        // Create new session starting at intake
        const { data: newSession, error: createError } = await supabase
          .from("assessment_sessions")
          .insert({
            user_id: user.id,
            status: "intake" as SessionStatus,
          })
          .select("id, status")
          .single();

        if (createError) throw createError;
        setSession(newSession);
      }
    } catch (error) {
      console.error("Error loading session:", error);
      toast.error("Failed to load assessment session");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSession = async () => {
    if (!session) return;

    const { data, error } = await supabase
      .from("assessment_sessions")
      .select("id, status, fluency_locked")
      .eq("id", session.id)
      .single();

    if (error) {
      console.error("Error refreshing session:", error);
      return;
    }

    setSession(data);
  };

  const handleStepComplete = () => {
    refreshSession();
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Preparing your assessment...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-destructive mb-4">Unable to start assessment</p>
          <button 
            onClick={() => window.location.reload()}
            className="text-primary underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const skipToStatus = async (newStatus: SessionStatus) => {
    if (!session) return;
    await supabase
      .from("assessment_sessions")
      .update({ status: newStatus })
      .eq("id", session.id);
    toast.info(`Skipped to ${newStatus}`);
    refreshSession();
  };

  // Render current step based on session status
  switch (session.status) {
    case "intake":
      return (
        <IntakeForm 
          sessionId={session.id} 
          onComplete={handleStepComplete}
          onSkip={() => skipToStatus("consent")}
        />
      );

    case "consent":
      return (
        <ConsentForm 
          sessionId={session.id} 
          onComplete={handleStepComplete}
          onSkip={() => skipToStatus("quiz")}
        />
      );

    case "quiz":
      const handleQuizComplete = async (archetype: string) => {
        console.log("Archetype result:", archetype);
        await supabase
          .from("assessment_sessions")
          .update({ status: "mic_check" })
          .eq("id", session.id);
        toast.success("Quiz complete!");
        refreshSession();
      };
      return (
        <PersonalityQuiz
          sessionId={session.id}
          onComplete={handleQuizComplete}
          onSkip={() => skipToStatus("mic_check")}
        />
      );

    case "mic_check":
      // Skip mic check for now, go to assessment
      const skipToAssessment = async () => {
        await supabase
          .from("assessment_sessions")
          .update({ status: "assessment" })
          .eq("id", session.id);
        refreshSession();
      };
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold mb-4">Microphone Check</h1>
            <p className="text-muted-foreground mb-6">
              Coming soon - let&apos;s make sure your microphone is working properly.
            </p>
            <Button onClick={skipToAssessment}>
              Skip to Assessment (Dev)
            </Button>
          </div>
        </div>
      );

    case "assessment":
      const handlePronunciationComplete = async (results: any[]) => {
        console.log("Pronunciation results:", results);
        toast.success("Pronunciation module complete!");
        // Move to fluency phase
        setAssessmentPhase("fluency");
      };

      const handleFluencyComplete = async () => {
        console.log("Fluency complete!");
        // Move to processing
        await supabase
          .from("assessment_sessions")
          .update({ status: "processing" })
          .eq("id", session.id);
        
        toast.success("Assessment complete!");
        refreshSession();
      };

      const skipToNextPhase = () => {
        if (assessmentPhase === "pronunciation") {
          setAssessmentPhase("fluency");
          toast.info("Skipped to fluency module");
        } else {
          skipToStatus("processing");
        }
      };
      
      if (assessmentPhase === "pronunciation") {
        return (
          <PronunciationModule
            sessionId={session.id}
            onComplete={handlePronunciationComplete}
            onSkip={skipToNextPhase}
          />
        );
      } else {
        return (
          <FluencyModule
            sessionId={session.id}
            onComplete={handleFluencyComplete}
            onSkip={skipToNextPhase}
          />
        );
      }

    case "processing":
      const handleViewResults = async () => {
        await supabase
          .from("assessment_sessions")
          .update({ status: "completed" })
          .eq("id", session.id);
        navigate("/results");
      };

      const handleStartFresh = async () => {
        // Create a new session
        const { data: newSession, error } = await supabase
          .from("assessment_sessions")
          .insert({
            user_id: user!.id,
            status: "intake" as SessionStatus,
          })
          .select("id, status")
          .single();

        if (!error && newSession) {
          setSession(newSession);
          setAssessmentPhase("pronunciation");
        }
      };

      return (
        <ProcessingView
          sessionId={session.id}
          onComplete={handleViewResults}
          onStartFresh={handleStartFresh}
        />
      );

    case "completed":
      navigate("/results");
      return null;

    case "abandoned":
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold mb-4">Session Expired</h1>
            <p className="text-muted-foreground mb-6">
              This assessment session has been abandoned. Please start a new one.
            </p>
          </div>
        </div>
      );

    default:
      return (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <p className="text-muted-foreground">Unknown session state</p>
        </div>
      );
  }
};

export default Assessment;
