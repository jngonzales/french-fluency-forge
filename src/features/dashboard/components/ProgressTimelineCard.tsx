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

  // Generate timeline data for selected metric
  const daysCount = selectedRange === '7d' ? 7 : selectedRange === '30d' ? 30 : 90;
  const timelineSeries = generateTimelineSeries(assessments, selectedMetric, daysCount);

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

  // Empty state
  if (assessments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Progress Timeline</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <p>Complete your first assessment to see progress</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const metricLabels: Record<MetricKey, string> = {
    overall: 'Overall',
    pronunciation: 'Pronunciation',
    fluency: 'Fluency',
    confidence: 'Confidence',
    syntax: 'Syntax',
    conversation: 'Conversation',
    comprehension: 'Comprehension',
    phrases_known_recall: 'Phrases (Recall)',
    phrases_known_recognition: 'Phrases (Recognition)',
    ai_words_spoken: 'AI Words Spoken',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle>Progress Timeline</CardTitle>
          <div className="flex items-center gap-3">
            {/* Metric Selector */}
            <Select value={selectedMetric} onValueChange={(v) => onMetricChange(v as MetricKey)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overall">Overall</SelectItem>
                <SelectItem value="pronunciation">Pronunciation</SelectItem>
                <SelectItem value="fluency">Fluency</SelectItem>
                <SelectItem value="confidence">Confidence</SelectItem>
                <SelectItem value="syntax">Syntax</SelectItem>
                <SelectItem value="conversation">Conversation</SelectItem>
                <SelectItem value="comprehension">Comprehension</SelectItem>
              </SelectContent>
            </Select>

            {/* Range Selector */}
            <Tabs value={selectedRange} onValueChange={(v) => onRangeChange(v as TimeRange)}>
              <TabsList>
                <TabsTrigger value="7d">7d</TabsTrigger>
                <TabsTrigger value="30d">30d</TabsTrigger>
                <TabsTrigger value="90d">90d</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Goal Overlay Selector */}
            {goals.length > 0 && (
              <Select
                value={selectedGoalId || 'none'}
                onValueChange={(v) => onGoalChange(v === 'none' ? null : v)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Overlay goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No overlay</SelectItem>
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
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="date"
              tickFormatter={(date) => {
                const d = new Date(date);
                return `${d.getMonth() + 1}/${d.getDate()}`;
              }}
              tick={{ fontSize: 12 }}
            />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="bg-card border border-border rounded-md p-3 shadow-lg">
                    <p className="text-xs font-medium mb-1">{data.date}</p>
                    {data.actual !== null && (
                      <p className="text-xs text-green-600">Actual: {Math.round(data.actual)}</p>
                    )}
                    {data.projected !== null && (
                      <p className="text-xs text-blue-600">
                        Projected: {Math.round(data.projected)}
                      </p>
                    )}
                    {data.goalTrajectory !== null && (
                      <p className="text-xs text-gray-600">
                        Goal: {Math.round(data.goalTrajectory)}
                      </p>
                    )}
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
              fillOpacity={0.1}
            />
            <Area
              type="monotone"
              dataKey="high"
              stroke="none"
              fill="hsl(var(--primary))"
              fillOpacity={0.1}
            />

            {/* Actual Line */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={{ r: 4 }}
              connectNulls={false}
            />

            {/* Projected Line */}
            <Line
              type="monotone"
              dataKey="projected"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              strokeDasharray="5 5"
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

