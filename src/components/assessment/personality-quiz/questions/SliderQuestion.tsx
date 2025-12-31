import { Slider } from "@/components/ui/slider";
import { SliderQuestion as SliderQuestionType } from "../quizConfig";
import { motion } from "framer-motion";

interface Props {
  question: SliderQuestionType;
  value: number;
  onChange: (value: number) => void;
}

export function SliderQuestion({ question, value, onChange }: Props) {
  // Map 0-10 value to position description
  const getPositionLabel = () => {
    if (value <= 2) return question.leftLabel;
    if (value <= 4) return `Mostly ${question.leftLabel.toLowerCase()}`;
    if (value === 5) return "In the middle";
    if (value <= 7) return `Mostly ${question.rightLabel.toLowerCase()}`;
    return question.rightLabel;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 py-4"
    >
      {/* Labels at ends */}
      <div className="flex justify-between text-sm">
        <span 
          className={`max-w-[140px] text-center font-medium transition-colors ${
            value <= 4 ? "text-primary" : "text-muted-foreground"
          }`}
        >
          {question.leftLabel}
        </span>
        <span 
          className={`max-w-[140px] text-center font-medium transition-colors ${
            value >= 6 ? "text-primary" : "text-muted-foreground"
          }`}
        >
          {question.rightLabel}
        </span>
      </div>
      
      {/* Slider with gradient track */}
      <div className="px-2 relative">
        {/* Gradient background track */}
        <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-3 rounded-full bg-gradient-to-r from-primary/40 via-muted to-primary/40" />
        
        {/* Center marker */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-5 bg-border" />
        
        <Slider
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          min={0}
          max={10}
          step={1}
          className="cursor-pointer relative"
        />
      </div>
      
      {/* Current position indicator */}
      <motion.div 
        key={value}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <span className="inline-block px-5 py-2.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">
          {getPositionLabel()}
        </span>
      </motion.div>
    </motion.div>
  );
}
