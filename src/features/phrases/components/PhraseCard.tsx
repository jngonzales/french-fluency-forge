/**
 * Phrase Card Component
 * Displays the prompt (recall or recognition mode)
 */

import { Play, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Phrase } from '../types';

interface PhraseCardProps {
  phrase: Phrase;
  showSpeechIcon?: boolean;
  onStartSpeech?: () => void;
}

export function PhraseCard({ phrase, showSpeechIcon, onStartSpeech }: PhraseCardProps) {
  const isRecall = phrase.mode === 'recall';

  return (
    <div className="relative bg-card border border-border rounded-lg p-8 shadow-sm min-h-[300px] flex flex-col items-center justify-center">
      {/* Mode badge */}
      <div className="absolute top-4 left-4">
        <Badge variant={isRecall ? 'default' : 'secondary'}>
          {isRecall ? 'Recall' : 'Recognition'}
        </Badge>
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

      {/* Content */}
      <div className="text-center space-y-6 w-full max-w-xl">
        {isRecall ? (
          // Recall: Show English prompt
          <>
            <div className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
              Say this in French
            </div>
            <div className="text-2xl md:text-3xl font-medium">
              {phrase.prompt_en}
            </div>
          </>
        ) : (
          // Recognition: Show audio player
          <>
            <div className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
              Listen and understand
            </div>
            <Button
              size="lg"
              variant="outline"
              className="w-full max-w-sm h-20 text-lg"
              disabled
            >
              <Play className="w-6 h-6 mr-3" />
              Tap to play audio
            </Button>
            <div className="text-xs text-muted-foreground">
              <Badge variant="secondary" className="font-normal">
                Audio coming in v1
              </Badge>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

