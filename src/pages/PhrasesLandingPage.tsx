/**
 * Phrases Landing Page
 * Main entry point with stats, CTAs, and empty state
 */

import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AdminPadding } from '@/components/AdminPadding';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Play, Library, Settings, User, Package } from 'lucide-react';
import { EmptyState } from '@/features/phrases/components/EmptyState';
import { usePhrasesLibrary } from '@/features/phrases/hooks/usePhrasesLibrary';
import { useToast } from '@/hooks/use-toast';
import { getPhrasesByPackId } from '@/features/phrases/data/mockPhrasesData';
import type { MemberPhraseCard } from '@/features/phrases/types';
import { upsertMemberCards } from '@/features/phrases/services/phrasesApi';
import { runMigrationIfNeeded } from '@/features/phrases/utils/migrateLocalStorage';

export default function PhrasesLandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { stats, loading } = usePhrasesLibrary();
  
  const memberId = user?.id || 'guest';

  const handleSeedStarterPack = async () => {
    // Get first 10 phrases from "Small talk starter" pack
    const starterPhrases = getPhrasesByPackId('pack-001').slice(0, 10);
    
    // Create cards for each phrase
    const now = new Date();
    const newCards: MemberPhraseCard[] = starterPhrases.map((phrase, index) => ({
      id: `card-${memberId}-${phrase.id}`,
      member_id: memberId,
      phrase_id: phrase.id,
      status: 'active',
      priority: 0,
      scheduler: {
        algorithm: 'sm2',
        state: 'new',
        due_at: now.toISOString(),
        interval_days: 0,
        ease_factor: 2.5,
        repetitions: 0,
      },
      lapses: 0,
      reviews: 0,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    }));

    if (user?.id) {
      await runMigrationIfNeeded(user.id);
      await upsertMemberCards(newCards);
      localStorage.setItem(`solv_phrases_cards_${user.id}`, JSON.stringify(newCards));
    } else {
      // Load existing cards
      const key = `solv_phrases_cards_${memberId}`;
      const stored = localStorage.getItem(key);
      const existingCards = stored ? JSON.parse(stored) : [];
      
      // Merge and save
      const allCards = [...existingCards, ...newCards];
      localStorage.setItem(key, JSON.stringify(allCards));
    }

    toast({
      title: 'Starter pack added!',
      description: `${newCards.length} phrases are ready to practice.`,
    });

    // Refresh the page
    window.location.reload();
  };

  if (loading) {
    return (
      <AdminPadding>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </AdminPadding>
    );
  }

  const hasPhrasesAssigned = stats.total > 0;

  return (
    <AdminPadding>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-serif font-bold">Phrases</h1>
                <p className="text-muted-foreground mt-1">
                  Short daily sessions. Rate honestly. We'll time the next review.
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
              >
                Back to dashboard
              </Button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {!hasPhrasesAssigned ? (
            // Empty state
            <Card>
              <CardContent className="pt-6">
                <EmptyState
                  icon={BookOpen}
                  title="No phrases assigned yet"
                  description="Add a starter pack to begin your spaced repetition practice. You'll learn syntactic chunks that help you speak naturally."
                  action={{
                    label: 'Add starter pack',
                    onClick: handleSeedStarterPack,
                  }}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column - Stats */}
              <div className="lg:col-span-1 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Today</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-3xl font-bold">{stats.due}</div>
                      <div className="text-sm text-muted-foreground">Due for review</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium">{stats.new}</div>
                        <div className="text-muted-foreground">New</div>
                      </div>
                      <div>
                        <div className="font-medium">{stats.learning}</div>
                        <div className="text-muted-foreground">Learning</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Recall</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{stats.known_recall} known</Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Recognition</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{stats.known_recognition} known</Badge>
                      </div>
                    </div>
                    <div className="pt-3 border-t text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Total phrases</span>
                        <span className="font-medium">{stats.total}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right column - Actions */}
              <div className="lg:col-span-2 space-y-6">
                {/* Primary CTA */}
                <Card className="border-2 border-primary">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Play className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">Start a session</CardTitle>
                        <CardDescription>
                          {stats.due > 0
                            ? `Review ${stats.due} phrase${stats.due !== 1 ? 's' : ''} due today`
                            : 'No phrases due right now'}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() => navigate('/phrases/session')}
                      disabled={stats.due === 0 && stats.new === 0}
                    >
                      Start session
                    </Button>
                  </CardContent>
                </Card>

                {/* Secondary actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/phrases/library')}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-primary/10">
                          <Library className="w-5 h-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg">Library</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        Browse and manage your {stats.total} phrase{stats.total !== 1 ? 's' : ''}
                      </CardDescription>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/phrases/settings')}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-primary/10">
                          <Settings className="w-5 h-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg">Settings</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        Configure daily limits and preferences
                      </CardDescription>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/phrases/logs')}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-primary/10">
                          <Library className="w-5 h-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg">Review Logs</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        View complete review history and scheduling data
                      </CardDescription>
                    </CardContent>
                  </Card>
                </div>

                {/* Add more packs */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-primary/10">
                        <Package className="w-5 h-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">Add more phrases</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Want to expand your practice? Add another starter pack.
                    </p>
                    <Button variant="outline" onClick={handleSeedStarterPack}>
                      Add 10 more phrases
                    </Button>
                  </CardContent>
                </Card>

                {/* Coach view link (if admin) */}
                <Card className="border-dashed">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-muted">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <CardTitle className="text-lg text-muted-foreground">Coach view</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">
                      For coaches: View and manage member phrase assignments
                    </CardDescription>
                    <Button variant="ghost" onClick={() => navigate('/phrases/coach')}>
                      Open coach view
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminPadding>
  );
}

