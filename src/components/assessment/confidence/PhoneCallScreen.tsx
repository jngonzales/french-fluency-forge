/**
 * Phone Call Screen
 * 
 * Visual phone interface for the confidence assessment call simulation.
 * Shows bot speaking state, user recording state, and call progress.
 */

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, PhoneCall, Mic, MicOff, Loader2 } from 'lucide-react';
import { TurnRecording } from './TurnRecording';
import type { ConfidenceScenario, ScenarioTurn } from './types';

interface PhoneCallScreenProps {
  scenario: ConfidenceScenario;
  currentTurn: ScenarioTurn;
  turnNumber: number;
  totalTurns: number;
  phase: 'loading' | 'bot-speaking' | 'waiting-for-user' | 'user-recording' | 'processing' | 'completed';
  isBotSpeaking: boolean;
  onStartRecording: () => void;
  onRecordingComplete: (blob: Blob, startTs: Date, endTs: Date) => void;
  onTextSubmit?: (text: string) => void;
  devMode?: boolean;
}

export function PhoneCallScreen({
  scenario,
  currentTurn,
  turnNumber,
  totalTurns,
  phase,
  isBotSpeaking,
  onStartRecording,
  onRecordingComplete,
  onTextSubmit,
  devMode = false
}: PhoneCallScreenProps) {
  
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Call Header */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full ${
                isBotSpeaking 
                  ? 'bg-green-500 animate-pulse' 
                  : phase === 'user-recording' 
                  ? 'bg-red-500 animate-pulse'
                  : 'bg-muted'
              }`}>
                <Phone className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{scenario.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Turn {turnNumber} of {totalTurns}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-xs text-muted-foreground mb-1">Tier {scenario.tier}</div>
              <div className="flex items-center gap-2 text-sm">
                {phase === 'bot-speaking' && (
                  <>
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-green-600 dark:text-green-400">Agent speaking...</span>
                  </>
                )}
                {phase === 'waiting-for-user' && (
                  <>
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
                    <span className="text-amber-600 dark:text-amber-400">Your turn</span>
                  </>
                )}
                {phase === 'user-recording' && (
                  <>
                    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="text-red-600 dark:text-red-400">Recording</span>
                  </>
                )}
                {phase === 'processing' && (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="text-muted-foreground">Processing...</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bot Speaking Display */}
      {(phase === 'bot-speaking' || isBotSpeaking) && (
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-full bg-primary/10 shrink-0">
                <PhoneCall className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium mb-2">Agent:</div>
                <p className="text-base leading-relaxed">{currentTurn.botScript}</p>
                {!devMode && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex gap-1">
                      <div className="h-1 w-1 rounded-full bg-primary animate-bounce"></div>
                      <div className="h-1 w-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="h-1 w-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span>Speaking...</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Recording Interface */}
      {(phase === 'waiting-for-user' || phase === 'user-recording' || phase === 'processing') && (
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium mb-1">Your Response</h4>
                  <p className="text-sm text-muted-foreground">
                    {currentTurn.objective}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  ~{currentTurn.expectedDuration}s
                </div>
              </div>

              <TurnRecording
                turnNumber={currentTurn.turnNumber}
                expectedDuration={currentTurn.expectedDuration}
                isRecording={phase === 'user-recording'}
                isProcessing={phase === 'processing'}
                onStart={onStartRecording}
                onComplete={onRecordingComplete}
                onTextSubmit={onTextSubmit}
                devMode={devMode}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Turn Objective Hint */}
      {phase === 'waiting-for-user' && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              <div className="h-5 w-5 rounded-full bg-amber-500/20 flex items-center justify-center">
                <span className="text-xs font-medium text-amber-700 dark:text-amber-400">!</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
                What to do:
              </div>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {currentTurn.objective}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dev Mode Info */}
      {devMode && (
        <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground text-center">
          Dev Mode: Audio skipped, text input enabled
        </div>
      )}
    </div>
  );
}

