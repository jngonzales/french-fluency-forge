import { Slider } from "@/components/ui/slider";
import { SliderQuestion as SliderQuestionType } from "../quizConfig";
import { motion } from "framer-motion";

interface Props {
  question: SliderQuestionType;
  value: number;
  onChange: (value: number) => void;
}

export function SliderQuestion({ question, value, onChange }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 py-4"
    >
      <div className="flex justify-between text-sm">
        <span className="max-w-[120px] text-center font-medium text-muted-foreground">
          {question.leftLabel}
        </span>
        <span className="max-w-[120px] text-center font-medium text-muted-foreground">
          {question.rightLabel}
        </span>
      </div>
      
      <div className="px-2">
        <Slider
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          min={0}
          max={10}
          step={1}
          className="cursor-pointer"
        />
      </div>
      
      <div className="flex justify-between text-xs text-muted-foreground/60">
        {[...Array(11)].map((_, i) => (
          <span key={i} className={i === value ? "text-primary font-bold" : ""}>
            {i}
          </span>
        ))}
      </div>
      
      <div className="text-center">
        <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary font-medium">
          {value}
        </span>
      </div>
    </motion.div>
  );
}
