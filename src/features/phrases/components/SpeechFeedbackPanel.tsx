/**
 * Speech Feedback Panel Component
 * Mock speech feedback UI for v0
 */

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';
import { useState } from 'react';

interface SpeechFeedbackPanelProps {
  enabled: boolean;
}

export function SpeechFeedbackPanel({ enabled }: SpeechFeedbackPanelProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);

  if (!enabled) return null;

  const handleStartRecording = () => {
    setIsRecording(true);
    // Simulate recording for 2 seconds
    setTimeout(() => {
      setIsRecording(false);
      setHasRecorded(true);
    }, 2000);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setHasRecorded(true);
  };

  // Mock transcript data
  const mockTranscript = 'Comment ça va';
  const mockTokens = [
    { text: 'Comment', matched: true },
    { text: 'ça', matched: true },
    { text: 'va', matched: true },
  ];
  const mockSimilarity = 0.95;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-lg p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Speech Feedback</div>
        <Badge variant="secondary" className="font-normal">
          Mock (v0)
        </Badge>
      </div>

      {!hasRecorded ? (
        <div className="text-center py-4">
          <Button
            size="lg"
            variant={isRecording ? 'destructive' : 'outline'}
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            className="rounded-full w-16 h-16"
          >
            {isRecording ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </Button>
          <div className="text-sm text-muted-foreground mt-2">
            {isRecording ? 'Recording...' : 'Tap to record'}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Transcript */}
          <div>
            <div className="text-xs text-muted-foreground mb-1">Your speech:</div>
            <div className="flex flex-wrap gap-1">
              {mockTokens.map((token, i) => (
                <span
                  key={i}
                  className={`px-2 py-1 rounded text-sm ${
                    token.matched
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}
                >
                  {token.text}
                </span>
              ))}
            </div>
          </div>

          {/* Similarity score */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Match:</span>
            <span className="font-medium text-green-600 dark:text-green-400">
              {(mockSimilarity * 100).toFixed(0)}%
            </span>
          </div>

          {/* Reset */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setHasRecorded(false);
              setIsRecording(false);
            }}
            className="w-full"
          >
            Try again
          </Button>
        </div>
      )}
    </motion.div>
  );
}

