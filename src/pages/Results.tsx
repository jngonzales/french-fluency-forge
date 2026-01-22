import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useAdminMode } from "@/hooks/useAdminMode";
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Download, Share2, AlertCircle, Target, ChevronRight, Info, ArrowLeft, Home, CheckCircle2, Sparkles, ChevronDown } from "lucide-react";

interface SkillScore {
  skill: string;
  score: number;
  fullMark: 100;
  available: boolean;
  description?: string;
  rawValue?: string;
  completed?: number;
  total?: number;
}

interface SessionData {
  fluencyWpm: number | null;
  pronunciationScore: number | null;
  confidenceScore: number | null;
  confidenceQuestionnaireScore: number | null;
  confidenceHonestyFlag: boolean;
  syntaxScore: number | null;
  conversationScore: number | null;
  comprehensionScore: number | null;
  archetype: string | null;
  // Completion counts for partial scores
  pronunciationCompleted?: number;
  pronunciationTotal?: number;
  comprehensionCompleted?: number;
  comprehensionTotal?: number;
  fluencyCompleted?: number;
  fluencyTotal?: number;
  confidenceCompleted?: number;
  confidenceTotal?: number;
}

// Skill descriptions for the results page
const SKILL_DESCRIPTIONS: Record<string, string> = {
  Pronunciation: "Ability to produce French sounds accurately, especially challenging minimal pairs like 'dessus/dessous' and nasal vowels.",
  Fluency: "Speaking speed and naturalness measured in words per minute (WPM). Target: 80-150 WPM for conversational French.",
  Confidence: "Willingness to express opinions, take risks, and speak without excessive hesitation in French.",
  Syntax: "Grammatical accuracy including verb conjugation, gender agreement, and correct sentence structure.",
  Conversation: "Ability to handle real-world dialogue, respond to unexpected situations, and adapt to misunderstandings.",
  Comprehension: "Understanding of natural spoken French at native speed, including informal speech and varied accents."
};

// Convert pronunciation similarity (0-100) - already on correct scale
const pronunciationToScore = (similarity: number | null): number => {
  if (similarity === null) return 0;
  return Math.min(100, Math.max(0, Math.round(similarity)));
};

