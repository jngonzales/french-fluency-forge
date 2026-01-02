/**
 * Phrases Settings Page
 * Configure daily limits, algorithm, and preferences
 */

import { useNavigate } from 'react-router-dom';
import { AdminPadding } from '@/components/AdminPadding';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePhrasesSettings } from '@/features/phrases/hooks/usePhrasesSettings';
import { SettingsForm } from '@/features/phrases/components/SettingsForm';
import type { PhraseSettings } from '@/features/phrases/types';

export default function PhrasesSettingsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings, loading, updateSettings, resetSettings } = usePhrasesSettings();

  const handleSave = (updates: Partial<Omit<PhraseSettings, 'member_id'>>) => {
    const success = updateSettings(updates);
    if (success) {
      toast({
        title: 'Settings saved',
        description: 'Your preferences have been updated.',
      });
    }
  };

  const handleReset = () => {
    resetSettings();
    toast({
      title: 'Settings reset',
      description: 'All settings restored to defaults.',
    });
  };

  if (loading) {
    return (
      <AdminPadding>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-muted-foreground">Loading settings...</div>
        </div>
      </AdminPadding>
    );
  }

  return (
    <AdminPadding>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => navigate('/phrases')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to phrases
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset to defaults
              </Button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Phrases settings</CardTitle>
              <CardDescription>
                Configure how you practice phrases. Changes save automatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SettingsForm
                settings={settings}
                onChange={handleSave}
              />
            </CardContent>
          </Card>

          {/* Info card */}
          <Card className="mt-6 border-dashed">
            <CardHeader>
              <CardTitle className="text-lg">About spaced repetition</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                This system uses spaced repetition to help you remember phrases long-term.
                Rate phrases honestly—this helps the algorithm schedule the optimal review time.
              </p>
              <p>
                <strong>Again:</strong> Forgot completely. Review in 1 day.
                <br />
                <strong>Hard:</strong> Remembered with difficulty. Review in 1 day.
                <br />
                <strong>Good:</strong> Remembered correctly. Review in 3+ days.
                <br />
                <strong>Easy:</strong> Too easy. Review in 7+ days.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminPadding>
  );
}

