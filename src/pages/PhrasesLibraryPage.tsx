/**
 * Phrases Library Page
 * Browse and manage phrases with filters and actions
 */

import { useNavigate } from 'react-router-dom';
import { AdminPadding } from '@/components/AdminPadding';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePhrasesLibrary } from '@/features/phrases/hooks/usePhrasesLibrary';
import { LibraryTable } from '@/features/phrases/components/LibraryTable';

export default function PhrasesLibraryPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { cards, filters, setFilters, stats, loading, actions } = usePhrasesLibrary();

  if (loading) {
    return (
      <AdminPadding>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-muted-foreground">Loading library...</div>
        </div>
      </AdminPadding>
    );
  }

  const handleBury = (cardId: string) => {
    actions.bury(cardId);
    toast({ title: 'Phrase buried', description: 'Hidden until tomorrow' });
  };

  const handleSuspend = (cardId: string) => {
    actions.suspend(cardId);
    toast({ title: 'Phrase suspended', description: 'Hidden indefinitely' });
  };

  const handleRemove = (cardId: string) => {
    actions.remove(cardId);
    toast({ title: 'Phrase removed', description: 'Removed from your set' });
  };

  const handleReactivate = (cardId: string) => {
    actions.reactivate(cardId);
    toast({ title: 'Phrase reactivated', description: 'Back in your active set' });
  };

  const handleFlag = (cardId: string, reason: string) => {
    actions.flag(cardId, reason);
    toast({ title: 'Issue flagged', description: 'Thanks for reporting!' });
  };

  return (
    <AdminPadding>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/phrases')}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <h1 className="text-2xl font-serif font-bold">Phrase library</h1>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats summary */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Due
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats.due}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  New
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.new}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Learning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.learning}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Suspended
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-muted-foreground">{stats.suspended}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Buried
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-muted-foreground">{stats.buried}</div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <LibraryTable
            cards={cards}
            filters={filters}
            onFilterChange={setFilters}
            onBury={handleBury}
            onSuspend={handleSuspend}
            onRemove={handleRemove}
            onReactivate={handleReactivate}
            onFlag={handleFlag}
          />
        </div>
      </div>
    </AdminPadding>
  );
}

