import { useState, useEffect } from "react";
import { RankingQuestion as RankingQuestionType } from "../quizConfig";
import { motion } from "framer-motion";
import { GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  question: RankingQuestionType;
  value: string[]; // ordered list of item ids
  onChange: (value: string[]) => void;
}

export function RankingQuestion({ question, value, onChange }: Props) {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    if (value.length === 0) {
      // Initialize with default order
      setItems(question.items.map(item => item.id));
    } else {
      setItems(value);
    }
  }, [question.items, value]);

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    setItems(newItems);
    onChange(newItems);
  };

  const getItemLabel = (id: string) => {
    return question.items.find(item => item.id === id)?.text || id;
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground text-center mb-4">
        1 = Most important
      </p>
      {items.map((itemId, index) => (
        <motion.div
          key={itemId}
          layout
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center gap-3 p-4 rounded-xl border-2 border-border bg-card"
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <GripVertical className="h-5 w-5" />
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
              {index + 1}
            </span>
          </div>
          <span className="flex-1 font-medium">{getItemLabel(itemId)}</span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => moveItem(index, 'up')}
              disabled={index === 0}
              className="h-8 w-8"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => moveItem(index, 'down')}
              disabled={index === items.length - 1}
              className="h-8 w-8"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
