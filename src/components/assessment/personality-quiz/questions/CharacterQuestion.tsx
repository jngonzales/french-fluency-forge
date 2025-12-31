import { CharacterQuestion as CharacterQuestionType } from "../quizConfig";
import { motion } from "framer-motion";

interface Props {
  question: CharacterQuestionType;
  value: string | null;
  onChange: (value: string) => void;
}

const characterEmojis: Record<string, string> = {
  strategist: '🎯',
  performer: '🎭',
  explorer: '🧭',
  perfectionist: '💎',
  diplomat: '🤝',
  hacker: '⚡',
};

export function CharacterQuestion({ question, value, onChange }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {question.characters.map((character, index) => (
        <motion.button
          key={character.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.08 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onChange(character.id)}
          className={`p-4 rounded-xl border-2 text-left transition-all ${
            value === character.id
              ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
              : "border-border hover:border-primary/50 hover:bg-muted/50"
          }`}
        >
          <div className="text-3xl mb-2">{characterEmojis[character.id] || '🎓'}</div>
          <h4 className="font-bold text-base mb-1">{character.name}</h4>
          <p className="text-sm text-muted-foreground">{character.description}</p>
        </motion.button>
      ))}
    </div>
  );
}
