/**
 * Session Header Component
 * Shows progress, time estimate, and navigation
 */

import { ArrowLeft, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';

interface SessionHeaderProps {
  completed: number;
  total: number;
  estimatedTimeLeft: number; // seconds
}

export function SessionHeader({ completed, total, estimatedTimeLeft }: SessionHeaderProps) {
  const navigate = useNavigate();
  const progress = total > 0 ? (completed / total) * 100 : 0;
  
  const formatTime = (seconds: number): string => {
    const mins = Math.ceil(seconds / 60);
    return `~${mins} min left`;
  };

  return (
    <div className="border-b border-border bg-card">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/phrases')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-center flex-1 mx-4">
            <div className="text-sm font-medium">
              {completed} / {total}
            </div>
            <div className="text-xs text-muted-foreground">
              {estimatedTimeLeft > 0 ? formatTime(estimatedTimeLeft) : 'Almost done!'}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/phrases/settings')}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
    </div>
  );
}

