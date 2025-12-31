import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, Loader2, Brain } from "lucide-react";
import SkipButton from "../SkipButton";
import { Button } from "@/components/ui/button";
import {
  QUIZ_QUESTIONS,
  QuizQuestion,
  ScenarioQuestion as ScenarioQ,
  TradeOffQuestion as TradeOffQ,
  LikertQuestion as LikertQ,
  SliderQuestion as SliderQ,
  RankingQuestion as RankingQ,
  CharacterQuestion as CharacterQ,
  AxisKey,
  getArchetype,
  normalizeScore,
  getAxisLabel,
  Archetype,
} from "./quizConfig";
import { ScenarioQuestion } from "./questions/ScenarioQuestion";
import { TradeOffQuestion } from "./questions/TradeOffQuestion";
import { LikertQuestion } from "./questions/LikertQuestion";
import { SliderQuestion } from "./questions/SliderQuestion";
import { RankingQuestion } from "./questions/RankingQuestion";
import { CharacterQuestion } from "./questions/CharacterQuestion";
import { PersonalityResult } from "./PersonalityResult";

interface Props {
  sessionId: string;
  onComplete: (archetype: string) => void;
  onSkip?: () => void;
}

type AnswerValue = string | number | string[];

interface Answers {
  [questionId: string]: AnswerValue;
}

const pageVariants = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
};

