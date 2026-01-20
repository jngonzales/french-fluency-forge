import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminMode } from "@/hooks/useAdminMode";
import { AdminPadding } from "@/components/AdminPadding";
import IntakeForm from "@/components/assessment/IntakeForm";
import ConsentForm from "@/components/assessment/ConsentForm";
import { PronunciationModule } from "@/components/assessment/pronunciation";
import { ConfidenceModule } from "@/components/assessment/confidence";
import { ConversationModule } from "@/components/assessment/conversation";
import { ComprehensionModule } from "@/components/assessment/comprehension";
import { PersonalityQuiz } from "@/components/assessment/personality-quiz";
import { ProcessingView } from "@/components/assessment/ProcessingView";
import { LiveDataViewer } from "@/components/LiveDataViewer";
import { EnhancedLiveDataViewer } from "@/components/EnhancedLiveDataViewer";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Database } from "@/integrations/supabase/types";

type SessionStatus = Database["public"]["Enums"]["session_status"];
// 4 assessment modules:
// A. Pronunciation - pronunciation exercises
// B. Comprehension - listening comprehension
// C. Confidence - confidence questionnaire only
// D. Speech test - open-ended prompt for fluency, syntax, conversation skills
type AssessmentPhase = "pronunciation" | "comprehension" | "confidence" | "conversation";
interface AssessmentSession {
  id: string;
  status: SessionStatus;
  fluency_locked?: boolean;
  current_module?: string | null;
  current_item_index?: number | null;
  phrase_seed?: number | null;
  selected_phrase_ids?: string[] | null;
}

