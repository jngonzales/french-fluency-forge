/**
 * Call Screen Component
 * Main workspace for running sales calls
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { QualificationMeter } from './QualificationMeter';
import { CallStageTimeline } from './CallStageTimeline';
import { ObjectionLibrary } from './ObjectionLibrary';
import { ClosePanel } from './ClosePanel';
import {
  calculateQualificationScore,
  getNextQuestion,
  getAllObjections,
} from '@/lib/sales/decisionEngine';
import { updateCall, fetchCall } from '@/lib/sales/api';
import { useAuth } from '@/contexts/AuthContext';
import type {
  Call,
  Lead,
  PlaybookData,
  Question,
  QualificationResult,
  NextQuestionResult,
} from '@/lib/sales/types';
import { toast } from 'sonner';

interface CallScreenProps {
  call: Call;
  lead: Lead;
  playbook: PlaybookData;
  onCallUpdate: (call: Call) => void;
}

export function CallScreen({ call, lead, playbook, onCallUpdate }: CallScreenProps) {
  const { user } = useAuth();
  const [notes, setNotes] = useState(call.transcript_notes || '');
  const [tags, setTags] = useState<string[]>(call.tags || []);
  const [nextQuestion, setNextQuestion] = useState<NextQuestionResult | null>(null);
  const [qualification, setQualification] = useState<QualificationResult | null>(null);
  const [freeTextAnswer, setFreeTextAnswer] = useState('');
  const [numberAnswer, setNumberAnswer] = useState('');

  // Load initial state
  useEffect(() => {
    const result = getNextQuestion(playbook, call);
    setNextQuestion(result);
    const qual = calculateQualificationScore(playbook, call);
    setQualification(qual);
  }, [call, playbook]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Number keys 1-6 for answer buttons
      if (e.key >= '1' && e.key <= '6' && nextQuestion?.question.options) {
        const index = parseInt(e.key) - 1;
        if (index < nextQuestion.question.options.length) {
          handleAnswer(nextQuestion.question.options[index].value);
        }
      }
      // N for next (if no options)
      if (e.key === 'n' && nextQuestion && !nextQuestion.question.options) {
        handleFreeTextSubmit();
      }
      // O for objections (open panel)
      if (e.key === 'o') {
        // Could open objection panel
      }
      // S for summary
      if (e.key === 's' && e.ctrlKey) {
        generateSummary();
      }
      // C for close panel
      if (e.key === 'c' && e.ctrlKey) {
        // Close panel toggle
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [nextQuestion]);

  const handleAnswer = async (value: string) => {
    if (!nextQuestion || !user) return;

    const question = nextQuestion.question;
    const option = question.options?.find((o) => o.value === value);

    // Add answer
    const newAnswer = {
      questionId: question.id,
      questionText: question.text,
      selectedOption: value,
      freeText: undefined,
      timestamp: new Date().toISOString(),
    };

    const updatedAnswers = [...call.answers, newAnswer];

    // Add tags from option
    const newTags = [...tags];
    if (option?.tags) {
      option.tags.forEach((tag) => {
        if (!newTags.includes(tag)) {
          newTags.push(tag);
        }
      });
    }

    // Update call
    const updatedCall: Call = {
      ...call,
      answers: updatedAnswers,
      tags: newTags,
    };

    // Recalculate qualification
    const newQual = calculateQualificationScore(playbook, updatedCall);

    // Get next question
    const next = getNextQuestion(playbook, updatedCall);

    // Update stage if needed
    if (next?.canAdvance) {
      // Stage progression handled by decision engine
    }

    // Save to database
    try {
      const saved = await updateCall(call.id, {
        answers: updatedAnswers,
        tags: newTags,
        qualification_score: newQual.score,
        qualification_reason: newQual.reason,
      });
      onCallUpdate(saved);
      setNextQuestion(next);
      setQualification(newQual);
      setTags(newTags);
    } catch (error) {
      console.error('Error saving answer:', error);
      toast.error('Failed to save answer');
    }
  };

  const handleFreeTextSubmit = async () => {
    if (!nextQuestion || !user || !freeTextAnswer.trim()) return;

    const question = nextQuestion.question;

    const newAnswer = {
      questionId: question.id,
      questionText: question.text,
      selectedOption: undefined,
      freeText: freeTextAnswer,
      timestamp: new Date().toISOString(),
    };

    const updatedAnswers = [...call.answers, newAnswer];
    const updatedCall: Call = {
      ...call,
      answers: updatedAnswers,
    };

    // Recalculate (tags may be added from free text)
    const newQual = calculateQualificationScore(playbook, updatedCall);
    const next = getNextQuestion(playbook, updatedCall);

    try {
      const saved = await updateCall(call.id, {
        answers: updatedAnswers,
        tags: updatedCall.tags,
        qualification_score: newQual.score,
        qualification_reason: newQual.reason,
      });
      onCallUpdate(saved);
      setNextQuestion(next);
      setQualification(newQual);
      setTags(updatedCall.tags);
      setFreeTextAnswer('');
    } catch (error) {
      console.error('Error saving answer:', error);
      toast.error('Failed to save answer');
    }
  };

  const handleNumberSubmit = async () => {
    if (!nextQuestion || !user || !numberAnswer) return;

    await handleAnswer(numberAnswer);
    setNumberAnswer('');
  };

  const handleNotesUpdate = async (newNotes: string) => {
    setNotes(newNotes);
    try {
      await updateCall(call.id, { transcript_notes: newNotes });
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  };

  const handleTagToggle = async (tag: string) => {
    const newTags = tags.includes(tag)
      ? tags.filter((t) => t !== tag)
      : [...tags, tag];

    setTags(newTags);
    try {
      await updateCall(call.id, { tags: newTags });
    } catch (error) {
      console.error('Error saving tags:', error);
    }
  };

  const generateSummary = () => {
    // Simple summary generation (could be enhanced with LLM later)
    const summary = `Call Summary:
    
Lead: ${lead.name || lead.email}
Stage: ${call.stage}
Score: ${qualification?.score || 0}/100

Key Points:
${notes}

Tags: ${tags.join(', ')}
`;
    toast.info('Summary generated (check notes)');
    handleNotesUpdate(summary);
  };

  const objections = getAllObjections(playbook);

  return (
    <div className="space-y-4 h-[calc(100vh-200px)] flex flex-col">
      {/* Qualification Meter */}
      {qualification && <QualificationMeter qualification={qualification} />}

      {/* Main Content - 3 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 overflow-hidden">
        {/* Left: Lead Snapshot */}
        <div className="lg:col-span-3 space-y-2 overflow-y-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lead Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <p className="font-medium">{lead.name || 'Unnamed'}</p>
                {lead.email && (
                  <p className="text-muted-foreground">{lead.email}</p>
                )}
              </div>
              {lead.goal && (
                <div>
                  <p className="font-medium">Goal</p>
                  <p className="text-muted-foreground">{lead.goal}</p>
                </div>
              )}
              {lead.time_available_per_week !== undefined && (
                <div>
                  <p className="font-medium">Time</p>
                  <p className="text-muted-foreground">
                    {lead.time_available_per_week} hrs/week
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Center: Next Question */}
        <div className="lg:col-span-6 space-y-4 overflow-y-auto">
          {nextQuestion ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">{nextQuestion.question.text}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {nextQuestion.whyThisQuestion}
                </p>
                {nextQuestion.listenFor.length > 0 && (
                  <div>
                    <p className="text-xs font-medium">Listen for:</p>
                    <ul className="text-xs text-muted-foreground list-disc list-inside">
                      {nextQuestion.listenFor.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Answer Options */}
                {nextQuestion.question.options && (
                  <div className="space-y-2">
                    {nextQuestion.question.options.map((option, index) => (
                      <Button
                        key={option.value}
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => handleAnswer(option.value)}
                      >
                        <span className="mr-2 font-mono">{index + 1}</span>
                        {option.label}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Free Text Input */}
                {nextQuestion.question.type === 'free_text' && (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Type your notes here..."
                      value={freeTextAnswer}
                      onChange={(e) => setFreeTextAnswer(e.target.value)}
                      rows={4}
                    />
                    <Button onClick={handleFreeTextSubmit} disabled={!freeTextAnswer.trim()}>
                      Submit (N)
                    </Button>
                  </div>
                )}

                {/* Number Input */}
                {nextQuestion.question.type === 'number' && (
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="Enter number..."
                      value={numberAnswer}
                      onChange={(e) => setNumberAnswer(e.target.value)}
                      min={nextQuestion.question.constraints?.min}
                      max={nextQuestion.question.constraints?.max}
                    />
                    <Button onClick={handleNumberSubmit} disabled={!numberAnswer}>
                      Submit
                    </Button>
                  </div>
                )}

                {/* Scale Input */}
                {nextQuestion.question.type === 'scale' && (
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder={`Scale 1-${nextQuestion.question.constraints?.max}`}
                      value={numberAnswer}
                      onChange={(e) => setNumberAnswer(e.target.value)}
                      min={nextQuestion.question.constraints?.min}
                      max={nextQuestion.question.constraints?.max}
                    />
                    <Button onClick={handleNumberSubmit} disabled={!numberAnswer}>
                      Submit
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No more questions. Call complete.
              </CardContent>
            </Card>
          )}

          {/* Close Panel */}
          {qualification?.shouldClose && (
            <ClosePanel
              qualification={qualification}
              playbook={playbook}
              onMarkWon={async () => {
                await updateCall(call.id, { outcome: 'won' });
                toast.success('Marked as won');
              }}
              onMarkLost={async () => {
                await updateCall(call.id, { outcome: 'lost' });
                toast.success('Marked as lost');
              }}
            />
          )}
        </div>

        {/* Right: Notes, Tags, Objections */}
        <div className="lg:col-span-3 space-y-4 overflow-y-auto">
          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Call notes..."
                value={notes}
                onChange={(e) => handleNotesUpdate(e.target.value)}
                rows={8}
              />
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {playbook.tags.qualification
                .concat(playbook.tags.blockers)
                .map((tag) => (
                  <div key={tag} className="flex items-center space-x-2">
                    <Checkbox
                      id={tag}
                      checked={tags.includes(tag)}
                      onCheckedChange={() => handleTagToggle(tag)}
                    />
                    <Label htmlFor={tag} className="text-sm cursor-pointer">
                      {tag}
                    </Label>
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* Objections */}
          <ObjectionLibrary
            objections={objections}
            onAddToNotes={(text) => handleNotesUpdate(notes + '\n\n' + text)}
          />
        </div>
      </div>

      {/* Bottom: Stage Timeline */}
      <CallStageTimeline
        currentStage={call.stage}
        stages={playbook.stages.map((s) => ({
          id: s.id as any,
          name: s.name,
          order: s.order,
        }))}
      />
    </div>
  );
}