export function PersonalityQuiz({ sessionId, onComplete, onSkip }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<{
    archetype: Archetype;
    axes: {
      control_flow: { raw: number; normalized: number; label: string };
      accuracy_expressiveness: { raw: number; normalized: number; label: string };
      security_risk: { raw: number; normalized: number; label: string };
    };
    consistencyGap: number;
  } | null>(null);

  const currentQuestion = QUIZ_QUESTIONS[currentIndex];
  const progress = ((currentIndex + 1) / QUIZ_QUESTIONS.length) * 100;
  const isLastQuestion = currentIndex === QUIZ_QUESTIONS.length - 1;

  const currentAnswer = answers[currentQuestion.id];
  const hasAnswer = useMemo(() => {
    if (currentAnswer === undefined) return false;
    if (currentQuestion.type === 'slider') return true; // slider always has a default
    if (currentQuestion.type === 'ranking') return (currentAnswer as string[]).length > 0;
    return currentAnswer !== null && currentAnswer !== '';
  }, [currentAnswer, currentQuestion.type]);

  const handleAnswer = useCallback((value: AnswerValue) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
  }, [currentQuestion.id]);

  const handleNext = async () => {
    if (!hasAnswer && currentQuestion.type !== 'slider') {
      toast.error("Please answer the question");
      return;
    }

    if (isLastQuestion) {
      await calculateResult();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const calculateResult = async () => {
    setIsSubmitting(true);

    try {
      // Initialize axis scores
      const scores: Record<AxisKey, number> = {
        control_flow: 0,
        accuracy_expressiveness: 0,
        security_risk: 0,
      };

      // Calculate scores from answers
      QUIZ_QUESTIONS.forEach(question => {
        const answer = answers[question.id];
        if (answer === undefined) return;

        switch (question.type) {
          case 'scenario':
          case 'trade_off':
          case 'likert': {
            const q = question as ScenarioQ | TradeOffQ | LikertQ;
            const selected = q.options.find(o => o.id === answer);
            if (selected) {
              scores[selected.primary.axis] += selected.primary.delta;
              if (selected.secondary) {
                scores[selected.secondary.axis] += selected.secondary.delta;
              }
            }
            break;
          }
          case 'slider': {
            const q = question as SliderQ;
            const val = answer as number;
            // 0 = left, 10 = right
            const factor = val / 10; // 0-1
            const leftWeight = 1 - factor;
            const rightWeight = factor;
            
            scores[q.leftAxis.axis] += Math.round(q.leftAxis.delta * leftWeight);
            scores[q.rightAxis.axis] += Math.round(q.rightAxis.delta * rightWeight);
            
            if (q.secondaryLeft && leftWeight > 0.5) {
              scores[q.secondaryLeft.axis] += Math.round(q.secondaryLeft.delta * leftWeight);
            }
            if (q.secondaryRight && rightWeight > 0.5) {
              scores[q.secondaryRight.axis] += Math.round(q.secondaryRight.delta * rightWeight);
            }
            break;
          }
          case 'ranking': {
            const q = question as RankingQ;
            const ranking = answer as string[];
            // Scoring: 1st = +2, 2nd = +1, 3rd = 0, 4th = -1
            const points = [2, 1, 0, -1];
            ranking.forEach((itemId, idx) => {
              const item = q.items.find(i => i.id === itemId);
              if (item && idx < points.length) {
                const delta = item.direction === 'positive' ? points[idx] : -points[idx];
                scores[item.axis] += delta;
              }
            });
            break;
          }
          case 'character': {
            const q = question as CharacterQ;
            const selected = q.characters.find(c => c.id === answer);
            if (selected) {
              selected.axes.forEach(axis => {
                scores[axis.axis] += axis.delta;
              });
            }
            break;
          }
        }
      });

      // Get archetype
      const archetype = getArchetype(
        scores.control_flow,
        scores.accuracy_expressiveness,
        scores.security_risk
      );

      // Calculate normalized values
      const axes = {
        control_flow: {
          raw: scores.control_flow,
          normalized: normalizeScore(scores.control_flow),
          label: getAxisLabel(normalizeScore(scores.control_flow), 'control_flow'),
        },
        accuracy_expressiveness: {
          raw: scores.accuracy_expressiveness,
          normalized: normalizeScore(scores.accuracy_expressiveness),
          label: getAxisLabel(normalizeScore(scores.accuracy_expressiveness), 'accuracy_expressiveness'),
        },
        security_risk: {
          raw: scores.security_risk,
          normalized: normalizeScore(scores.security_risk),
          label: getAxisLabel(normalizeScore(scores.security_risk), 'security_risk'),
        },
      };

      // Calculate consistency gap (simplified)
      // Compare ideal-self question (q14) with pressure-context questions (q1, q3, q11)
      const consistencyGap = 0; // TODO: implement full consistency gap calculation

      // Save to database
      const { error } = await supabase
        .from("assessment_sessions")
        .update({ archetype: archetype.id })
        .eq("id", sessionId);

      if (error) throw error;

      setResult({ archetype, axes, consistencyGap });
      setShowResult(true);
    } catch (error) {
      console.error("Error calculating result:", error);
      toast.error("Failed to save result");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = () => {
    if (result) {
      onComplete(result.archetype.id);
    }
  };

  // Show result screen
  if (showResult && result) {
    return (
      <PersonalityResult
        archetype={result.archetype}
        axes={result.axes}
        consistencyGap={result.consistencyGap}
        sessionId={sessionId}
        onContinue={handleContinue}
      />
    );
  }

  const renderQuestion = () => {
    const value = answers[currentQuestion.id];

    switch (currentQuestion.type) {
      case 'scenario':
        return (
          <ScenarioQuestion
            question={currentQuestion as ScenarioQ}
            value={value as string | null}
            onChange={handleAnswer}
          />
        );
      case 'trade_off':
        return (
          <TradeOffQuestion
            question={currentQuestion as TradeOffQ}
            value={value as string | null}
            onChange={handleAnswer}
          />
        );
      case 'likert':
        return (
          <LikertQuestion
            question={currentQuestion as LikertQ}
            value={value as string | null}
            onChange={handleAnswer}
          />
        );
      case 'slider':
        return (
          <SliderQuestion
            question={currentQuestion as SliderQ}
            value={(value as number) ?? 5}
            onChange={handleAnswer}
          />
        );
      case 'ranking':
        return (
          <RankingQuestion
            question={currentQuestion as RankingQ}
            value={(value as string[]) ?? []}
            onChange={handleAnswer}
          />
        );
      case 'character':
        return (
          <CharacterQuestion
            question={currentQuestion as CharacterQ}
            value={value as string | null}
            onChange={handleAnswer}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-primary/10">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Personality Test</h1>
              <p className="text-sm text-muted-foreground">
                Discover your learning style
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
            <span>Question {currentIndex + 1} of {QUIZ_QUESTIONS.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <h2 className="text-lg md:text-xl font-medium mb-6 leading-relaxed">
              {currentQuestion.prompt}
            </h2>
            {renderQuestion()}
          </motion.div>
        </AnimatePresence>

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
            disabled={(!hasAnswer && currentQuestion.type !== 'slider') || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : isLastQuestion ? (
              <>
                See My Personality
                <Brain className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {onSkip && <SkipButton onClick={onSkip} />}
      </div>
    </div>
  );
}
