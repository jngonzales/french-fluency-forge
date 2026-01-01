/**
 * Lead Detail Component
 * Shows lead snapshot + assessment data if linked
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchAssessmentData } from '@/lib/sales/api';
import type { Lead, AssessmentData } from '@/lib/sales/types';
import { Phone } from 'lucide-react';

interface LeadDetailProps {
  lead: Lead;
  onStartCall: () => void;
  onEdit: () => void;
}

export function LeadDetail({ lead, onStartCall, onEdit }: LeadDetailProps) {
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lead.linked_user_id) {
      loadAssessmentData();
    }
  }, [lead.linked_user_id]);

  const loadAssessmentData = async () => {
    if (!lead.linked_user_id) return;
    try {
      setLoading(true);
      const data = await fetchAssessmentData(lead.linked_user_id);
      setAssessmentData(data);
    } catch (error) {
      console.error('Error loading assessment data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{lead.name || 'Unnamed Lead'}</h2>
          {lead.email && (
            <p className="text-sm text-muted-foreground">{lead.email}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onEdit}>
            Edit
          </Button>
          <Button onClick={onStartCall}>
            <Phone className="w-4 h-4 mr-2" />
            Start Call
          </Button>
        </div>
      </div>

      {/* Lead Info */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {lead.goal && (
            <div>
              <p className="text-sm font-medium">Goal</p>
              <p className="text-sm text-muted-foreground">{lead.goal}</p>
            </div>
          )}
          {lead.current_level && (
            <div>
              <p className="text-sm font-medium">Current Level</p>
              <p className="text-sm text-muted-foreground">{lead.current_level}</p>
            </div>
          )}
          {lead.time_available_per_week !== undefined && (
            <div>
              <p className="text-sm font-medium">Time Available</p>
              <p className="text-sm text-muted-foreground">
                {lead.time_available_per_week} hours/week
              </p>
            </div>
          )}
          {lead.budget_comfort !== undefined && (
            <div>
              <p className="text-sm font-medium">Budget Comfort</p>
              <p className="text-sm text-muted-foreground">{lead.budget_comfort}/5</p>
            </div>
          )}
          {lead.biggest_blockers && lead.biggest_blockers.length > 0 && (
            <div>
              <p className="text-sm font-medium">Blockers</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {lead.biggest_blockers.map((blocker) => (
                  <Badge key={blocker} variant="secondary">
                    {blocker}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assessment Data */}
      {lead.linked_user_id && (
        <Card>
          <CardHeader>
            <CardTitle>Assessment Data</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : assessmentData ? (
              <div className="space-y-3">
                {assessmentData.scores && (
                  <div>
                    <p className="text-sm font-medium mb-2">Scores</p>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(assessmentData.scores).map(([module, score]) => (
                        <div key={module} className="text-center">
                          <p className="text-xs text-muted-foreground capitalize">
                            {module}
                          </p>
                          <p className="text-lg font-semibold">{score}/100</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {assessmentData.archetype && (
                  <div>
                    <p className="text-sm font-medium">Archetype</p>
                    <p className="text-sm text-muted-foreground">
                      {assessmentData.archetype}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No assessment data available</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

