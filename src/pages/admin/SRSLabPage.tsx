/**
 * SRS QA Lab Page
 * Visual validation tool for FSRS scheduling correctness
 * Admin/Dev only
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminPadding } from '@/components/AdminPadding';
import { useAdminMode } from '@/hooks/useAdminMode';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Play, RotateCcw, Download, Save } from 'lucide-react';
import { calculateNextReviewFSRS, formatIntervalFSRS, getFSRSConfigFromSettings } from '@/features/phrases/data/fsrsScheduler';
import { usePhrasesSettings } from '@/features/phrases/hooks/usePhrasesSettings';
import type { MemberPhraseCard, Rating } from '@/features/phrases/types';
import { createNewCard } from './SRSLabHelpers';

export default function SRSLabPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAdminMode();
  const { settings } = usePhrasesSettings();
  
  // Simulator config
  const [fsrsVersion, setFsrsVersion] = useState<number>(6);
  const [requestRetention, setRequestRetention] = useState<number>(0.90);
  const [learningSteps, setLearningSteps] = useState<string>('1m,10m');
  const [relearningSteps, setRelearningSteps] = useState<string>('10m');
  const [enableFuzz, setEnableFuzz] = useState<boolean>(false);
  const [seed, setSeed] = useState<string>('');
  const [simNow, setSimNow] = useState<Date>(new Date());
  
  // Review script
  const [reviewScript, setReviewScript] = useState<Array<{ timeOffset: string; grade: Rating }>>([]);
  
  // Simulation results
  const [simulationResults, setSimulationResults] = useState<Array<{
    index: number;
    reviewedAt: Date;
    grade: Rating;
    stateBefore: string;
    stateAfter: string;
    stabilityBefore: number;
    stabilityAfter: number;
    difficultyBefore: number;
    difficultyAfter: number;
    intervalAfter: number;
    dueAfter: Date;
    overdue: boolean;
  }>>([]);
  
  // Current card state (for simulation)
  const [currentCardState, setCurrentCardState] = useState<MemberPhraseCard | null>(null);

  if (!isAdmin) {
    return (
      <AdminPadding>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground">This page is for admins only.</p>
          </div>
        </div>
      </AdminPadding>
    );
  }

  const runSimulation = () => {
    // Start with a new card
    let card = createNewCard();
    const results: typeof simulationResults = [];
    let currentTime = new Date(simNow);
    
    for (let i = 0; i < reviewScript.length; i++) {
      const event = reviewScript[i];
      
      // Parse time offset (e.g., "1m", "+4d")
      const offsetMs = parseTimeOffset(event.timeOffset);
      currentTime = new Date(currentTime.getTime() + offsetMs);
      
      // Store before state
      const stateBefore = card.scheduler.state;
      const stabilityBefore = card.scheduler.stability || 0;
      const difficultyBefore = card.scheduler.difficulty || 0;
      const dueBefore = new Date(card.scheduler.due_at);
      const wasOverdue = dueBefore < currentTime;
      
      // Apply rating
      const fsrsConfig = getFSRSConfigFromSettings({
        ...settings,
        target_retention: requestRetention,
      });
      
      const result = calculateNextReviewFSRS(card, event.grade, fsrsConfig, currentTime);
      card = result.card;
      
      // Store result
      results.push({
        index: i + 1,
        reviewedAt: currentTime,
        grade: event.grade,
        stateBefore,
        stateAfter: card.scheduler.state,
        stabilityBefore,
        stabilityAfter: card.scheduler.stability || 0,
        difficultyBefore,
        difficultyAfter: card.scheduler.difficulty || 0,
        intervalAfter: card.scheduler.interval_ms || 0,
        dueAfter: new Date(card.scheduler.due_at),
        overdue: wasOverdue,
      });
    }
    
    setSimulationResults(results);
    setCurrentCardState(card);
  };

  const parseTimeOffset = (offset: string): number => {
    // Parse "1m", "+4d", "-10m", etc.
    const match = offset.match(/^([+-]?)(\d+)([smhd])$/);
    if (!match) return 0;
    
    const sign = match[1] === '-' ? -1 : 1;
    const value = parseInt(match[2], 10);
    const unit = match[3];
    
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    
    return sign * value * multipliers[unit];
  };

  const addReviewEvent = () => {
    setReviewScript([...reviewScript, { timeOffset: '0m', grade: 'good' }]);
  };

  const removeReviewEvent = (index: number) => {
    setReviewScript(reviewScript.filter((_, i) => i !== index));
  };

  const updateReviewEvent = (index: number, field: 'timeOffset' | 'grade', value: string) => {
    const updated = [...reviewScript];
    updated[index] = { ...updated[index], [field]: value as any };
    setReviewScript(updated);
  };

  return (
    <AdminPadding>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/phrases')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <div>
                  <h1 className="text-2xl font-serif font-bold">SRS QA Lab</h1>
                  <p className="text-sm text-muted-foreground">
                    Visual validation tool for FSRS scheduling correctness
                  </p>
                </div>
              </div>
              <Badge variant="secondary">Admin Only</Badge>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs defaultValue="simulator" className="space-y-6">
            <TabsList>
              <TabsTrigger value="simulator">Simulator</TabsTrigger>
              <TabsTrigger value="live-cards">Live Cards</TabsTrigger>
            </TabsList>

            <TabsContent value="simulator" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Simulator Controls */}
                <Card>
                  <CardHeader>
                    <CardTitle>Simulator Configuration</CardTitle>
                    <CardDescription>
                      Configure FSRS parameters and build review script
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* FSRS Version */}
                    <div>
                      <Label>FSRS Version</Label>
                      <Select value={fsrsVersion.toString()} onValueChange={(v) => setFsrsVersion(parseInt(v, 10))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6">FSRS-6</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Request Retention */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Request Retention</Label>
                        <span className="text-sm font-medium">{(requestRetention * 100).toFixed(0)}%</span>
                      </div>
                      <Slider
                        value={[requestRetention]}
                        onValueChange={(v) => setRequestRetention(v[0])}
                        min={0.75}
                        max={0.95}
                        step={0.05}
                      />
                    </div>

                    {/* Learning Steps */}
                    <div>
                      <Label>Learning Steps</Label>
                      <Input
                        value={learningSteps}
                        onChange={(e) => setLearningSteps(e.target.value)}
                        placeholder="1m,10m"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Comma-separated: 1m,10m
                      </p>
                    </div>

                    {/* Relearning Steps */}
                    <div>
                      <Label>Relearning Steps</Label>
                      <Input
                        value={relearningSteps}
                        onChange={(e) => setRelearningSteps(e.target.value)}
                        placeholder="10m"
                      />
                    </div>

                    {/* Enable Fuzz */}
                    <div className="flex items-center justify-between">
                      <Label>Enable Fuzz</Label>
                      <Switch checked={enableFuzz} onCheckedChange={setEnableFuzz} />
                    </div>

                    {/* Seed */}
                    <div>
                      <Label>Deterministic Seed (optional)</Label>
                      <Input
                        value={seed}
                        onChange={(e) => setSeed(e.target.value)}
                        placeholder="card-id or custom seed"
                      />
                    </div>

                    {/* Quick Scenarios */}
                    <div>
                      <Label>Quick Scenarios</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const script: Array<{ timeOffset: string; grade: Rating }> = [];
                            for (let i = 0; i < 10; i++) {
                              script.push({ timeOffset: i === 0 ? '0m' : '1m', grade: 'again' });
                            }
                            setReviewScript(script);
                          }}
                        >
                          Again × 10
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setReviewScript([
                              { timeOffset: '0m', grade: 'again' },
                              { timeOffset: '1m', grade: 'good' },
                              { timeOffset: '10m', grade: 'good' },
                            ]);
                          }}
                        >
                          New → Learning
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setReviewScript([
                              { timeOffset: '0m', grade: 'good' },
                              { timeOffset: '7d', grade: 'again' },
                              { timeOffset: '10m', grade: 'good' },
                            ]);
                          }}
                        >
                          Review → Again
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setReviewScript([
                              { timeOffset: '0m', grade: 'good' },
                              { timeOffset: '7d', grade: 'good' },
                              { timeOffset: '21d', grade: 'good' },
                            ]);
                          }}
                        >
                          Gradual Success
                        </Button>
                      </div>
                    </div>

                    {/* Review Script */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Review Script</Label>
                        <Button size="sm" variant="outline" onClick={addReviewEvent}>
                          Add Event
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {reviewScript.map((event, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={event.timeOffset}
                              onChange={(e) => updateReviewEvent(index, 'timeOffset', e.target.value)}
                              placeholder="1m"
                              className="w-24"
                            />
                            <Select
                              value={event.grade}
                              onValueChange={(v) => updateReviewEvent(index, 'grade', v)}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="again">Again</SelectItem>
                                <SelectItem value="hard">Hard</SelectItem>
                                <SelectItem value="good">Good</SelectItem>
                                <SelectItem value="easy">Easy</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeReviewEvent(index)}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                        {reviewScript.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No review events. Click "Add Event" to start.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button onClick={runSimulation} className="flex-1">
                        <Play className="w-4 h-4 mr-2" />
                        Run Simulation
                      </Button>
                      <Button variant="outline" onClick={() => setReviewScript([])}>
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Right: Results */}
                <Card>
                  <CardHeader>
                    <CardTitle>Simulation Results</CardTitle>
                    <CardDescription>
                      Review log and card state evolution
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {simulationResults.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Run a simulation to see results
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Review Log Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left p-2">#</th>
                                <th className="text-left p-2">Time</th>
                                <th className="text-left p-2">Grade</th>
                                <th className="text-left p-2">State</th>
                                <th className="text-left p-2">Stability</th>
                                <th className="text-left p-2">Difficulty</th>
                                <th className="text-left p-2">Interval</th>
                                <th className="text-left p-2">Due</th>
                              </tr>
                            </thead>
                            <tbody>
                              {simulationResults.map((result) => (
                                <tr key={result.index} className="border-b">
                                  <td className="p-2">{result.index}</td>
                                  <td className="p-2">
                                    {result.reviewedAt.toLocaleTimeString()}
                                  </td>
                                  <td className="p-2">
                                    <Badge variant={result.grade === 'again' ? 'destructive' : 'default'}>
                                      {result.grade}
                                    </Badge>
                                  </td>
                                  <td className="p-2">
                                    {result.stateBefore} → {result.stateAfter}
                                  </td>
                                  <td className="p-2">
                                    {result.stabilityBefore.toFixed(2)} → {result.stabilityAfter.toFixed(2)}
                                  </td>
                                  <td className="p-2">
                                    {result.difficultyBefore.toFixed(2)} → {result.difficultyAfter.toFixed(2)}
                                  </td>
                                  <td className="p-2">
                                    {formatIntervalFSRS(result.intervalAfter)}
                                  </td>
                                  <td className="p-2">
                                    {result.dueAfter.toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Current Card State */}
                        {currentCardState && (
                          <div className="mt-4 p-4 bg-muted rounded-lg">
                            <h4 className="font-semibold mb-2">Final Card State</h4>
                            <div className="text-sm space-y-1">
                              <div>State: {currentCardState.scheduler.state}</div>
                              <div>Stability: {currentCardState.scheduler.stability?.toFixed(2)}</div>
                              <div>Difficulty: {currentCardState.scheduler.difficulty?.toFixed(2)}</div>
                              <div>Due: {new Date(currentCardState.scheduler.due_at).toLocaleString()}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="live-cards">
              <Card>
                <CardHeader>
                  <CardTitle>Live Cards</CardTitle>
                  <CardDescription>
                    View real cards from localStorage (v0) or Supabase (v1)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Live cards view coming soon. This will show real cards from the database.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminPadding>
  );
}

