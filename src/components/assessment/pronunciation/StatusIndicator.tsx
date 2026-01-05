/**
 * Status Indicator Component
 * Shows current processing stage with visual feedback
 */

import { Loader2, Check, Mic, Wand2, Brain, Sparkles, Stars, Zap } from 'lucide-react';
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
  devMode?: boolean;
}

export function StatusIndicator({ status, provider, className = '', devMode = false }: StatusIndicatorProps) {
  // Whimsical user-facing labels vs dev labels
  const getStages = () => {
    if (devMode) {
      // Technical/dev labels
      return [
        { key: 'recording', icon: Mic, label: 'Recording' },
        { key: 'recorded', icon: Check, label: 'Recorded' },
        { key: 'uploading', icon: Zap, label: 'Sending' },
        { key: 'processing', icon: Brain, label: provider === 'speechsuper' ? 'SpeechSuper' : provider === 'azure' ? 'Azure' : 'API Call' },
        { key: 'analyzed', icon: Wand2, label: 'Analyzing' },
        { key: 'complete', icon: Sparkles, label: 'Ready' },
      ];
    } else {
      // Whimsical user-facing labels ✨
      return [
        { key: 'recording', icon: Mic, label: 'Listening...' },
        { key: 'recorded', icon: Wand2, label: 'Processing' },
        { key: 'uploading', icon: Brain, label: 'Understanding' },
        { key: 'processing', icon: Zap, label: 'Analyzing' },
        { key: 'analyzed', icon: Stars, label: 'Almost there' },
        { key: 'complete', icon: Sparkles, label: 'Magic! ✨' },
      ];
    }
  };

  const stages = getStages().map(stage => ({
    ...stage,
    active: status === stage.key,
    complete: getCompleteStatuses(stage.key).includes(status),
  }));

  function getCompleteStatuses(key: string): ProcessingStatus[] {
    const order: ProcessingStatus[] = ['recording', 'recorded', 'uploading', 'processing', 'analyzed', 'complete'];
    const idx = order.indexOf(key as ProcessingStatus);
    return order.slice(idx + 1);
  }

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
export function StatusBadge({ status, provider, devMode = false }: StatusIndicatorProps) {
  const devLabels: Record<ProcessingStatus, string> = {
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

  const userLabels: Record<ProcessingStatus, string> = {
    idle: 'Ready',
    recording: '🎤 Listening...',
    recorded: '✨ Got it!',
    uploading: '🧠 Processing...',
    processing: '⚡ Analyzing...',
    analyzed: '🌟 Almost done...',
    complete: '✨ Done!',
    error: 'Oops!',
  };

  const labels = devMode ? devLabels : userLabels;

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

