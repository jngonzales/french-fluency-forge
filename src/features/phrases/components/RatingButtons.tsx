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
  disabled?: boolean;
}

export function RatingButtons({ onRate, intervals, disabled }: RatingButtonsProps) {
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
        const ButtonComponent = (
          <Button
            key={button.rating}
            variant={button.variant}
            size="lg"
            onClick={() => onRate(button.rating)}
            disabled={disabled}
            className={`h-16 text-lg font-medium ${button.className || ''}`}
          >
            <div className="flex flex-col items-center">
              <span>{button.label}</span>
              {intervals && (
                <span className="text-xs opacity-75 mt-1">
                  {intervals[button.rating]}
                </span>
              )}
            </div>
          </Button>
        );

        if (intervals) {
          return (
            <Tooltip key={button.rating}>
              <TooltipTrigger asChild>
                {ButtonComponent}
              </TooltipTrigger>
              <TooltipContent>
                <p>Next review: {intervals[button.rating]}</p>
              </TooltipContent>
            </Tooltip>
          );
        }

        return ButtonComponent;
      })}
    </div>
  );
}

