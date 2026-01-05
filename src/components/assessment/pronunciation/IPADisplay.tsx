/**
 * IPA Display Component
 * Shows French text with IPA notation
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

interface IPADisplayProps {
  textFr: string;
  ipa: string;
  targetPhonemes?: string[];
  showTargets?: boolean;
  className?: string;
}

export function IPADisplay({ 
  textFr, 
  ipa, 
  targetPhonemes = [], 
  showTargets = true,
  className = '' 
}: IPADisplayProps) {
  return (
    <Card className={`border-primary/30 ${className}`}>
      <CardContent className="pt-6 space-y-4">
        {/* French Text */}
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-1">French:</div>
          <div className="text-3xl font-bold leading-relaxed">
            {textFr}
          </div>
        </div>

        {/* IPA Notation */}
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-1 flex items-center justify-center gap-1">
            <span>IPA Notation:</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-3 w-3" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    International Phonetic Alphabet - shows the sounds, not the spelling.
                    Focus on matching these sounds when you speak.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-2xl font-mono text-primary/80 leading-relaxed">
            {ipa}
          </div>
        </div>

        {/* Target Phonemes */}
        {showTargets && targetPhonemes.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center items-center pt-2 border-t">
            <span className="text-xs text-muted-foreground">Target sounds:</span>
            {targetPhonemes.map((phoneme, idx) => (
              <Badge key={idx} variant="outline" className="font-mono">
                /{phoneme}/
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact IPA Display (for smaller spaces)
 */
export function CompactIPADisplay({ textFr, ipa, className = '' }: IPADisplayProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="text-lg font-semibold">{textFr}</div>
      <div className="text-sm font-mono text-primary/70">{ipa}</div>
    </div>
  );
}

