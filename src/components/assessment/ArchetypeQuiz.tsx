import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, Loader2, Sparkles } from "lucide-react";
import SkipButton from "./SkipButton";

// Quiz questions with archetype scoring
const QUIZ_QUESTIONS = [
  {
    id: "q1",
    question: "When learning a new French word, you prefer to:",
    options: [
      { id: "a", text: "Hear it spoken and repeat it out loud", archetypes: { auditory: 2, social: 1 } },
      { id: "b", text: "See it written and visualize its meaning", archetypes: { visual: 2, analytical: 1 } },
      { id: "c", text: "Use it in a sentence right away", archetypes: { kinesthetic: 2, practical: 1 } },
      { id: "d", text: "Understand its etymology and grammar rules", archetypes: { analytical: 2, visual: 1 } },
    ],
  },
  {
    id: "q2",
    question: "Your ideal French learning environment is:",
    options: [
      { id: "a", text: "A lively café with native speakers", archetypes: { social: 2, auditory: 1 } },
      { id: "b", text: "A quiet study with books and notes", archetypes: { analytical: 2, visual: 1 } },
      { id: "c", text: "An immersive trip to France", archetypes: { kinesthetic: 2, practical: 1 } },
      { id: "d", text: "A structured online course with videos", archetypes: { visual: 2, practical: 1 } },
    ],
  },
  {
    id: "q3",
    question: "When you make a mistake in French, you:",
    options: [
      { id: "a", text: "Want someone to correct you immediately", archetypes: { social: 2, practical: 1 } },
      { id: "b", text: "Prefer to figure out why it was wrong yourself", archetypes: { analytical: 2, kinesthetic: 1 } },
      { id: "c", text: "Move on quickly and try again", archetypes: { kinesthetic: 2, practical: 1 } },
      { id: "d", text: "Write it down to remember for next time", archetypes: { visual: 2, analytical: 1 } },
    ],
  },
  {
    id: "q4",
    question: "You feel most motivated when:",
    options: [
      { id: "a", text: "Having real conversations with French speakers", archetypes: { social: 2, auditory: 1 } },
      { id: "b", text: "Watching French films with subtitles", archetypes: { visual: 2, auditory: 1 } },
      { id: "c", text: "Ordering food or asking for directions in French", archetypes: { practical: 2, kinesthetic: 1 } },
      { id: "d", text: "Completing grammar exercises correctly", archetypes: { analytical: 2, practical: 1 } },
    ],
  },
  {
    id: "q5",
    question: "Your French learning goal is primarily:",
    options: [
      { id: "a", text: "To connect with French-speaking people and culture", archetypes: { social: 2, auditory: 1 } },
      { id: "b", text: "To read French literature and watch films", archetypes: { visual: 2, analytical: 1 } },
      { id: "c", text: "To travel and navigate daily life in France", archetypes: { practical: 2, kinesthetic: 1 } },
      { id: "d", text: "To achieve fluency and perfect pronunciation", archetypes: { auditory: 2, kinesthetic: 1 } },
    ],
  },
  {
    id: "q6",
    question: "When studying vocabulary, you prefer:",
    options: [
      { id: "a", text: "Flashcards with images", archetypes: { visual: 2, practical: 1 } },
      { id: "b", text: "Listening to audio recordings", archetypes: { auditory: 2, kinesthetic: 1 } },
      { id: "c", text: "Role-playing scenarios", archetypes: { kinesthetic: 2, social: 1 } },
      { id: "d", text: "Word lists organized by category", archetypes: { analytical: 2, visual: 1 } },
    ],
  },
];

// Archetype definitions
const ARCHETYPES = {
  visual: {
    name: "The Visual Learner",
    emoji: "👁️",
    description: "You learn best through seeing. Written words, images, charts, and videos help you absorb French naturally.",
    tips: ["Use color-coded notes", "Watch French films with subtitles", "Create visual mind maps for vocabulary"],
  },
  auditory: {
    name: "The Melodic Ear",
    emoji: "🎵",
    description: "You have a natural ear for sounds and rhythm. Listening and speaking are your strongest pathways to learning.",
    tips: ["Listen to French podcasts daily", "Repeat phrases out loud", "Learn through French songs"],
  },
  kinesthetic: {
    name: "The Active Explorer",
    emoji: "🚀",
    description: "You learn by doing. Hands-on practice and real-world application help you internalize French quickly.",
    tips: ["Practice with language exchange partners", "Use gestures while learning", "Write by hand instead of typing"],
  },
  analytical: {
    name: "The Pattern Seeker",
    emoji: "🧩",
    description: "You love understanding the 'why' behind language. Grammar rules and logical patterns make French click for you.",
    tips: ["Study grammar systematically", "Compare French to other languages", "Keep a grammar journal"],
  },
  social: {
    name: "The Conversationalist",
    emoji: "💬",
    description: "You thrive on human connection. Conversations and social interaction accelerate your French learning.",
    tips: ["Join French conversation groups", "Find a language exchange buddy", "Practice with native speakers online"],
  },
  practical: {
    name: "The Goal-Oriented Achiever",
    emoji: "🎯",
    description: "You focus on practical outcomes. You want French skills you can use immediately in real situations.",
    tips: ["Focus on phrases for your specific needs", "Set concrete, measurable goals", "Practice real-world scenarios"],
  },
};

