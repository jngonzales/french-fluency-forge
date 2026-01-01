import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminMode } from "@/hooks/useAdminMode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, RefreshCw, Database, Mic, MessageSquare, User, Brain, BookOpen, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SessionData {
  id: string;
  status: string;
  archetype: string | null;
  created_at: string;
  fluency_locked: boolean;
}

interface FluencyRecording {
  id: string;
  item_id: string;
  attempt_number: number;
  status: string;
  transcript: string | null;
  wpm: number | null;
  word_count: number | null;
  used_for_scoring: boolean;
  created_at: string;
}

interface FluencyEvent {
  id: string;
  event_type: string;
  item_id: string | null;
  attempt_number: number | null;
  created_at: string;
  metadata: unknown;
}

interface SkillRecording {
  id: string;
  module_type: string;
  prompt_id: string;
  transcript: string | null;
  ai_score: number | null;
  ai_feedback: unknown;
  used_for_scoring: boolean;
  created_at: string;
}

interface ComprehensionRecording {
  id: string;
  item_id: string;
  transcript: string | null;
  ai_score: number | null;
  ai_feedback: unknown;
  used_for_scoring: boolean;
  created_at: string;
}

export function DevSessionViewer() {
  const { user } = useAuth();
  const { isAdmin, isDev } = useAdminMode();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [recordings, setRecordings] = useState<FluencyRecording[]>([]);
  const [skillRecordings, setSkillRecordings] = useState<SkillRecording[]>([]);
  const [comprehensionRecordings, setComprehensionRecordings] = useState<ComprehensionRecording[]>([]);
  const [events, setEvents] = useState<FluencyEvent[]>([]);

  // Show in development OR for admin users
  if (!isDev && !isAdmin) return null;

  const loadSessions = async () => {
    if (!user) return;
    setLoading(true);
    
    const { data } = await supabase
      .from("assessment_sessions")
      .select("id, status, archetype, created_at, fluency_locked")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    setSessions(data || []);
    if (data && data.length > 0 && !selectedSession) {
      setSelectedSession(data[0].id);
    }
    setLoading(false);
  };

  const loadSessionDetails = async (sessionId: string) => {
    setLoading(true);
    
    // Load fluency recordings
    const { data: recordingsData } = await supabase
      .from("fluency_recordings")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false });

    setRecordings(recordingsData || []);

    // Load skill recordings (confidence, syntax, conversation)
    const { data: skillData } = await supabase
      .from("skill_recordings")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false });

    setSkillRecordings(skillData || []);

    // Load comprehension recordings
    const { data: comprehensionData } = await supabase
      .from("comprehension_recordings")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false });

    setComprehensionRecordings(comprehensionData || []);

    // Load events
    const { data: eventsData } = await supabase
      .from("fluency_events")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(50);

    setEvents(eventsData || []);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen && user) {
      loadSessions();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (selectedSession) {
      loadSessionDetails(selectedSession);
    }
  }, [selectedSession]);

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", { 
      hour: "2-digit", 
      minute: "2-digit",
      second: "2-digit"
    });
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 left-4 z-[9999] h-12 w-12 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
        title="Session Debugger"
      >
        <Database className="h-5 w-5" />
      </button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            className="fixed left-4 bottom-20 z-[9998] w-[400px] max-h-[70vh] bg-popover border border-border rounded-lg shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">Session Debugger</span>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => {
                    loadSessions();
                    if (selectedSession) loadSessionDetails(selectedSession);
                  }}
                >
                  <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Session Selector */}
            <div className="p-2 border-b bg-muted/10">
              <select
                value={selectedSession || ""}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="w-full px-2 py-1.5 text-xs rounded border bg-background"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id.slice(0, 8)}... | {s.status} | {formatTime(s.created_at)}
                  </option>
                ))}
              </select>
            </div>

            {/* Content */}
            <Tabs defaultValue="fluency" className="h-full">
              <TabsList className="w-full justify-start rounded-none border-b h-9 flex-wrap">
                <TabsTrigger value="fluency" className="text-xs h-7">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Fluency ({recordings.length})
                </TabsTrigger>
                <TabsTrigger value="skills" className="text-xs h-7">
                  <Brain className="h-3 w-3 mr-1" />
                  Skills ({skillRecordings.length})
                </TabsTrigger>
                <TabsTrigger value="comprehension" className="text-xs h-7">
                  <Volume2 className="h-3 w-3 mr-1" />
                  Listening ({comprehensionRecordings.length})
                </TabsTrigger>
                <TabsTrigger value="events" className="text-xs h-7">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Events ({events.length})
                </TabsTrigger>
                <TabsTrigger value="session" className="text-xs h-7">
                  <User className="h-3 w-3 mr-1" />
                  Session
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[350px]">
                <TabsContent value="fluency" className="p-2 space-y-2 m-0">
                  {recordings.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No recordings yet</p>
                  ) : (
                    recordings.map((rec) => (
                      <Card key={rec.id} className="border-border/50">
                        <CardContent className="p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] h-5">
                                {rec.item_id}
                              </Badge>
                              <Badge 
                                variant={rec.status === "completed" ? "default" : "secondary"}
                                className="text-[10px] h-5"
                              >
                                {rec.status}
                              </Badge>
                              {rec.used_for_scoring && (
                                <Badge variant="secondary" className="text-[10px] h-5 bg-green-500/20 text-green-700">
                                  scoring
                                </Badge>
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              Attempt #{rec.attempt_number}
                            </span>
                          </div>
                          
                          {rec.wpm && (
                            <div className="flex gap-3 text-xs text-muted-foreground">
                              <span>WPM: <strong className="text-foreground">{rec.wpm}</strong></span>
                              <span>Words: <strong className="text-foreground">{rec.word_count}</strong></span>
                            </div>
                          )}
                          
                          {rec.transcript && (
                            <p className="text-[10px] text-muted-foreground bg-muted/30 p-2 rounded line-clamp-2">
                              {rec.transcript}
                            </p>
                          )}
                          
                          <p className="text-[10px] text-muted-foreground/60">
                            {formatTime(rec.created_at)}
                          </p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="skills" className="p-2 space-y-2 m-0">
                  {skillRecordings.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No skill recordings yet</p>
                  ) : (
                    skillRecordings.map((rec) => (
                      <Card key={rec.id} className="border-border/50">
                        <CardContent className="p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] h-5 capitalize">
                                {rec.module_type}
                              </Badge>
                              <Badge variant="outline" className="text-[10px] h-5">
                                {rec.prompt_id}
                              </Badge>
                              {rec.used_for_scoring && (
                                <Badge variant="secondary" className="text-[10px] h-5 bg-green-500/20 text-green-700">
                                  scoring
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {rec.ai_score !== null && (
                            <div className="flex gap-3 text-xs">
                              <span className="text-muted-foreground">
                                Score: <strong className="text-foreground">{rec.ai_score}/100</strong>
                              </span>
                            </div>
                          )}
                          
                          {rec.transcript && (
                            <div className="space-y-1">
                              <p className="text-[10px] font-medium text-muted-foreground">Transcript:</p>
                              <p className="text-[10px] text-foreground bg-muted/30 p-2 rounded max-h-20 overflow-y-auto">
                                {rec.transcript}
                              </p>
                            </div>
                          )}
                          
                          {rec.ai_feedback && (
                            <details className="text-[10px]">
                              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                AI Feedback
                              </summary>
                              <pre className="mt-1 bg-muted/50 p-2 rounded overflow-x-auto text-[9px]">
                                {JSON.stringify(rec.ai_feedback, null, 2)}
                              </pre>
                            </details>
                          )}
                          
                          <p className="text-[10px] text-muted-foreground/60">
                            {formatTime(rec.created_at)}
                          </p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="comprehension" className="p-2 space-y-2 m-0">
                  {comprehensionRecordings.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No comprehension recordings yet</p>
                  ) : (
                    comprehensionRecordings.map((rec) => (
                      <Card key={rec.id} className="border-border/50">
                        <CardContent className="p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-[10px] h-5">
                              {rec.item_id}
                            </Badge>
                            {rec.used_for_scoring && (
                              <Badge variant="secondary" className="text-[10px] h-5 bg-green-500/20 text-green-700">
                                scoring
                              </Badge>
                            )}
                          </div>
                          
                          {rec.ai_score !== null && (
                            <div className="flex gap-3 text-xs">
                              <span className="text-muted-foreground">
                                Score: <strong className="text-foreground">{rec.ai_score}/100</strong>
                              </span>
                            </div>
                          )}
                          
                          {rec.transcript && (
                            <div className="space-y-1">
                              <p className="text-[10px] font-medium text-muted-foreground">Transcript:</p>
                              <p className="text-[10px] text-foreground bg-muted/30 p-2 rounded max-h-20 overflow-y-auto">
                                {rec.transcript}
                              </p>
                            </div>
                          )}
                          
                          {rec.ai_feedback && (
                            <details className="text-[10px]">
                              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                AI Feedback
                              </summary>
                              <pre className="mt-1 bg-muted/50 p-2 rounded overflow-x-auto text-[9px]">
                                {JSON.stringify(rec.ai_feedback, null, 2)}
                              </pre>
                            </details>
                          )}
                          
                          <p className="text-[10px] text-muted-foreground/60">
                            {formatTime(rec.created_at)}
                          </p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="events" className="p-2 space-y-1 m-0">
                  {events.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No events yet</p>
                  ) : (
                    events.map((evt) => (
                      <div 
                        key={evt.id} 
                        className="flex items-center justify-between p-2 bg-muted/20 rounded text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-primary">{evt.event_type}</span>
                          {evt.item_id && (
                            <Badge variant="outline" className="text-[10px] h-4">
                              {evt.item_id}
                            </Badge>
                          )}
                          {evt.attempt_number && (
                            <span className="text-muted-foreground">#{evt.attempt_number}</span>
                          )}
                        </div>
                        <span className="text-muted-foreground/60">{formatTime(evt.created_at)}</span>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="session" className="p-3 m-0">
                  {selectedSession && sessions.find(s => s.id === selectedSession) && (
                    <div className="space-y-3">
                      {Object.entries(sessions.find(s => s.id === selectedSession)!).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-xs">
                          <span className="font-mono text-muted-foreground">{key}:</span>
                          <span className="font-mono text-foreground max-w-[200px] truncate">
                            {String(value ?? "null")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
