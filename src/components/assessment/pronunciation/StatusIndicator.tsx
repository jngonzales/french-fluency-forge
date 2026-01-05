/**
 * Status Indicator Component
 * Shows current processing stage with visual feedback
 */

import { Loader2, Check, Mic, Upload, Globe, Search, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type ProcessingStatus = 
  | 'idle'
  | 'recording'
  | 'recorded'
  | 'uploading'
  | 'processing'
  | 'analyzed'
  | 'complete'
  | 'error';

interface StatusIndicatorProps {
  status: ProcessingStatus;
  provider?: 'speechsuper' | 'azure' | null;
  className?: string;
}

export function StatusIndicator({ status, provider, className = '' }: StatusIndicatorProps) {
  const stages = [
    { 
      key: 'recording', 
      icon: Mic, 
      label: 'Recording', 
      active: status === 'recording',
      complete: ['recorded', 'uploading', 'processing', 'analyzed', 'complete'].includes(status),
    },
    { 
      key: 'recorded', 
      icon: Check, 
      label: 'Recorded', 
      active: status === 'recorded',
      complete: ['uploading', 'processing', 'analyzed', 'complete'].includes(status),
    },
    { 
      key: 'uploading', 
      icon: Upload, 
      label: 'Sending', 
      active: status === 'uploading',
      complete: ['processing', 'analyzed', 'complete'].includes(status),
    },
    { 
      key: 'processing', 
      icon: Globe, 
      label: provider === 'speechsuper' ? 'SpeechSuper' : provider === 'azure' ? 'Azure' : 'API Call', 
      active: status === 'processing',
      complete: ['analyzed', 'complete'].includes(status),
    },
    { 
      key: 'analyzed', 
      icon: Search, 
      label: 'Analyzing', 
      active: status === 'analyzed',
      complete: status === 'complete',
    },
    { 
      key: 'complete', 
      icon: Sparkles, 
      label: 'Ready', 
      active: status === 'complete',
      complete: status === 'complete',
    },
  ];

  return (
    <div className={`flex items-center justify-center gap-1 ${className}`}>
      {stages.map((stage, idx) => {
        const Icon = stage.icon;
        const isActive = stage.active;
        const isComplete = stage.complete;
        const isCurrent = isActive;

        return (
          <div key={stage.key} className="flex items-center">
            {/* Stage */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all
                  ${isCurrent ? 'border-primary bg-primary text-primary-foreground animate-pulse' : ''}
                  ${isComplete && !isCurrent ? 'border-green-500 bg-green-500/20 text-green-600' : ''}
                  ${!isComplete && !isCurrent ? 'border-muted bg-muted text-muted-foreground' : ''}
                `}
              >
                {isCurrent && !isComplete ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isComplete ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <span className={`text-xs mt-1 ${isCurrent ? 'font-bold' : 'text-muted-foreground'}`}>
                {stage.label}
              </span>
            </div>

            {/* Connector */}
            {idx < stages.length - 1 && (
              <div
                className={`
                  w-6 h-0.5 mb-6 transition-colors
                  ${isComplete ? 'bg-green-500' : 'bg-muted'}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Compact status badge (for use in headers)
 */
export function StatusBadge({ status, provider }: StatusIndicatorProps) {
  const labels: Record<ProcessingStatus, string> = {
    idle: 'Ready',
    recording: 'Recording...',
    recorded: 'Recorded ✓',
    uploading: 'Uploading...',
    processing: provider === 'speechsuper' ? 'Analyzing with SpeechSuper...' : 
                provider === 'azure' ? 'Analyzing with Azure...' : 
                'Processing...',
    analyzed: 'Analyzed ✓',
    complete: 'Complete ✓',
    error: 'Error',
  };

  const variant = 
    status === 'complete' ? 'default' :
    status === 'error' ? 'destructive' :
    'secondary';

  return (
    <Badge variant={variant} className="text-xs">
      {labels[status]}
    </Badge>
  );
}