type ArchetypeKey = keyof typeof ARCHETYPES;

interface ArchetypeQuizProps {
  sessionId: string;
  onComplete: (archetype: string) => void;
  onSkip?: () => void;
}

const ArchetypeQuiz = ({ sessionId, onComplete, onSkip }: ArchetypeQuizProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultArchetype, setResultArchetype] = useState<ArchetypeKey | null>(null);

  const currentQuestion = QUIZ_QUESTIONS[currentIndex];
  const progress = ((currentIndex) / QUIZ_QUESTIONS.length) * 100;
  const isLastQuestion = currentIndex === QUIZ_QUESTIONS.length - 1;

  const handleNext = () => {
    if (!selectedOption) {
      toast.error("Please select an answer");
      return;
    }

    // Save answer
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: selectedOption,
    }));

    if (isLastQuestion) {
      // Calculate result
      calculateResult();
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(answers[QUIZ_QUESTIONS[currentIndex + 1]?.id] || null);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setSelectedOption(answers[QUIZ_QUESTIONS[currentIndex - 1]?.id] || null);
    }
  };

  const calculateResult = async () => {
    setIsSubmitting(true);

    // Tally up archetype scores
    const scores: Record<ArchetypeKey, number> = {
      visual: 0,
      auditory: 0,
      kinesthetic: 0,
      analytical: 0,
      social: 0,
      practical: 0,
    };

    // Include current selection
    const allAnswers = { ...answers, [currentQuestion.id]: selectedOption };

    QUIZ_QUESTIONS.forEach((question) => {
      const answerId = allAnswers[question.id];
      const selectedOpt = question.options.find((o) => o.id === answerId);
      if (selectedOpt) {
        Object.entries(selectedOpt.archetypes).forEach(([archetype, points]) => {
          scores[archetype as ArchetypeKey] += points;
        });
      }
    });

    // Find highest scoring archetype
    const topArchetype = Object.entries(scores).reduce((a, b) => 
      b[1] > a[1] ? b : a
    )[0] as ArchetypeKey;

    setResultArchetype(topArchetype);

    try {
      // Save to database
      const { error } = await supabase
        .from("assessment_sessions")
        .update({ archetype: topArchetype })
        .eq("id", sessionId);

      if (error) throw error;

      setShowResult(true);
    } catch (error) {
      console.error("Error saving archetype:", error);
      toast.error("Failed to save result");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = () => {
    if (resultArchetype) {
      onComplete(resultArchetype);
    }
  };

  // Show result screen
  if (showResult && resultArchetype) {
    const archetype = ARCHETYPES[resultArchetype];
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-primary/20">
            <CardHeader className="text-center pb-2">
              <div className="text-6xl mb-4">{archetype.emoji}</div>
              <CardTitle className="text-2xl">
                <span className="flex items-center justify-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Your Learning Archetype
                  <Sparkles className="h-5 w-5 text-primary" />
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-primary mb-2">
                  {archetype.name}
                </h2>
                <p className="text-muted-foreground">
                  {archetype.description}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <h3 className="font-medium mb-3">Personalized Tips for You:</h3>
                <ul className="space-y-2">
                  {archetype.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-primary font-bold">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              <Button 
                size="lg" 
                className="w-full" 
                onClick={handleContinue}
              >
                Continue to Mic Check
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold">Learning Style Quiz</h1>
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} of {QUIZ_QUESTIONS.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            Answer honestly - there are no right or wrong answers!
          </p>
        </div>

        {/* Question card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-medium leading-relaxed">
              {currentQuestion.question}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={selectedOption || ""}
              onValueChange={setSelectedOption}
              className="space-y-3"
            >
              {currentQuestion.options.map((option) => (
                <div
                  key={option.id}
                  className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                    selectedOption === option.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedOption(option.id)}
                >
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label
                    htmlFor={option.id}
                    className="flex-1 cursor-pointer font-normal"
                  >
                    {option.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex gap-3">
          {currentIndex > 0 && (
            <Button
              variant="outline"
              size="lg"
              onClick={handleBack}
              className="flex-1"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <Button
            size="lg"
            onClick={handleNext}
            disabled={!selectedOption || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Calculating...
              </>
            ) : isLastQuestion ? (
              <>
                See My Archetype
                <Sparkles className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 rounded-lg bg-muted/50 text-sm text-center">
          <p className="text-muted-foreground">
            This quiz helps us understand how you learn best so we can personalize your experience.
          </p>
        </div>

        {onSkip && <SkipButton onClick={onSkip} />}
      </div>
    </div>
  );
};

export default ArchetypeQuiz;
