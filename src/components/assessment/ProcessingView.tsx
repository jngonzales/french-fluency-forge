import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ProcessingStep {
  id: string;
  label: string;
  status: "pending" | "processing" | "complete" | "error";
  detail?: string;
}

interface ProcessingViewProps {
  sessionId: string;
  onComplete: () => void;
  onStartFresh: () => void;
}

export function ProcessingView({ sessionId, onComplete, onStartFresh }: ProcessingViewProps) {
  const [steps, setSteps] = useState<ProcessingStep[]>([
    { id: "pronunciation", label: "Analyzing pronunciation", status: "pending" },
    { id: "fluency", label: "Processing fluency metrics", status: "pending" },
    { id: "personality", label: "Mapping archetype profile", status: "pending" },
    { id: "report", label: "Generating personalized report", status: "pending" },
  ]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [sessionData, setSessionData] = useState<{
    pronunciationCount: number;
    fluencyCount: number;
    archetype: string | null;
  } | null>(null);

  useEffect(() => {
    loadSessionData();
  }, [sessionId]);

  const loadSessionData = async () => {
    // Load pronunciation data
    const { count: pronCount } = await supabase
      .from("fluency_recordings")
      .select("*", { count: "exact", head: true })
      .eq("session_id", sessionId)
      .neq("status", "error");

    // Load fluency recordings
    const { data: fluencyData } = await supabase
      .from("fluency_recordings")
      .select("*")
      .eq("session_id", sessionId)
      .eq("status", "completed")
      .eq("used_for_scoring", true);

    // Load session archetype
    const { data: session } = await supabase
      .from("assessment_sessions")
      .select("archetype")
      .eq("id", sessionId)
      .single();

    setSessionData({
      pronunciationCount: pronCount || 0,
      fluencyCount: fluencyData?.length || 0,
      archetype: session?.archetype || null,
    });

    // Start processing simulation after data loads
    simulateProcessing(pronCount || 0, fluencyData?.length || 0, session?.archetype);
  };

  const simulateProcessing = async (pronCount: number, fluencyCount: number, archetype: string | null) => {
    // Step 1: Pronunciation
    updateStep("pronunciation", "processing", `Found ${pronCount} recordings...`);
    await delay(800);
    updateStep("pronunciation", "complete", `${pronCount} recordings analyzed`);
    setOverallProgress(25);

    // Step 2: Fluency
    updateStep("fluency", "processing", `Processing ${fluencyCount} fluency samples...`);
    await delay(1000);
    updateStep("fluency", "complete", `${fluencyCount} samples processed`);
    setOverallProgress(50);

    // Step 3: Personality
    updateStep("personality", "processing", "Matching to archetype patterns...");
    await delay(800);
    updateStep("personality", "complete", archetype ? `Matched: ${archetype}` : "Profile mapped");
    setOverallProgress(75);

    // Step 4: Report
    updateStep("report", "processing", "Building your personalized report...");
    await delay(1200);
    updateStep("report", "complete", "Report ready!");
    setOverallProgress(100);
  };

  const updateStep = (id: string, status: ProcessingStep["status"], detail?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === id ? { ...step, status, detail } : step
    ));
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const allComplete = steps.every(s => s.status === "complete");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {allComplete ? "Analysis Complete!" : "Analyzing Your Results"}
          </h1>
          <p className="text-muted-foreground">
            {allComplete 
              ? "Your personalized diagnostic is ready." 
              : "Processing your responses to generate insights..."}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={overallProgress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">{overallProgress}% complete</p>
        </div>

        {/* Steps List */}
        <div className="space-y-3">
          {steps.map((step) => (
            <div 
              key={step.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                step.status === "processing" ? "bg-primary/5 border border-primary/20" :
                step.status === "complete" ? "bg-muted/30" : "opacity-50"
              }`}
            >
              {/* Status Icon */}
              <div className="flex-shrink-0">
                {step.status === "pending" && (
                  <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                )}
                {step.status === "processing" && (
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                )}
                {step.status === "complete" && (
                  <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
                {step.status === "error" && (
                  <div className="h-5 w-5 rounded-full bg-destructive flex items-center justify-center">
                    <span className="text-xs text-destructive-foreground">!</span>
                  </div>
                )}
              </div>

              {/* Step Info */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${
                  step.status === "complete" ? "text-foreground" : 
                  step.status === "processing" ? "text-primary" : "text-muted-foreground"
                }`}>
                  {step.label}
                </p>
                {step.detail && (
                  <p className="text-xs text-muted-foreground truncate">{step.detail}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        {allComplete && (
          <div className="space-y-3 pt-4">
            <Button onClick={onComplete} className="w-full">
              View Your Results
            </Button>
            <Button variant="outline" onClick={onStartFresh} className="w-full">
              Start Fresh Assessment
            </Button>
          </div>
        )}

        {/* Debug info */}
        {sessionData && !import.meta.env.PROD && (
          <div className="text-xs text-muted-foreground border-t pt-4 mt-4">
            <p className="font-mono">Session: {sessionId.slice(0, 8)}...</p>
            <p className="font-mono">Recordings: {sessionData.pronunciationCount} | Fluency: {sessionData.fluencyCount}</p>
            {sessionData.archetype && <p className="font-mono">Archetype: {sessionData.archetype}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
