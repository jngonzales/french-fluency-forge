import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, 
  MessageSquare, 
  BookOpen, 
  Target, 
  TrendingUp,
  ChevronRight,
  Download,
  Share2
} from "lucide-react";

// Mock data for preview
const mockResults = {
  overallLevel: "A2",
  overallScore: 42,
  archetype: "Le Voyageur",
  archetypeDescription: "You're motivated by travel and cultural experiences. Your French learning is driven by a desire to connect authentically with French-speaking cultures.",
  primaryTrack: "small_talk",
  
  skills: {
    pronunciation: {
      score: 55,
      level: "B1",
      details: "Good vowel sounds, needs work on nasal vowels and liaisons"
    },
    fluency: {
      score: 38,
      level: "A2",
      details: "Comfortable with basic phrases, hesitation with complex structures"
    },
    vocabulary: {
      score: 45,
      level: "A2",
      details: "Solid everyday vocabulary, limited idiomatic expressions"
    },
    grammar: {
      score: 32,
      level: "A1",
      details: "Present tense confident, needs practice with past/future"
    }
  },
  
  strengths: [
    "Clear pronunciation of individual words",
    "Good understanding of cognates",
    "Confident with greetings and introductions"
  ],
  
  improvements: [
    "Practice linking words together (liaisons)",
    "Expand vocabulary for describing experiences",
    "Work on verb conjugation consistency"
  ],
  
  recommendedPath: {
    name: "Conversation Starter",
    duration: "8 weeks",
    focus: "Building confidence in everyday conversations"
  }
};

const getLevelColor = (level: string) => {
  switch (level) {
    case "A1": return "bg-chart-5 text-secondary-foreground";
    case "A2": return "bg-chart-4 text-secondary-foreground";
    case "B1": return "bg-chart-3 text-foreground";
    case "B2": return "bg-chart-2 text-foreground";
    case "C1": return "bg-chart-1 text-foreground";
    case "C2": return "bg-primary text-primary-foreground";
    default: return "bg-muted text-muted-foreground";
  }
};

const SkillCard = ({ 
  icon: Icon, 
  title, 
  score, 
  level, 
  details 
}: { 
  icon: typeof Mic;
  title: string;
  score: number;
  level: string;
  details: string;
}) => (
  <Card className="border-border/50">
    <CardContent className="pt-6">
      <div className="flex items-start gap-4">
        <div className="rounded-lg bg-primary/10 p-2.5">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">{title}</h3>
            <Badge className={getLevelColor(level)}>{level}</Badge>
          </div>
          <Progress value={score} className="h-2" />
          <p className="text-sm text-muted-foreground">{details}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

const Results = () => {
  const { overallLevel, overallScore, archetype, archetypeDescription, skills, strengths, improvements, recommendedPath } = mockResults;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-2xl font-bold text-foreground">Your French Diagnostic</h1>
              <p className="text-muted-foreground">Personalized analysis based on your assessment</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
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
            {/* Overall Score Card */}
            <Card className="overflow-hidden border-border/50">
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8">
                <div className="flex items-center gap-8">
                  <div className="relative">
                    <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-primary bg-card shadow-lg">
                      <div className="text-center">
                        <span className="block font-serif text-4xl font-bold text-primary">{overallLevel}</span>
                        <span className="text-sm text-muted-foreground">CEFR Level</span>
                      </div>
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">{overallScore}%</Badge>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      <span className="font-mono text-sm text-muted-foreground">YOUR ARCHETYPE</span>
                    </div>
                    <h2 className="font-serif text-2xl font-bold text-foreground mb-2">{archetype}</h2>
                    <p className="text-muted-foreground leading-relaxed">{archetypeDescription}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Skills Breakdown */}
            <section>
              <h2 className="font-serif text-xl font-bold text-foreground mb-4">Skills Breakdown</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <SkillCard
                  icon={Mic}
                  title="Pronunciation"
                  score={skills.pronunciation.score}
                  level={skills.pronunciation.level}
                  details={skills.pronunciation.details}
                />
                <SkillCard
                  icon={MessageSquare}
                  title="Fluency"
                  score={skills.fluency.score}
                  level={skills.fluency.level}
                  details={skills.fluency.details}
                />
                <SkillCard
                  icon={BookOpen}
                  title="Vocabulary"
                  score={skills.vocabulary.score}
                  level={skills.vocabulary.level}
                  details={skills.vocabulary.details}
                />
                <SkillCard
                  icon={TrendingUp}
                  title="Grammar"
                  score={skills.grammar.score}
                  level={skills.grammar.level}
                  details={skills.grammar.details}
                />
              </div>
            </section>

            {/* Strengths & Improvements */}
            <div className="grid gap-6 sm:grid-cols-2">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg font-serif text-foreground">Your Strengths</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg font-serif text-foreground">Areas to Improve</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {improvements.map((improvement, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="mt-1 h-2 w-2 rounded-full bg-chart-3 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recommended Path */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <div className="flex items-center gap-2 text-primary">
                  <Target className="h-5 w-5" />
                  <span className="font-mono text-xs uppercase tracking-wider">Recommended For You</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-serif text-xl font-bold text-foreground">{recommendedPath.name}</h3>
                  <p className="text-sm text-muted-foreground">{recommendedPath.duration} program</p>
                </div>
                <p className="text-sm text-muted-foreground">{recommendedPath.focus}</p>
                <Button className="w-full group">
                  Start Your Journey
                  <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </CardContent>
            </Card>

            {/* CEFR Scale Reference */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
                  CEFR Scale
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {["C2", "C1", "B2", "B1", "A2", "A1"].map((level) => (
                    <div 
                      key={level} 
                      className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
                        level === overallLevel 
                          ? "bg-primary/10 border border-primary/20" 
                          : "bg-muted/30"
                      }`}
                    >
                      <span className={level === overallLevel ? "font-semibold text-primary" : "text-muted-foreground"}>
                        {level}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {level === "C2" && "Mastery"}
                        {level === "C1" && "Advanced"}
                        {level === "B2" && "Upper Intermediate"}
                        {level === "B1" && "Intermediate"}
                        {level === "A2" && "Elementary"}
                        {level === "A1" && "Beginner"}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg font-serif text-foreground">What's Next?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="mr-2 h-4 w-4" />
                  View Detailed Report
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Schedule Consultation
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Dev notice */}
      <div className="fixed bottom-4 left-4">
        <Badge variant="outline" className="bg-card text-xs">
          Preview with mock data
        </Badge>
      </div>
    </div>
  );
};

export default Results;
