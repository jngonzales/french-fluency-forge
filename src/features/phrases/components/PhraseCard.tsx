/**
 * Phrase Card Component
 * Displays the prompt (recall mode only - Say this in French)
 */

import { Mic, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getAssistHint } from '../utils/assistLevel';
import type { Phrase, MemberPhraseCard } from '../types';

interface PhraseCardProps {
  phrase: Phrase;
  card?: MemberPhraseCard;
  showSpeechIcon?: boolean;
  onStartSpeech?: () => void;
}

export function PhraseCard({ phrase, card, showSpeechIcon, onStartSpeech }: PhraseCardProps) {
  const assistLevel = card?.assist_level || 0;
  const assistHint = getAssistHint(phrase, assistLevel);
  const isPaused = card?.paused_reason === 'struggling';

  return (
    <div className="relative bg-card border border-border rounded-lg p-8 shadow-sm min-h-[300px] flex flex-col items-center justify-center transition-all duration-200 hover:shadow-md animate-fade-in">
      {/* Pause banner */}
      {isPaused && (
        <Alert className="absolute top-2 left-2 right-2 z-10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            This one is sticky. We paused it — ask your coach and we'll bring it back later.
          </AlertDescription>
        </Alert>
      )}

      {/* Mode badge */}
      <div className="absolute top-4 left-4">
        <Badge variant="default">Recall</Badge>
      </div>

      {/* Speech icon (if enabled) */}
      {showSpeechIcon && (
        <div className="absolute top-4 right-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onStartSpeech}
            className="rounded-full"
          >
            <Mic className="w-5 h-5 text-muted-foreground hover:text-primary" />
          </Button>
        </div>
      )}

      {/* Content - Always Recall mode: Say this in French */}
      <div className="text-center space-y-6 w-full max-w-xl">
        <div className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
          Say this in French
        </div>
        <div className="text-2xl md:text-3xl font-medium">
          {phrase.prompt_en}
        </div>
        
        {/* Assist hints */}
        {assistHint.type !== 'none' && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
            {assistHint.type === 'first_chunk' && (
              <div className="text-lg text-muted-foreground italic">
                {assistHint.hint}
              </div>
            )}
            {assistHint.type === 'skeleton' && (
              <div className="text-xl font-mono">
                {assistHint.hint}
              </div>
            )}
            {assistLevel === 4 && (
              <div className="mt-2 text-sm text-muted-foreground">
                Try with microphone for feedback
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

