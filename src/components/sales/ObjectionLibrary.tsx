/**
 * Objection Library Component
 * One-click buttons for objection handling
 */

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Objection } from '@/lib/sales/types';

interface ObjectionLibraryProps {
  objections: Objection[];
  onAddToNotes?: (text: string) => void;
}

export function ObjectionLibrary({ objections, onAddToNotes }: ObjectionLibraryProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Objections</h3>
      <div className="grid grid-cols-2 gap-2">
        {objections.map((objection) => (
          <ObjectionButton
            key={objection.id}
            objection={objection}
            onAddToNotes={onAddToNotes}
          />
        ))}
      </div>
    </div>
  );
}

function ObjectionButton({
  objection,
  onAddToNotes,
}: {
  objection: Objection;
  onAddToNotes?: (text: string) => void;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs">
          {objection.label}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{objection.label}</SheetTitle>
          <SheetDescription>Talk track and handling</SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-100px)] mt-6">
          <div className="space-y-6">
            {/* Empathy */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Empathy</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {objection.empathy.map((line, i) => (
                  <li key={i}>• {line}</li>
                ))}
              </ul>
            </div>

            {/* Diagnostic Questions */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Diagnostic Questions</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {objection.diagnosticQuestions.map((q, i) => (
                  <li key={i}>• {q}</li>
                ))}
              </ul>
            </div>

            {/* Reframes */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Reframes</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {objection.reframes.map((reframe, i) => (
                  <li key={i}>• {reframe}</li>
                ))}
              </ul>
            </div>

            {/* Proof Angles */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Proof Angles</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {objection.proofAngles.map((angle, i) => (
                  <li key={i}>• {angle}</li>
                ))}
              </ul>
            </div>

            {/* Close Questions */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Close Questions</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {objection.closeQuestions.map((q, i) => (
                  <li key={i}>• {q}</li>
                ))}
              </ul>
            </div>

            {onAddToNotes && (
              <Button
                variant="outline"
                onClick={() => {
                  const text = `Objection: ${objection.label}\n\nEmpathy: ${objection.empathy[0]}\n\nDiagnostic: ${objection.diagnosticQuestions[0]}\n\nReframe: ${objection.reframes[0]}\n\nClose: ${objection.closeQuestions[0]}`;
                  onAddToNotes(text);
                }}
              >
                Add to Notes
              </Button>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