const Assessment = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isDev } = useAdminMode();
  
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [assessmentPhase, setAssessmentPhase] = useState<AssessmentPhase | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      loadOrCreateSession();
    }
  }, [user, authLoading]);

  const loadOrCreateSession = async () => {
    if (!user) return;

    try {
      // Check for dev override first
      const devPhase = sessionStorage.getItem("dev_assessment_phase");
      if (devPhase && ["pronunciation", "comprehension", "confidence", "conversation"].includes(devPhase)) {
        sessionStorage.removeItem("dev_assessment_phase");
        setAssessmentPhase(devPhase as AssessmentPhase);
      }

      // Query for existing session - use * to get all columns including new ones
      const { data: existingSession, error: fetchError } = await supabase
        .from("assessment_sessions")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["intake", "consent", "quiz", "mic_check", "assessment", "processing"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingSession) {
        const sessionData = existingSession as AssessmentSession;
        setSession(sessionData);
        // Restore the module from session if not overridden by dev
        if (!devPhase && sessionData.current_module) {
          setAssessmentPhase(sessionData.current_module as AssessmentPhase);
        } else if (!devPhase) {
          setAssessmentPhase("pronunciation");
        }
      } else {
        // v0 demo: Skip intake/consent/quiz/mic_check - go straight to assessment
        const { data: newSession, error: createError } = await supabase
          .from("assessment_sessions")
          .insert({ 
            user_id: user.id, 
            status: "assessment" as SessionStatus,
            // These columns may not exist yet - will be added by migration
          })
          .select("*")
          .single();

        if (createError) throw createError;
        const sessionData = newSession as AssessmentSession;
        setSession(sessionData);
        setAssessmentPhase("pronunciation");
        
        // Try to update current_module (ignore error if column doesn't exist yet)
        await supabase
          .from("assessment_sessions")
          .update({ current_module: "pronunciation", current_item_index: 0 } as any)
          .eq("id", sessionData.id);
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
      .select("*")
      .eq("id", session.id)
      .single();
    if (!error && data) setSession(data as AssessmentSession);
  };

  const handleStepComplete = () => refreshSession();

  const skipToStatus = async (newStatus: SessionStatus) => {
    if (!session) return;
    await supabase.from("assessment_sessions").update({ status: newStatus }).eq("id", session.id);
    toast.info(`Skipped to ${newStatus}`);
    refreshSession();
  };

  if (authLoading || isLoading || !assessmentPhase) {
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
          <button onClick={() => window.location.reload()} className="text-primary underline">Try again</button>
        </div>
      </div>
    );
  }

  // Order: A. Pronunciation → B. Comprehension → C. Confidence → D. Conversation
  const phaseOrder: AssessmentPhase[] = ["pronunciation", "comprehension", "confidence", "conversation"];
  
  const advancePhase = async () => {
    const currentIdx = phaseOrder.indexOf(assessmentPhase);
    if (currentIdx < phaseOrder.length - 1) {
      const nextPhase = phaseOrder[currentIdx + 1];
      setAssessmentPhase(nextPhase);
      // Save progress to database (ignore error if column doesn't exist)
      await supabase
        .from("assessment_sessions")
        .update({ current_module: nextPhase, current_item_index: 0 } as any)
        .eq("id", session.id);
    } else {
      await skipToStatus("processing");
    }
  };

  switch (session.status) {
    case "intake":
      return <IntakeForm sessionId={session.id} onComplete={handleStepComplete} onSkip={() => skipToStatus("consent")} />;

    case "consent":
      return <ConsentForm sessionId={session.id} onComplete={handleStepComplete} onSkip={() => skipToStatus("quiz")} />;

    case "quiz":
      return (
        <PersonalityQuiz
          sessionId={session.id}
          onComplete={async () => {
            await supabase.from("assessment_sessions").update({ status: "mic_check" }).eq("id", session.id);
            refreshSession();
          }}
          onSkip={() => skipToStatus("mic_check")}
        />
      );

    case "mic_check":
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold mb-4">Microphone Check</h1>
            <p className="text-muted-foreground mb-6">Coming soon</p>
            <Button onClick={async () => {
              await supabase.from("assessment_sessions").update({ status: "assessment" }).eq("id", session.id);
              refreshSession();
            }}>Skip to Assessment</Button>
          </div>
        </div>
      );

    case "assessment": {
      const moduleProps = { sessionId: session.id, onComplete: advancePhase };
      
      const renderModule = () => {
        switch (assessmentPhase) {
          case "pronunciation":
            return (
              <PronunciationModule 
                {...moduleProps} 
                onSkip={advancePhase}
                initialItemIndex={session.current_item_index ?? 0}
                phraseSeed={session.phrase_seed ?? undefined}
                selectedPhraseIds={session.selected_phrase_ids ?? undefined}
              />
            );
          case "comprehension":
            return <ComprehensionModule {...moduleProps} onSkip={advancePhase} />;
          case "confidence":
            return <ConfidenceModule {...moduleProps} onSkip={advancePhase} />;
          case "conversation":
            // Conversation-agent evaluates: fluency, confidence, conversation, and syntax
            return <ConversationModule {...moduleProps} onSkip={advancePhase} />;
        }
      };

      return (
        <AdminPadding>
          {renderModule()}

          {(isAdmin || isDev) && <EnhancedLiveDataViewer sessionId={session.id} moduleType={assessmentPhase} />}
        </AdminPadding>
      );
    }

    case "processing":
      return (
        <ProcessingView
          sessionId={session.id}
          onComplete={async () => {
            await supabase.from("assessment_sessions").update({ 
              status: "completed",
              completed_at: new Date().toISOString()
            }).eq("id", session.id);
            navigate("/results?session=" + session.id);
          }}
          onStartFresh={async () => {
            const { data } = await supabase.from("assessment_sessions").insert({ user_id: user!.id, status: "intake" as SessionStatus }).select("id, status").single();
            if (data) { setSession(data as AssessmentSession); setAssessmentPhase("pronunciation"); }
          }}
        />
      );

    case "completed":
      navigate("/results?session=" + session.id);
      return null;

    default:
      return <div className="flex min-h-screen items-center justify-center"><p>Unknown state</p></div>;
  }
};

export default Assessment;