const Results = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session");
  const { showDevTools } = useAdminMode();
  const { toast } = useToast();
  
  // Dummy data for demo/preview mode
  const DUMMY_DATA: SessionData = {
    fluencyWpm: 95,
    pronunciationScore: 72,
    confidenceScore: 65,
    confidenceQuestionnaireScore: 70,
    confidenceHonestyFlag: true,
    syntaxScore: 58,
    conversationScore: 48,
    comprehensionScore: 81,
    archetype: "Le Perfectionniste"
  };

  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [sessionData, setSessionData] = useState<SessionData>({
    fluencyWpm: null,
    pronunciationScore: null,
    confidenceScore: null,
    confidenceQuestionnaireScore: null,
    confidenceHonestyFlag: false,
    syntaxScore: null,
    conversationScore: null,
    comprehensionScore: null,
    archetype: null
  });
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [skillDetailsModal, setSkillDetailsModal] = useState<{
    isOpen: boolean;
    skill: string;
    description: string;
    score: number;
    rawValue?: string;
  } | null>(null);

  const openSkillDetailsModal = (skill: SkillScore) => {
    setSkillDetailsModal({
      isOpen: true,
      skill: skill.skill,
      description: skill.description || "",
      score: skill.score,
      rawValue: skill.rawValue
    });
  };

  const closeSkillDetailsModal = () => {
    setSkillDetailsModal(null);
  };

  const handleExportPDF = () => {
    // Use browser print dialog to save as PDF
    window.print();
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    
    try {
      // Try Web Share API first (mobile/modern browsers)
      if (navigator.share) {
        await navigator.share({
          title: 'My French Diagnostic Results',
          text: `Check out my French Fluency Forge assessment results! Overall score: ${overallScore}%`,
          url: shareUrl
        });
      } else {
        // Fallback to clipboard copy
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link copied!",
          description: "Results link has been copied to your clipboard",
        });
      }
    } catch (error) {
      // Fallback if both fail
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "Results link has been copied to your clipboard",
      });
    }
  };

  useEffect(() => {
    const fetchResults = async () => {
      // If no session, use dummy data for demo
      if (!sessionId) {
        setSessionData(DUMMY_DATA);
        setIsDemoMode(true);
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

        // Fetch skill recordings for Confidence, Syntax, and Conversation
        const { data: skillRecordings } = await supabase
          .from("skill_recordings")
          .select("module_type, ai_score")
          .eq("session_id", sessionId)
          .eq("used_for_scoring", true)
          .not("ai_score", "is", null);

        // Fetch confidence questionnaire response
        const { data: questionnaireData } = await supabase
          .from("confidence_questionnaire_responses")
          .select("normalized_score, honesty_flag, responses")
          .eq("session_id", sessionId)
          .maybeSingle();

        // Calculate confidence completion count from responses
        let confidenceCompleted = 0;
        const confidenceTotal = 8; // Total questions in confidence questionnaire
        if (questionnaireData?.responses) {
          confidenceCompleted = Object.keys(questionnaireData.responses).filter(
            k => questionnaireData.responses[k] !== undefined && questionnaireData.responses[k] !== null
          ).length;
        }

        // Calculate average scores per module
        const moduleScores: Record<string, number[]> = {};
        if (skillRecordings) {
          for (const recording of skillRecordings) {
            if (!moduleScores[recording.module_type]) {
              moduleScores[recording.module_type] = [];
            }
            if (recording.ai_score !== null) {
              moduleScores[recording.module_type].push(Number(recording.ai_score));
            }
          }
        }

        const getAvgScore = (moduleType: string): number | null => {
          const scores = moduleScores[moduleType];
          if (!scores || scores.length === 0) return null;
          return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        };

        // Confidence now comes exclusively from the questionnaire
        const questionnaireConfidence = questionnaireData?.normalized_score ?? null;
        const combinedConfidenceScore =
          questionnaireConfidence !== null ? Math.round(questionnaireConfidence) : null;

        // Fetch pronunciation scores from skill_recordings
        const { data: pronunciationRecordings } = await supabase
          .from("skill_recordings")
          .select("ai_score")
          .eq("session_id", sessionId)
          .eq("module_type", "pronunciation")
          .eq("used_for_scoring", true)
          .not("ai_score", "is", null);
        
        let pronunciationScore: number | null = null;
        const pronunciationCompleted = pronunciationRecordings?.length ?? 0;
        const pronunciationTotal = 12; // Default phrase count in pronunciation module
        if (pronunciationRecordings && pronunciationRecordings.length > 0) {
          const totalScore = pronunciationRecordings.reduce((sum, r) => sum + Number(r.ai_score || 0), 0);
          pronunciationScore = Math.round(totalScore / pronunciationRecordings.length);
        }

        // Fetch comprehension scores
        const { data: comprehensionRecordings } = await supabase
          .from("comprehension_recordings")
          .select("ai_score")
          .eq("session_id", sessionId)
          .eq("used_for_scoring", true)
          .not("ai_score", "is", null);
        
        let comprehensionScore: number | null = null;
        const comprehensionCompleted = comprehensionRecordings?.length ?? 0;
        const comprehensionTotal = 8; // Total questions in comprehension module
        if (comprehensionRecordings && comprehensionRecordings.length > 0) {
          const totalScore = comprehensionRecordings.reduce((sum, r) => sum + Number(r.ai_score || 0), 0);
          comprehensionScore = Math.round(totalScore / comprehensionRecordings.length);
        }

        // Fluency completion count - it's 1 speech sample from conversation module
        const fluencyCompleted = fluencyRecordings?.length ?? 0;
        const fluencyTotal = 1; // Single speech sample from conversation module

        setSessionData({
          fluencyWpm: avgWpm,
          pronunciationScore,
          confidenceScore: combinedConfidenceScore,
          confidenceQuestionnaireScore: questionnaireConfidence,
          confidenceHonestyFlag: questionnaireData?.honesty_flag ?? false,
          syntaxScore: getAvgScore("syntax"),
          conversationScore: getAvgScore("conversation"),
          comprehensionScore,
          archetype: session?.archetype || null,
          pronunciationCompleted,
          pronunciationTotal,
          comprehensionCompleted,
          comprehensionTotal,
          fluencyCompleted,
          fluencyTotal,
          confidenceCompleted,
          confidenceTotal
        });
      } catch (error) {
        console.error("Error fetching results:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]); // DUMMY_DATA is a constant, safe to omit

  // Build radar chart data - 6 skills
  const skillData: SkillScore[] = [
    { 
      skill: "Pronunciation", 
      score: pronunciationToScore(sessionData.pronunciationScore), 
      fullMark: 100,
      available: sessionData.pronunciationScore !== null,
      description: SKILL_DESCRIPTIONS.Pronunciation,
      rawValue: sessionData.pronunciationScore !== null ? `${sessionData.pronunciationScore}% similarity` : undefined,
      completed: sessionData.pronunciationCompleted,
      total: sessionData.pronunciationTotal
    },
    { 
      skill: "Fluency", 
      score: Math.min(100, sessionData.fluencyWpm ?? 0), 
      fullMark: 100,
      available: sessionData.fluencyWpm !== null,
      description: SKILL_DESCRIPTIONS.Fluency,
      rawValue: sessionData.fluencyWpm !== null ? `${sessionData.fluencyWpm} WPM` : undefined,
      completed: sessionData.fluencyCompleted,
      total: sessionData.fluencyTotal
    },
    { 
      skill: "Confidence", 
      score: sessionData.confidenceScore ?? 0, 
      fullMark: 100,
      available: sessionData.confidenceScore !== null,
      description: SKILL_DESCRIPTIONS.Confidence,
      rawValue: sessionData.confidenceScore !== null ? `${sessionData.confidenceScore}/100` : undefined,
      completed: sessionData.confidenceCompleted,
      total: sessionData.confidenceTotal
    },
    { 
      skill: "Comprehension", 
      score: sessionData.comprehensionScore ?? 0, 
      fullMark: 100,
      available: sessionData.comprehensionScore !== null,
      description: SKILL_DESCRIPTIONS.Comprehension,
      rawValue: sessionData.comprehensionScore !== null ? `${sessionData.comprehensionScore}/100` : undefined,
      completed: sessionData.comprehensionCompleted,
      total: sessionData.comprehensionTotal
    },
    { 
      skill: "Syntax", 
      score: sessionData.syntaxScore ?? 0, 
      fullMark: 100,
      available: sessionData.syntaxScore !== null,
      description: SKILL_DESCRIPTIONS.Syntax,
      rawValue: sessionData.syntaxScore !== null ? `${sessionData.syntaxScore}/100` : undefined
    },
    { 
      skill: "Conversation", 
      score: sessionData.conversationScore ?? 0, 
      fullMark: 100,
      available: sessionData.conversationScore !== null,
      description: SKILL_DESCRIPTIONS.Conversation,
      rawValue: sessionData.conversationScore !== null ? `${sessionData.conversationScore}/100` : undefined
    }
  ];

  const availableSkills = skillData.filter(s => s.available);
  const unavailableSkills = skillData.filter(s => !s.available);
  
  // Calculate overall score from tested skills
  const testedScores = availableSkills.filter(s => s.score > 0);
  const overallScore = testedScores.length > 0 
    ? Math.round(testedScores.reduce((sum, s) => sum + s.score, 0) / testedScores.length)
    : 0;
  
  // Identify strengths (score >= 70) and weaknesses (score < 60)
  const strengths = testedScores.filter(s => s.score >= 70).sort((a, b) => b.score - a.score);
  const weaknesses = testedScores.filter(s => s.score < 60).sort((a, b) => a.score - b.score);
  
  // Next steps recommendations
  const nextStepsRecommendations: Record<string, string> = {
    Pronunciation: "Practice with minimal pairs and focus on French nasal vowels and liaisons. Record yourself and compare with native speakers.",
    Fluency: "Aim for 100-150 WPM through regular speaking practice. Try shadowing native French podcasts to improve rhythm.",
    Confidence: "Take more risks in conversation. Start with low-pressure environments like language exchange apps.",
    Syntax: "Review verb conjugations and gender agreement. Use apps like Duolingo or Babbel for daily grammar practice.",
    Conversation: "Practice real-world dialogue scenarios. Join conversation groups or find a language exchange partner.",
    Comprehension: "Listen to French podcasts, radio, and TV shows at native speed. Start with subtitles, then remove them gradually."
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 animate-fade-in">
        <div className="container mx-auto max-w-4xl space-y-8">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-[300px] w-full rounded-lg" />
            <Skeleton className="h-[300px] w-full rounded-lg" />
          </div>
          <Skeleton className="h-[200px] w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background ${showDevTools ? 'pt-10' : ''}`}>
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/speaking-assessment')}
                className="gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="font-serif text-2xl font-bold text-foreground">Your French Diagnostic</h1>
                <p className="text-muted-foreground">
                  {isDemoMode ? (
                    <span className="flex items-center gap-2">
                      Demo Mode — Sample Results
                      <Badge variant="secondary" className="text-xs">Preview</Badge>
                    </span>
                  ) : (
                    "Results from your assessment"
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="gap-1.5"
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
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
                  Your performance across 6 key language skills (0-100 scale)
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={skillData} cx="50%" cy="50%" outerRadius="65%">
                      <PolarGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                      <PolarAngleAxis 
                        dataKey="skill" 
                        tick={{ fill: "hsl(var(--foreground))", fontSize: 12, fontWeight: 500 }}
                        tickLine={false}
                      />
                      <PolarRadiusAxis 
                        angle={30} 
                        domain={[0, 100]} 
                        tick={false}
                        axisLine={false}
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
                          return [value + "/100", name];
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Overall Score Card */}
            {testedScores.length > 0 && (
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Overall Score</p>
                      <div className="flex items-center gap-2">
                        <span className="text-4xl font-bold text-foreground">{overallScore}</span>
                        <span className="text-xl text-muted-foreground">/100</span>
                      </div>
                    </div>
                    
                    {/* Circular Progress */}
                    <div className="relative w-40 h-40">
                      <svg className="w-40 h-40 transform -rotate-90">
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="12"
                          className="text-muted/20"
                        />
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          fill="none"
                          stroke="hsl(var(--primary))"
                          strokeWidth="12"
                          strokeLinecap="round"
                          strokeDasharray={`${overallScore * 4.4} 440`}
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-bold text-foreground">{overallScore}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Strengths & Weaknesses Summary */}
            {testedScores.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                <Card className="border-emerald-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                      Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {strengths.length > 0 ? (
                      <ul className="space-y-2">
                        {strengths.map(s => (
                          <li key={s.skill} className="flex items-center justify-between text-foreground">
                            <span>{s.skill}</span>
                            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                              {s.score}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground text-sm">Keep practicing to build your strengths!</p>
                    )}
                  </CardContent>
                </Card>

                {/* Areas to Improve */}
                <Card className="border-orange-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg text-orange-600 dark:text-orange-400">
                      <AlertCircle className="w-5 h-5" />
                      Areas to Improve
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {weaknesses.length > 0 ? (
                      <ul className="space-y-2">
                        {weaknesses.map(s => (
                          <li key={s.skill} className="flex items-center justify-between text-foreground">
                            <span>{s.skill}</span>
                            <Badge variant="secondary" className="bg-orange-500/20 text-orange-600 dark:text-orange-400">
                              {s.score}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground text-sm">Great job! All tested areas are performing well.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* All Dimension Scores Grid (Bento Layout) */}
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4 font-serif">Skill Breakdown</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {skillData.map((skill) => (
                  <Card 
                    key={skill.skill} 
                    className={`border-border/50 hover:border-border transition-colors ${!skill.available ? 'opacity-60' : ''}`}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center justify-between">
                        <span className="text-lg font-serif text-foreground">{skill.skill}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {skill.available ? (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-3xl font-bold text-foreground">{skill.score}</span>
                            <Badge 
                              variant="secondary" 
                              className={`${
                                skill.score >= 70 ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                                skill.score >= 50 ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                                'bg-orange-500/20 text-orange-600 dark:text-orange-400'
                              } text-xs`}
                            >
                              {skill.score >= 70 ? 'Strong' : skill.score >= 50 ? 'Good' : 'Needs Work'}
                            </Badge>
                          </div>
                          <Progress 
                            value={skill.score} 
                            className="h-2"
                          />
                          {skill.description && (
                            <div>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {skill.description}
                              </p>
                              {skill.description.length > 80 && (
                                <button
                                  onClick={() => openSkillDetailsModal(skill)}
                                  className="text-xs text-primary hover:text-primary/80 mt-1 flex items-center gap-1 transition-colors"
                                >
                                  See more <ChevronDown className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          )}
                          {skill.rawValue && (
                            <p className="text-xs text-muted-foreground">
                              Raw: {skill.rawValue}
                            </p>
                          )}
                          {skill.completed !== undefined && skill.total !== undefined && skill.total > 1 && (
                            <p className="text-xs text-muted-foreground">
                              {skill.completed === skill.total ? (
                                <span className="text-emerald-600 dark:text-emerald-400">✓ {skill.completed}/{skill.total} completed</span>
                              ) : skill.completed > 0 ? (
                                <span className="text-amber-600 dark:text-amber-400">⚡ {skill.completed}/{skill.total} completed (partial)</span>
                              ) : null}
                            </p>
                          )}
                        </>
                      ) : (
                        <div className="py-4 text-center">
                          <span className="text-muted-foreground text-sm">Not tested</span>
                          {skill.completed !== undefined && skill.total !== undefined && skill.total > 1 && skill.completed > 0 && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                              {skill.completed}/{skill.total} attempted
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Recommended Next Steps */}
            {weaknesses.length > 0 && (
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl text-foreground font-serif">
                    <Target className="w-6 h-6 text-primary" />
                    Recommended Next Steps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    {weaknesses.slice(0, 3).map((w) => (
                      <li key={w.skill} className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-muted flex-shrink-0 mt-1">
                          <Target className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{w.skill}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {nextStepsRecommendations[w.skill]}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Score Details (OLD - keeping for reference) */}
            <Card className="border-border/50 hidden">
              <CardHeader>
                <CardTitle className="font-serif text-xl">Score Breakdown (Legacy)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Available Skills */}
                {availableSkills.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-foreground">Assessed Skills</h3>
                    {availableSkills.map((skill) => (
                      <div key={skill.skill} className="p-4 rounded-lg bg-muted/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{skill.skill}</span>
                            {skill.rawValue && (
                              <span className="text-xs text-muted-foreground">
                                ({skill.rawValue})
                              </span>
                            )}
                          </div>
                          <Badge variant="default" className="text-lg font-bold">
                            {skill.score}/100
                          </Badge>
                        </div>
                        {skill.description && (
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {skill.description}
                          </p>
                        )}
                        {/* Confidence honesty flag note */}
                        {skill.skill === 'Confidence' && sessionData.confidenceHonestyFlag && (
                          <div className="mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                            <p className="text-xs text-amber-700 dark:text-amber-400">
                              You want to be more spontaneous, but under pressure you still avoid speaking sometimes — totally normal.
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Unavailable Skills */}
                {unavailableSkills.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">Coming Soon</h3>
                    {unavailableSkills.map((skill) => (
                      <div key={skill.skill} className="p-4 rounded-lg bg-muted/10 opacity-50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">{skill.skill}</span>
                          <Badge variant="outline">—</Badge>
                        </div>
                        {skill.description && (
                          <p className="text-xs text-muted-foreground/70 leading-relaxed">
                            {skill.description}
                          </p>
                        )}
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

            {/* Understanding Your Results */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  <CardTitle className="font-serif text-xl">Understanding Your Results</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>
                  Your French diagnostic measures 6 key language skills on a scale of 0-100. 
                  Each skill is assessed through specific exercises designed to evaluate different 
                  aspects of your French proficiency.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="p-3 rounded-lg bg-muted/20">
                    <div className="font-medium text-foreground mb-1">0-30: Beginner</div>
                    <p className="text-xs">Foundation skills, needs significant practice</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/20">
                    <div className="font-medium text-foreground mb-1">31-50: Elementary</div>
                    <p className="text-xs">Basic competency, room for improvement</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/20">
                    <div className="font-medium text-foreground mb-1">51-70: Intermediate</div>
                    <p className="text-xs">Good working knowledge, can handle most situations</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/20">
                    <div className="font-medium text-foreground mb-1">71-100: Advanced</div>
                    <p className="text-xs">Strong proficiency, near-native competency</p>
                  </div>
                </div>
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
                    <Sparkles className="h-5 w-5" />
                    <span className="font-mono text-xs uppercase tracking-wider">Your Learning Archetype</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-2">
                    <span className="text-lg font-bold text-primary capitalize">
                      {sessionData.archetype.replace(/_/g, " ")}
                    </span>
                  </div>
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
                      ? `${Math.round(sessionData.pronunciationScore)}%` 
                      : "—"
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Confidence</span>
                  <span className="text-foreground">
                    {sessionData.confidenceScore !== null 
                      ? `${Math.round(sessionData.confidenceScore)}/100` 
                      : "—"
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Syntax</span>
                  <span className="text-foreground">
                    {sessionData.syntaxScore !== null 
                      ? `${Math.round(sessionData.syntaxScore)}/100` 
                      : "—"
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Conversation</span>
                  <span className="text-foreground">
                    {sessionData.conversationScore !== null 
                      ? `${sessionData.conversationScore}/100` 
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
                <Button 
                  className="w-full group" 
                  onClick={() => navigate('/dashboard')}
                >
                  Go to Dashboard
                  <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  View your progress and continue practicing
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

      {/* Skill Details Modal */}
      <Dialog open={skillDetailsModal?.isOpen ?? false} onOpenChange={(open) => !open && closeSkillDetailsModal()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground font-serif text-xl">
              {skillDetailsModal?.skill}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Detailed information about {skillDetailsModal?.skill}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-4xl font-bold text-foreground">{skillDetailsModal?.score}</span>
              <Badge 
                variant="secondary" 
                className={`${
                  (skillDetailsModal?.score ?? 0) >= 70 ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                  (skillDetailsModal?.score ?? 0) >= 50 ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                  'bg-orange-500/20 text-orange-600 dark:text-orange-400'
                } text-xs`}
              >
                {(skillDetailsModal?.score ?? 0) >= 70 ? 'Strong' : (skillDetailsModal?.score ?? 0) >= 50 ? 'Good' : 'Needs Work'}
              </Badge>
            </div>
            <Progress 
              value={skillDetailsModal?.score ?? 0} 
              className="h-2"
            />
            {skillDetailsModal?.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {skillDetailsModal.description}
              </p>
            )}
            {skillDetailsModal?.rawValue && (
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs font-mono text-muted-foreground">
                  Raw: {skillDetailsModal.rawValue}
                </p>
              </div>
            )}
            {nextStepsRecommendations[skillDetailsModal?.skill || ''] && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs font-medium text-foreground mb-1">Recommended Next Steps</p>
                <p className="text-xs text-muted-foreground">
                  {nextStepsRecommendations[skillDetailsModal?.skill || '']}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Results;
