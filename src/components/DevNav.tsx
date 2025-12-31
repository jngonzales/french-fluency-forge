import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bug, X, ChevronRight, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type SessionStatus = Database["public"]["Enums"]["session_status"];

const mainRoutes = [
  { path: "/", label: "Home" },
  { path: "/login", label: "Login" },
  { path: "/signup", label: "Signup" },
  { path: "/results", label: "Results" },
  { path: "/dev", label: "Dev Preview" },
];

const assessmentPhases: { status: SessionStatus; label: string }[] = [
  { status: "intake", label: "Intake Form" },
  { status: "consent", label: "Consent Form" },
  { status: "quiz", label: "Personality Quiz" },
  { status: "mic_check", label: "Mic Check" },
  { status: "assessment", label: "Assessment" },
  { status: "processing", label: "Processing" },
];

export function DevNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [assessmentExpanded, setAssessmentExpanded] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  // Only show in development
  if (import.meta.env.PROD) return null;

  const jumpToPhase = async (status: SessionStatus) => {
    if (!user) {
      toast.error("Login first to access assessment phases");
      return;
    }

    try {
      // Find or create a session and set its status
      const { data: existingSession } = await supabase
        .from("assessment_sessions")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingSession) {
        await supabase
          .from("assessment_sessions")
          .update({ status })
          .eq("id", existingSession.id);
      } else {
        await supabase
          .from("assessment_sessions")
          .insert({ user_id: user.id, status });
      }

      toast.success(`Jumping to ${status}`);
      
      // Navigate to assessment and force refresh
      if (location.pathname === "/assessment") {
        window.location.reload();
      } else {
        window.location.href = "/assessment";
      }
    } catch (error) {
      console.error("Error jumping to phase:", error);
      toast.error("Failed to jump to phase");
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-14 right-0 bg-popover border border-border rounded-lg shadow-xl p-2 min-w-[200px] max-h-[70vh] overflow-y-auto"
          >
            {/* Main Routes */}
            {mainRoutes.map((route) => (
              <Link
                key={route.path}
                to={route.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  location.pathname === route.path
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <ChevronRight className="h-3 w-3" />
                {route.label}
              </Link>
            ))}

            {/* Assessment Accordion */}
            <div className="border-t border-border mt-2 pt-2">
              <button
                onClick={() => setAssessmentExpanded(!assessmentExpanded)}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-sm transition-colors ${
                  location.pathname === "/assessment"
                    ? "bg-primary/20 text-primary"
                    : "hover:bg-muted"
                }`}
              >
                <span className="flex items-center gap-2">
                  <ChevronRight className="h-3 w-3" />
                  Assessment
                </span>
                <ChevronDown 
                  className={`h-3 w-3 transition-transform ${assessmentExpanded ? "rotate-180" : ""}`} 
                />
              </button>

              <AnimatePresence>
                {assessmentExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pl-4 space-y-1 mt-1">
                      {assessmentPhases.map((phase) => (
                        <button
                          key={phase.status}
                          onClick={() => {
                            jumpToPhase(phase.status);
                            setIsOpen(false);
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs w-full text-left hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {phase.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-12 w-12 rounded-full bg-amber-500 text-white shadow-lg hover:bg-amber-600 transition-colors flex items-center justify-center"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Bug className="h-5 w-5" />}
      </button>
    </div>
  );
}
