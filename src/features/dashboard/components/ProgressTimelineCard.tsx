/**
 * Progress Timeline Card
 * Shows actual + projected scores with goal overlays
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import { generateTimelineSeries, generateGoalTrajectory } from '../data/projections';
import type {
  MetricKey,
  TimeRange,
  Goal,
  AssessmentSnapshot,
  TimelineSeries,
} from '../types';

interface ProgressTimelineCardProps {
  timeline: TimelineSeries[];
  selectedMetric: MetricKey;
  selectedRange: TimeRange;
  selectedGoalId: string | null;
  goals: Goal[];
  onMetricChange: (metric: MetricKey) => void;
  onRangeChange: (range: TimeRange) => void;
  onGoalChange: (goalId: string | null) => void;
  assessments: AssessmentSnapshot[];
}

export function ProgressTimelineCard({
  timeline,
  selectedMetric,
  selectedRange,
  selectedGoalId,
  goals,
  onMetricChange,
  onRangeChange,
  onGoalChange,
  assessments,
}: ProgressTimelineCardProps) {
  const selectedGoal = goals.find((g) => g.id === selectedGoalId);

  // Generate dummy data if no assessments
  const useDummyData = assessments.length === 0;
  let dummyAssessments: AssessmentSnapshot[] = [];
  
  if (useDummyData) {
    // Generate dummy data for the last 30 days
    const today = new Date();
    for (let i = 29; i >= 0; i -= 3) { // Every 3 days
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const baseScore = 45 + (29 - i) * 0.8 + Math.random() * 5; // Gradual improvement with noise
      dummyAssessments.push({
        sessionId: `dummy-${i}`,
        date: date.toISOString().split('T')[0],
        overall: Math.round(Math.min(100, baseScore)),
        dimensions: {
          pronunciation: Math.round(Math.min(100, baseScore + Math.random() * 10 - 5)),
          fluency: Math.round(Math.min(100, baseScore + Math.random() * 10 - 5)),
          confidence: Math.round(Math.min(100, baseScore + Math.random() * 10 - 5)),
          syntax: Math.round(Math.min(100, baseScore + Math.random() * 10 - 5)),
          conversation: Math.round(Math.min(100, baseScore + Math.random() * 10 - 5)),
          comprehension: Math.round(Math.min(100, baseScore + Math.random() * 10 - 5)),
        },
      });
    }
  }
  
  const assessmentsToUse = useDummyData ? dummyAssessments : assessments;

  // Generate timeline data for selected metric
  const daysCount = selectedRange === '7d' ? 7 : selectedRange === '30d' ? 30 : 90;
  const timelineSeries = generateTimelineSeries(assessmentsToUse, selectedMetric, daysCount);

  // Combine actual and projected data
  const chartData: any[] = [];

  // Add actual points
  timelineSeries.actual.forEach((point) => {
    chartData.push({
      date: point.date,
      actual: point.value,
      projected: null,
      low: null,
      high: null,
    });
  });

  // Add projected points
  timelineSeries.projected.mid.forEach((point, index) => {
    chartData.push({
      date: point.date,
      actual: null,
      projected: point.value,
      low: timelineSeries.projected.low[index]?.value,
      high: timelineSeries.projected.high[index]?.value,
    });
  });

  // Sort by date
  chartData.sort((a, b) => a.date.localeCompare(b.date));

  // Generate goal trajectory if applicable
  let goalTrajectory: any[] = [];
  if (selectedGoal && timelineSeries.actual.length > 0) {
    const lastActual = timelineSeries.actual[timelineSeries.actual.length - 1];
    const trajectory = generateGoalTrajectory(
      lastActual.date,
      lastActual.value,
      selectedGoal.deadline,
      selectedGoal.targetScore || 100
    );

    goalTrajectory = trajectory.map((point) => ({
      date: point.date,
      goalTrajectory: point.value,
    }));

    // Merge with chart data
    goalTrajectory.forEach((gt) => {
      const existing = chartData.find((cd) => cd.date === gt.date);
      if (existing) {
        existing.goalTrajectory = gt.goalTrajectory;
      } else {
        chartData.push({ ...gt, actual: null, projected: null });
      }
    });

    // Re-sort
    chartData.sort((a, b) => a.date.localeCompare(b.date));
  }

  const metricLabels: Record<MetricKey, string> = {
    overall: 'Overall Progress',
    pronunciation: 'Pronunciation',
    fluency: 'Fluency',
    confidence: 'Confidence',
    syntax: 'Syntax',
    conversation: 'Conversation',
    comprehension: 'Comprehension',
    phrases_known_recall: 'My Phrases (Recall)',
    phrases_known_recognition: 'My Phrases (Recognition)',
    ai_words_spoken: 'AI Tutor Practice',
  };

  return (
    <Card className="border-border bg-card shadow-sm overflow-hidden w-full">
      <CardHeader className="pb-6 bg-muted/30 border-b border-border/50">
        <div className="flex items-center justify-between flex-wrap gap-6">
          <div>
            <CardTitle className="text-2xl font-serif">Progress Journey</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Tracking your {metricLabels[selectedMetric]} evolution
              {useDummyData && (
                <span className="ml-2 text-xs italic">(Demo data - complete assessment to see real progress)</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Metric Selector */}
            <Select value={selectedMetric} onValueChange={(v) => onMetricChange(v as MetricKey)}>
              <SelectTrigger className="w-56 h-10 font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overall" className="font-bold">Overall Mastery</SelectItem>
                <SelectItem value="pronunciation">Pronunciation</SelectItem>
                <SelectItem value="fluency">Fluency</SelectItem>
                <SelectItem value="confidence">Confidence</SelectItem>
                <SelectItem value="syntax">Syntax</SelectItem>
                <SelectItem value="conversation">Conversation</SelectItem>
                <SelectItem value="comprehension">Comprehension</SelectItem>
              </SelectContent>
            </Select>

            {/* Range Selector */}
            <Tabs value={selectedRange} onValueChange={(v) => onRangeChange(v as TimeRange)} className="h-10">
              <TabsList className="bg-muted/50 p-1">
                <TabsTrigger value="7d" className="text-xs font-bold px-4">7D</TabsTrigger>
                <TabsTrigger value="30d" className="text-xs font-bold px-4">30D</TabsTrigger>
                <TabsTrigger value="90d" className="text-xs font-bold px-4">90D</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Goal Overlay Selector */}
            {goals.length > 0 && (
              <Select
                value={selectedGoalId || 'none'}
                onValueChange={(v) => onGoalChange(v === 'none' ? null : v)}
              >
                <SelectTrigger className="w-56 h-10 font-medium border-dashed">
                  <SelectValue placeholder="Target Goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No target</SelectItem>
                  {goals.map((goal) => (
                    <SelectItem key={goal.id} value={goal.id}>
                      {goal.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-10 pr-8">
        <ResponsiveContainer width="100%" height={450}>
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }}
              dy={10}
              tickFormatter={(date) => {
                const d = new Date(date);
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }}
            />
            <YAxis 
              domain={[0, 100]} 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }}
              dx={-10}
              tickFormatter={(val) => `${val}%`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="bg-white/95 backdrop-blur-sm border border-border shadow-xl rounded-xl p-4 min-w-[160px]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 pb-2 border-b border-border/50">
                      {new Date(data.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    <div className="space-y-2">
                      {data.actual !== null && (
                        <div className="flex justify-between items-center gap-4">
                          <span className="text-[10px] font-bold uppercase tracking-tight text-foreground/60">Actual Score</span>
                          <span className="text-sm font-black text-primary">{Math.round(data.actual)}%</span>
                        </div>
                      )}
                      {data.projected !== null && (
                        <div className="flex justify-between items-center gap-4">
                          <span className="text-[10px] font-bold uppercase tracking-tight text-blue-500/80">Projected</span>
                          <span className="text-sm font-black text-blue-600">{Math.round(data.projected)}%</span>
                        </div>
                      )}
                      {data.goalTrajectory !== null && (
                        <div className="flex justify-between items-center gap-4 pt-2 border-t border-border/30">
                          <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">Target Path</span>
                          <span className="text-sm font-black text-muted-foreground">{Math.round(data.goalTrajectory)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }}
            />

            {/* Uncertainty Band */}
            <Area
              type="monotone"
              dataKey="low"
              stroke="none"
              fill="hsl(var(--primary))"
              fillOpacity={0.05}
            />
            <Area
              type="monotone"
              dataKey="high"
              stroke="none"
              fill="hsl(var(--primary))"
              fillOpacity={0.05}
            />

            {/* Actual Line */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke="hsl(var(--primary))"
              strokeWidth={4}
              dot={{ r: 6, fill: 'white', strokeWidth: 3, stroke: 'hsl(var(--primary))' }}
              activeDot={{ r: 8, strokeWidth: 0 }}
              connectNulls={false}
            />

            {/* Projected Line */}
            <Line
              type="monotone"
              dataKey="projected"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              strokeDasharray="8 8"
              dot={false}
              connectNulls={false}
            />

            {/* Goal Trajectory */}
            {selectedGoal && (
              <Line
                type="monotone"
                dataKey="goalTrajectory"
                stroke="#9ca3af"
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={false}
                connectNulls={false}
              />
            )}

            {/* Goal Deadline Marker */}
            {selectedGoal && (
              <ReferenceLine
                x={selectedGoal.deadline}
                stroke="#ef4444"
                strokeDasharray="3 3"
                label={{
                  value: 'Deadline',
                  position: 'top',
                  fontSize: 12,
                }}
              />
            )}

            <Legend />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

