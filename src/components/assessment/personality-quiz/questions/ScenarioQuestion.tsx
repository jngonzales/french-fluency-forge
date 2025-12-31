import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScenarioQuestion as ScenarioQuestionType } from "../quizConfig";
import { motion } from "framer-motion";

interface Props {
  question: ScenarioQuestionType;
  value: string | null;
  onChange: (value: string) => void;
}

export function ScenarioQuestion({ question, value, onChange }: Props) {
  return (
    <RadioGroup
      value={value || ""}
      onValueChange={onChange}
      className="space-y-3"
    >
      {question.options.map((option, index) => (
        <motion.div
          key={option.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <div
            className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
              value === option.id
                ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                : "border-border hover:border-primary/50 hover:bg-muted/50"
            }`}
            onClick={() => onChange(option.id)}
          >
            <RadioGroupItem value={option.id} id={`${question.id}-${option.id}`} />
            <Label
              htmlFor={`${question.id}-${option.id}`}
              className="flex-1 cursor-pointer font-normal text-base"
            >
              {option.text}
            </Label>
          </div>
        </motion.div>
      ))}
    </RadioGroup>
  );
}
