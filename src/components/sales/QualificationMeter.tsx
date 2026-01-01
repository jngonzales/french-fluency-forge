/**
 * Qualification Meter Component
 * Shows live qualification score (0-100) with color coding
 */

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { QualificationResult } from '@/lib/sales/types';

interface QualificationMeterProps {
  qualification: QualificationResult;
}

export function QualificationMeter({ qualification }: QualificationMeterProps) {
  const { score, band, reason, hardDisqualify } = qualification;

  // Color based on band
  const getColor = () => {
    if (hardDisqualify) return 'bg-red-500';
    if (band === 'High') return 'bg-green-500';
    if (band === 'Medium') return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getBandColor = () => {
    if (hardDisqualify) return 'destructive';
    if (band === 'High') return 'default';
    if (band === 'Medium') return 'secondary';
    return 'destructive';
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Qualification Score</h3>
            <Badge variant={getBandColor() as any}>{band}</Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Score</span>
              <span className="font-semibold">{score}/100</span>
            </div>
            <Progress value={score} className="h-2" />
          </div>
          {reason && (
            <p className="text-xs text-muted-foreground">{reason}</p>
          )}
          {hardDisqualify && (
            <div className="rounded-md bg-red-50 dark:bg-red-950 p-3">
              <p className="text-xs font-medium text-red-900 dark:text-red-100">
                {hardDisqualify.reason}
              </p>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                {hardDisqualify.script}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

