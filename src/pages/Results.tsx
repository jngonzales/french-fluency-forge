import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Download, Share2, AlertCircle, Target, ChevronRight } from "lucide-react";

interface SkillScore {
  skill: string;
  score: number;
  fullMark: 10;
  available: boolean;
}

interface SessionData {
  fluencyWpm: number | null;
  pronunciationScore: number | null;
  archetype: string | null;
}

// Convert WPM to 1-10 scale (target: 80-150 WPM for French)
const wpmToScore = (wpm: number | null): number => {
  if (wpm === null) return 0;
  // Scale: 0 WPM = 1, 120+ WPM = 10
  const score = Math.min(10, Math.max(1, Math.round((wpm / 120) * 10)));
  return score;
};

// Convert pronunciation similarity (0-100) to 1-10 scale
const pronunciationToScore = (similarity: number | null): number => {
  if (similarity === null) return 0;
  return Math.min(10, Math.max(1, Math.round(similarity / 10)));
};

const Results = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session");
  
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<SessionData>({
    fluencyWpm: null,
    pronunciationScore: null,
    archetype: null
  });

  useEffect(() => {
    const fetchResults = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch session info
        const { data: session } = await supabase
          .from("assessment_sessions")
          .select("archetype")
          .eq("id", sessionId)
          .maybeSingle();

        // Fetch fluency recordings for WPM average
        const { data: fluencyRecordings } = await supabase
          .from("fluency_recordings")
          .select("wpm")
          .eq("session_id", sessionId)
          .eq("used_for_scoring", true)
          .not("wpm", "is", null);

        // Calculate average WPM
        let avgWpm: number | null = null;
        if (fluencyRecordings && fluencyRecordings.length > 0) {
          const totalWpm = fluencyRecordings.reduce((sum, r) => sum + (r.wpm || 0), 0);
          avgWpm = Math.round(totalWpm / fluencyRecordings.length);
        }

        // TODO: Fetch pronunciation scores when available
        // For now, we'll use a placeholder or null
        const pronunciationScore: number | null = null;

        setSessionData({
          fluencyWpm: avgWpm,
          pronunciationScore,
          archetype: session?.archetype || null
        });
      } catch (error) {
        console.error("Error fetching results:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [sessionId]);

  // Build radar chart data - 6 skills
  const skillData: SkillScore[] = [
    { 
      skill: "Pronunciation", 
      score: pronunciationToScore(sessionData.pronunciationScore), 
      fullMark: 10,
      available: sessionData.pronunciationScore !== null
    },
    { 
      skill: "Fluency", 
      score: wpmToScore(sessionData.fluencyWpm), 
      fullMark: 10,
      available: sessionData.fluencyWpm !== null
    },
    { 
      skill: "Confidence", 
      score: 0, 
      fullMark: 10,
      available: false
    },
    { 
      skill: "Comprehension", 
      score: 0, 
      fullMark: 10,
      available: false
    },
    { 
      skill: "Syntax", 
      score: 0, 
      fullMark: 10,
      available: false
    },
    { 
      skill: "Conversation", 
      score: 0, 
      fullMark: 10,
      available: false
    }
  ];

  const availableSkills = skillData.filter(s => s.available);
  const unavailableSkills = skillData.filter(s => !s.available);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="container mx-auto max-w-4xl space-y-8">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-2xl font-bold text-foreground">Your French Diagnostic</h1>
              <p className="text-muted-foreground">
                {sessionId ? "Results from your assessment" : "No session selected"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" disabled>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-8 lg:col-span-2">
            {/* Spider/Radar Chart */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="font-serif text-xl">Skills Overview</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Your performance across 6 key language skills (1-10 scale)
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={skillData} cx="50%" cy="50%" outerRadius="80%">
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis 
                        dataKey="skill" 
                        tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                      />
                      <PolarRadiusAxis 
                        angle={30} 
                        domain={[0, 10]} 
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                        tickCount={6}
                      />
                      <Radar
                        name="Score"
                        dataKey="score"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                        formatter={(value: number, name: string, props: any) => {
                          const item = props.payload;
                          if (!item.available) return ["Not yet assessed", name];
                          return [value + "/10", name];
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Score Details */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="font-serif text-xl">Score Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Available Skills */}
                {availableSkills.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-foreground">Assessed Skills</h3>
                    {availableSkills.map((skill) => (
                      <div key={skill.skill} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div>
                          <span className="font-medium text-foreground">{skill.skill}</span>
                          {skill.skill === "Fluency" && sessionData.fluencyWpm && (
                            <p className="text-xs text-muted-foreground">
                              Average: {sessionData.fluencyWpm} WPM
                            </p>
                          )}
                          {skill.skill === "Pronunciation" && sessionData.pronunciationScore && (
                            <p className="text-xs text-muted-foreground">
                              Similarity: {sessionData.pronunciationScore}%
                            </p>
                          )}
                        </div>
                        <Badge variant="default" className="text-lg font-bold">
                          {skill.score}/10
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                {/* Unavailable Skills */}
                {unavailableSkills.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">Coming Soon</h3>
                    {unavailableSkills.map((skill) => (
                      <div key={skill.skill} className="flex items-center justify-between p-3 rounded-lg bg-muted/10 opacity-50">
                        <span className="text-muted-foreground">{skill.skill}</span>
                        <Badge variant="outline">—</Badge>
                      </div>
                    ))}
                  </div>
                )}

                {/* No data warning */}
                {availableSkills.length === 0 && (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    <div>
                      <p className="font-medium">No assessment data found</p>
                      <p className="text-sm opacity-80">
                        Complete the fluency and pronunciation modules to see your results.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Archetype Card */}
            {sessionData.archetype && (
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader>
                  <div className="flex items-center gap-2 text-primary">
                    <Target className="h-5 w-5" />
                    <span className="font-mono text-xs uppercase tracking-wider">Your Archetype</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="font-serif text-xl font-bold text-foreground capitalize">
                    {sessionData.archetype.replace(/_/g, " ")}
                  </h3>
                </CardContent>
              </Card>
            )}

            {/* Raw Data Debug */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
                  Raw Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 font-mono text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Session ID</span>
                  <span className="text-foreground truncate max-w-[150px]">
                    {sessionId || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg WPM</span>
                  <span className="text-foreground">
                    {sessionData.fluencyWpm ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pronunciation</span>
                  <span className="text-foreground">
                    {sessionData.pronunciationScore !== null 
                      ? `${sessionData.pronunciationScore}%` 
                      : "—"
                    }
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg font-serif text-foreground">What's Next?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full group" disabled>
                  View Full Report
                  <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Full report available after all modules complete
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Dev notice */}
      <div className="fixed bottom-4 left-4">
        <Badge variant="outline" className="bg-card text-xs">
          MVP Results - {availableSkills.length}/6 skills assessed
        </Badge>
      </div>
    </div>
  );
};

export default Results;
