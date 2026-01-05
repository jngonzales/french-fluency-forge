/**
 * Explanation Chips Component
 * Shows explanation chips and opens detailed view in bottom sheet
 */

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Loader2, HelpCircle } from 'lucide-react';
import { usePhraseExplanation } from '../hooks/usePhraseExplanation';

interface PhraseExplanation {
  meaning: {
    one_liner: string;
    literal: string;
    example: string;
  };
  grammar: {
    bullets: string[];
    common_mistakes: string[];
  };
  usage: {
    when_to_use: string[];
    when_not_to_use: string[];
    register: 'casual' | 'neutral' | 'formal';
  };
  transitions: {
    before: string[];
    after: string[];
  };
  why_not?: Array<{
    user_alt: string;
    answer: string;
    rule_of_thumb: string;
  }>;
}

interface ExplanationChipsProps {
  phraseId: string;
}

const EXPLANATION_CHIPS = [
  { id: 'meaning', label: 'Meaning' },
  { id: 'grammar', label: 'Grammar' },
  { id: 'usage', label: 'When do I use this?' },
  { id: 'formal_vs_casual', label: 'Formal vs casual' },
  { id: 'transitions', label: 'Transitions' },
  { id: 'why_not', label: 'Why not X?' },
] as const;

export function ExplanationChips({ phraseId }: ExplanationChipsProps) {
  const [open, setOpen] = useState(false);
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null);
  const { explanation, loading, error, fetchExplanation } = usePhraseExplanation(phraseId);

  const handleChipClick = async (intent: string) => {
    setSelectedIntent(intent);
    setOpen(true);
    if (!explanation) {
      await fetchExplanation(intent as any);
    }
  };

  const handleWhyNot = () => {
    // TODO: Open input dialog for "Why not X?"
    const userAlt = prompt('What alternative phrase did you think of?');
    if (userAlt) {
      setSelectedIntent('why_not');
      setOpen(true);
      fetchExplanation('why_not', userAlt);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2 mt-4">
        {EXPLANATION_CHIPS.map((chip) => (
          <Button
            key={chip.id}
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => {
              if (chip.id === 'why_not') {
                handleWhyNot();
              } else {
                handleChipClick(chip.id);
              }
            }}
          >
            {chip.label}
          </Button>
        ))}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Explanation</SheetTitle>
            <SheetDescription>
              Learn more about this phrase
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {error && (
              <div className="text-sm text-destructive">
                Failed to load explanation. Please try again.
              </div>
            )}

            {explanation && (
              <>
                {/* Meaning */}
                {(selectedIntent === 'meaning' || !selectedIntent) && explanation.meaning && (
                  <div>
                    <h3 className="font-semibold mb-2">Meaning</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {explanation.meaning.one_liner}
                    </p>
                    <p className="text-sm mb-2">
                      <strong>Literal:</strong> {explanation.meaning.literal}
                    </p>
                    <p className="text-sm">
                      <strong>Example:</strong> {explanation.meaning.example}
                    </p>
                  </div>
                )}

                {/* Grammar */}
                {(selectedIntent === 'grammar' || !selectedIntent) && explanation.grammar && (
                  <div>
                    <h3 className="font-semibold mb-2">Grammar</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm mb-3">
                      {explanation.grammar.bullets.map((bullet, i) => (
                        <li key={i}>{bullet}</li>
                      ))}
                    </ul>
                    {explanation.grammar.common_mistakes.length > 0 && (
                      <div>
                        <strong className="text-sm">Common mistakes:</strong>
                        <ul className="list-disc list-inside space-y-1 text-sm mt-1">
                          {explanation.grammar.common_mistakes.map((mistake, i) => (
                            <li key={i}>{mistake}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Usage */}
                {(selectedIntent === 'usage' || !selectedIntent) && explanation.usage && (
                  <div>
                    <h3 className="font-semibold mb-2">Usage</h3>
                    <div className="mb-2">
                      <strong className="text-sm">When to use:</strong>
                      <ul className="list-disc list-inside space-y-1 text-sm mt-1">
                        {explanation.usage.when_to_use.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    {explanation.usage.when_not_to_use.length > 0 && (
                      <div>
                        <strong className="text-sm">When not to use:</strong>
                        <ul className="list-disc list-inside space-y-1 text-sm mt-1">
                          {explanation.usage.when_not_to_use.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        {explanation.usage.register}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Formal vs Casual */}
                {selectedIntent === 'formal_vs_casual' && explanation.usage && (
                  <div>
                    <h3 className="font-semibold mb-2">Formal vs Casual</h3>
                    <p className="text-sm">
                      Register: <strong>{explanation.usage.register}</strong>
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {explanation.usage.when_to_use.join('. ')}
                    </p>
                  </div>
                )}

                {/* Transitions */}
                {(selectedIntent === 'transitions' || !selectedIntent) && explanation.transitions && (
                  <div>
                    <h3 className="font-semibold mb-2">Transitions</h3>
                    <div className="mb-2">
                      <strong className="text-sm">Common phrases before:</strong>
                      <ul className="list-disc list-inside space-y-1 text-sm mt-1">
                        {explanation.transitions.before.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <strong className="text-sm">Common phrases after:</strong>
                      <ul className="list-disc list-inside space-y-1 text-sm mt-1">
                        {explanation.transitions.after.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Why Not */}
                {selectedIntent === 'why_not' && explanation.why_not && explanation.why_not.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Why not X?</h3>
                    {explanation.why_not.map((item, i) => (
                      <div key={i} className="mb-4">
                        <p className="text-sm font-medium mb-1">
                          Why not "{item.user_alt}"?
                        </p>
                        <p className="text-sm text-muted-foreground mb-1">
                          {item.answer}
                        </p>
                        <p className="text-xs text-muted-foreground italic">
                          Rule of thumb: {item.rule_of_thumb}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

