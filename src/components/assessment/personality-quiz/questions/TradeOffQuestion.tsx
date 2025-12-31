import { TradeOffQuestion as TradeOffQuestionType } from "../quizConfig";
import { motion } from "framer-motion";
import { ArrowLeftRight } from "lucide-react";

interface Props {
  question: TradeOffQuestionType;
  value: string | null;
  onChange: (value: string) => void;
}

export function TradeOffQuestion({ question, value, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-4 text-muted-foreground mb-6">
        <ArrowLeftRight className="h-5 w-5" />
        <span className="text-sm font-medium">Choose one</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {question.options.map((option, index) => (
          <motion.button
            key={option.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.15 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange(option.id)}
            className={`p-6 rounded-2xl border-2 text-left transition-all ${
              value === option.id
                ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                : "border-border hover:border-primary/50 hover:bg-muted/50"
            }`}
          >
            <p className="text-lg font-medium">{option.text}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
