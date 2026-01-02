/**
 * Score Projections
 * Simple linear projection algorithm for MVP
 */

import type { AssessmentSnapshot, TimelinePoint, MetricKey, DimensionKey } from '../types';

/**
 * Generate timeline series with projections
 */
export function generateTimelineSeries(
  assessments: AssessmentSnapshot[],
  metric: MetricKey,
  daysForward: number = 90
): { actual: TimelinePoint[]; projected: { mid: TimelinePoint[]; low: TimelinePoint[]; high: TimelinePoint[] } } {
  const actualPoints: TimelinePoint[] = [];

  // Extract actual values
  assessments.forEach((assessment) => {
    const value = getMetricValue(assessment, metric);
    if (value !== null) {
      actualPoints.push({
        date: assessment.date,
        value,
        type: 'actual',
      });
    }
  });

  // If less than 2 points, can't project
  if (actualPoints.length < 2) {
    return {
      actual: actualPoints,
      projected: { mid: [], low: [], high: [] },
    };
  }

  // Calculate trend (simple linear regression)
  const trend = calculateTrend(actualPoints);
  
  // Generate projection points
  const lastPoint = actualPoints[actualPoints.length - 1];
  const lastDate = new Date(lastPoint.date);
  const projectedPoints: { mid: TimelinePoint[]; low: TimelinePoint[]; high: TimelinePoint[] } = {
    mid: [],
    low: [],
    high: [],
  };

  for (let i = 1; i <= daysForward; i += 7) { // Weekly intervals
    const futureDate = new Date(lastDate);
    futureDate.setDate(futureDate.getDate() + i);
    const dateStr = futureDate.toISOString().split('T')[0];

    const projectedValue = lastPoint.value + (trend.slope * i);
    const clampedValue = Math.max(0, Math.min(100, projectedValue));
    
    // Uncertainty band (increases with distance)
    const uncertainty = Math.min(20, trend.uncertainty * Math.sqrt(i / 7));

    projectedPoints.mid.push({
      date: dateStr,
      value: clampedValue,
      type: 'projected',
    });

    projectedPoints.low.push({
      date: dateStr,
      value: Math.max(0, clampedValue - uncertainty),
      type: 'projected',
    });

    projectedPoints.high.push({
      date: dateStr,
      value: Math.min(100, clampedValue + uncertainty),
      type: 'projected',
    });
  }

  return {
    actual: actualPoints,
    projected: projectedPoints,
  };
}

/**
 * Calculate trend from actual points
 */
function calculateTrend(points: TimelinePoint[]): { slope: number; uncertainty: number } {
  if (points.length < 2) {
    return { slope: 0, uncertainty: 0 };
  }

  // Simple linear regression
  const n = points.length;
  const dates = points.map((p) => new Date(p.date).getTime());
  const values = points.map((p) => p.value);

  // Normalize dates to days from first point
  const firstDate = dates[0];
  const normalizedDates = dates.map((d) => (d - firstDate) / (1000 * 60 * 60 * 24));

  // Calculate slope (per day)
  const meanX = normalizedDates.reduce((sum, x) => sum + x, 0) / n;
  const meanY = values.reduce((sum, y) => sum + y, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (normalizedDates[i] - meanX) * (values[i] - meanY);
    denominator += Math.pow(normalizedDates[i] - meanX, 2);
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;

  // Calculate uncertainty based on variance
  const residuals = points.map((p, i) => {
    const predicted = meanY + slope * (normalizedDates[i] - meanX);
    return Math.abs(p.value - predicted);
  });
  const meanResidual = residuals.reduce((sum, r) => sum + r, 0) / n;
  const uncertainty = Math.max(5, meanResidual * 1.5); // At least 5% uncertainty

  return { slope, uncertainty };
}

/**
 * Get metric value from assessment
 */
function getMetricValue(assessment: AssessmentSnapshot, metric: MetricKey): number | null {
  if (metric === 'overall') {
    return assessment.overall;
  }

  // Check if it's a dimension
  const dimensions: DimensionKey[] = [
    'pronunciation',
    'fluency',
    'confidence',
    'syntax',
    'conversation',
    'comprehension',
  ];

  if (dimensions.includes(metric as DimensionKey)) {
    return assessment.dimensions[metric as DimensionKey] || null;
  }

  // Phrases and AI metrics not in assessments yet
  return null;
}

/**
 * Generate S-curve trajectory for goal
 */
export function generateGoalTrajectory(
  startDate: string,
  startValue: number,
  deadline: string,
  targetValue: number
): TimelinePoint[] {
  const start = new Date(startDate);
  const end = new Date(deadline);
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  if (totalDays <= 0) return [];

  const points: TimelinePoint[] = [];
  const delta = targetValue - startValue;

  // Generate S-curve points
  for (let i = 0; i <= totalDays; i += Math.max(1, Math.floor(totalDays / 20))) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    // S-curve formula (sigmoid)
    const t = i / totalDays;
    const progress = 1 / (1 + Math.exp(-10 * (t - 0.5))); // Sigmoid centered at 0.5
    const value = startValue + (delta * progress);

    points.push({
      date: dateStr,
      value: Math.max(0, Math.min(100, value)),
      type: 'projected',
    });
  }

  return points;
}

