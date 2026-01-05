/**
 * Rating Buttons Component
 * Four rating buttons with interval previews
 */

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Rating } from '../types';

interface RatingButtonsProps {
  onRate: (rating: Rating) => void;
  intervals?: Record<Rating, string>;
  exactDueDates?: Record<Rating, Date>; // For tooltips with exact timestamps
  previewIntervals?: Record<Rating, { due_at: string; interval_ms: number; label: string }>; // From schedule preview
  suggestedRating?: Rating; // Auto-assessed suggested rating
  disabled?: boolean;
}

export function RatingButtons({ onRate, intervals, exactDueDates, previewIntervals, suggestedRating, disabled }: RatingButtonsProps) {
  // Use preview intervals if available, fallback to intervals
  const displayIntervals = previewIntervals
    ? Object.fromEntries(
        Object.entries(previewIntervals).map(([key, value]) => [key, value.label])
      ) as Record<Rating, string>
    : intervals;
  
  const displayDueDates = previewIntervals
    ? Object.fromEntries(
        Object.entries(previewIntervals).map(([key, value]) => [key, new Date(value.due_at)])
      ) as Record<Rating, Date>
    : exactDueDates;
  // Format exact due date for tooltip
  const formatExactDueDate = (date: Date): string => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };
  const buttons: Array<{
    rating: Rating;
    label: string;
    variant: 'destructive' | 'outline' | 'default' | 'secondary';
    className?: string;
  }> = [
    {
      rating: 'again',
      label: 'Again',
      variant: 'destructive',
    },
    {
      rating: 'hard',
      label: 'Hard',
      variant: 'outline',
      className: 'border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:border-yellow-600 dark:text-yellow-500 dark:hover:bg-yellow-950',
    },
    {
      rating: 'good',
      label: 'Good',
      variant: 'default',
    },
    {
      rating: 'easy',
      label: 'Easy',
      variant: 'secondary',
      className: 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {buttons.map((button) => {
        const isSuggested = suggestedRating === button.rating;
        const ButtonComponent = (
          <Button
            key={button.rating}
            variant={button.variant}
            size="lg"
            onClick={() => onRate(button.rating)}
            disabled={disabled}
            className={`h-16 text-lg font-medium relative ${
              isSuggested ? 'ring-2 ring-primary ring-offset-2' : ''
            } ${button.className || ''}`}
          >
            <div className="flex flex-col items-center">
              <span>{button.label}</span>
              {isSuggested && (
                <span className="text-xs font-semibold text-primary mt-0.5">
                  Suggested
                </span>
              )}
              {displayIntervals && (
                <span className="text-xs opacity-75 mt-1">
                  {displayIntervals[button.rating]}
                </span>
              )}
            </div>
          </Button>
        );

        if (displayIntervals) {
          const intervalText = displayIntervals[button.rating];
          const exactDate = displayDueDates?.[button.rating];
          const tooltipText = exactDate 
            ? `Next review: ${intervalText}\nExact time: ${formatExactDueDate(exactDate)}`
            : `Next review: ${intervalText}`;
          
          return (
            <Tooltip key={button.rating}>
              <TooltipTrigger asChild>
                {ButtonComponent}
              </TooltipTrigger>
              <TooltipContent>
                <p className="whitespace-pre-line">{tooltipText}</p>
              </TooltipContent>
            </Tooltip>
          );
        }

        return ButtonComponent;
      })}
    </div>
  );
}

