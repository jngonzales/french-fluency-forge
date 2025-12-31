import { LikertQuestion as LikertQuestionType } from "../quizConfig";
import { motion } from "framer-motion";

interface Props {
  question: LikertQuestionType;
  value: string | null;
  onChange: (value: string) => void;
}

export function LikertQuestion({ question, value, onChange }: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch">
      {question.options.map((option, index) => (
        <motion.button
          key={option.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onChange(option.id)}
          className={`flex-1 px-6 py-4 rounded-xl border-2 text-center font-medium transition-all ${
            value === option.id
              ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30"
              : "border-border hover:border-primary/50 hover:bg-muted/50"
          }`}
        >
          {option.text}
        </motion.button>
      ))}
    </div>
  );
}
