/**
 * Call Stage Timeline Component
 * Shows progress through call stages
 */

import { Check, Circle } from 'lucide-react';
import type { CallStage } from '@/lib/sales/types';

interface CallStageTimelineProps {
  currentStage: CallStage;
  stages: Array<{ id: CallStage; name: string; order: number }>;
}

export function CallStageTimeline({ currentStage, stages }: CallStageTimelineProps) {
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);
  const currentIndex = sortedStages.findIndex((s) => s.id === currentStage);

  return (
    <div className="flex items-center justify-between w-full px-4 py-3 bg-muted/50 rounded-lg">
      {sortedStages.map((stage, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = stage.id === currentStage;
        const isUpcoming = index > currentIndex;

        return (
          <div key={stage.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  isCompleted
                    ? 'bg-green-500 border-green-500 text-white'
                    : isCurrent
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'bg-background border-muted-foreground text-muted-foreground'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Circle className="w-4 h-4" />
                )}
              </div>
              <span
                className={`text-xs mt-2 text-center ${
                  isCurrent ? 'font-semibold' : 'text-muted-foreground'
                }`}
              >
                {stage.name}
              </span>
            </div>
            {index < sortedStages.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-2 ${
                  isCompleted ? 'bg-green-500' : 'bg-muted'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

