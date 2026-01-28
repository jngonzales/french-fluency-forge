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
import { BookOpen, Play, Library, Settings, User, Package, Upload, Loader2, GraduationCap, Briefcase, Sun, ArrowLeft } from 'lucide-react';
import { EmptyState } from '@/features/phrases/components/EmptyState';
import { usePhrasesLibrary } from '@/features/phrases/hooks/usePhrasesLibrary';
import { useToast } from '@/hooks/use-toast';
import { getPhrasesByPackId, MOCK_PHRASE_PACKS } from '@/features/phrases/data/mockPhrasesData';
import type { MemberPhraseCard, Phrase } from '@/features/phrases/types';
import { upsertMemberCards, insertPhrases } from '@/features/phrases/services/phrasesApi';
import { runMigrationIfNeeded } from '@/features/phrases/utils/migrateLocalStorage';
import { TSVImportDialog } from '@/features/phrases/components/TSVImportDialog';

export default function PhrasesLandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { stats, loading } = usePhrasesLibrary();
  
  const memberId = user?.id || 'guest';

  const handleSeedStarterPack = async (packId: string = 'pack-001', packName: string = 'Starter pack') => {
    try {
      // Get phrases from specified pack
      const starterPhrases = getPhrasesByPackId(packId);
      
      if (starterPhrases.length === 0) {
        toast({
          title: 'Pack not found',
          description: `The pack "${packName}" doesn't exist or has no phrases.`,
          variant: 'destructive',
        });
        return;
      }

      // Get existing cards to check for duplicates
      const cardsKey = user?.id ? `solv_phrases_cards_${user.id}` : `solv_phrases_cards_${memberId}`;
      const storedCards = localStorage.getItem(cardsKey);
      const existingCards: MemberPhraseCard[] = storedCards ? JSON.parse(storedCards) : [];
      const existingPhraseIds = new Set(existingCards.map(c => c.phrase_id));
      
      // Filter out phrases that already exist
      const newPhrases = starterPhrases.filter(p => !existingPhraseIds.has(p.id));
      
      if (newPhrases.length === 0) {
        toast({
          title: 'Already added',
          description: `You already have all phrases from the "${packName}" pack.`,
        });
        return;
      }
      
      // Create cards for each NEW phrase only
      const now = new Date();
      const newCards: MemberPhraseCard[] = newPhrases.map((phrase) => ({
        id: crypto.randomUUID(), // Use proper UUID for database
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
        try {
          await runMigrationIfNeeded(user.id);
          
          // First, insert the mock phrases to Supabase (they need to exist for FK constraint)
          await insertPhrases(newPhrases);
          
          await upsertMemberCards(newCards);
        } catch (err) {
          // Fallback to localStorage silently
        }
        // Also save phrases to localStorage for offline access
        const phrasesKey = `solv_phrases_${user.id}`;
        const storedPhrases = localStorage.getItem(phrasesKey);
        const existingPhrasesData = storedPhrases ? JSON.parse(storedPhrases) : [];
        localStorage.setItem(phrasesKey, JSON.stringify([...existingPhrasesData, ...newPhrases]));
        
        // Append new cards to existing
        localStorage.setItem(`solv_phrases_cards_${user.id}`, JSON.stringify([...existingCards, ...newCards]));
      } else {
        // Guest mode: save to localStorage only - append new cards to existing
        localStorage.setItem(cardsKey, JSON.stringify([...existingCards, ...newCards]));
      }

      toast({
        title: `${packName} added!`,
        description: `${newCards.length} phrases are ready to practice.`,
      });

      // Refresh the page
      window.location.reload();
    } catch (error) {
      console.error('Error adding starter pack:', error);
      toast({
        title: 'Error adding starter pack',
        description: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle TSV Import
  const handleTSVImport = async (phrases: Phrase[], cards: MemberPhraseCard[]) => {
    try {
      // Store phrases in localStorage and Supabase
      const phrasesKey = `solv_phrases_${memberId}`;
      const storedPhrases = localStorage.getItem(phrasesKey);
      const existingPhrases = storedPhrases ? JSON.parse(storedPhrases) : [];
      localStorage.setItem(phrasesKey, JSON.stringify([...existingPhrases, ...phrases]));
      
      // Try to insert phrases to Supabase (if migration has been run)
      if (user?.id) {
        await insertPhrases(phrases);
      }
      
      // Store cards
      if (user?.id) {
        await runMigrationIfNeeded(user.id);
        await upsertMemberCards(cards);
        
        const cardsKey = `solv_phrases_cards_${user.id}`;
        const storedCards = localStorage.getItem(cardsKey);
        const existingCards = storedCards ? JSON.parse(storedCards) : [];
        localStorage.setItem(cardsKey, JSON.stringify([...existingCards, ...cards]));
      } else {
        const cardsKey = `solv_phrases_cards_${memberId}`;
        const storedCards = localStorage.getItem(cardsKey);
        const existingCards = storedCards ? JSON.parse(storedCards) : [];
        localStorage.setItem(cardsKey, JSON.stringify([...existingCards, ...cards]));
      }

      toast({
        title: 'Phrases imported!',
        description: `${phrases.length} phrases are ready to practice.`,
        duration: 5000,
      });

      // Delay refresh to show success dialog and toast
      setTimeout(() => {
        window.location.reload();
      }, 2500);
    } catch (error) {
      console.error('Error importing phrases:', error);
      toast({
        title: 'Error importing phrases',
        description: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <AdminPadding>
        <div className="flex flex-col items-center justify-center min-h-screen gap-3 animate-fade-in">
          <div className="relative">
            <div className="h-10 w-10 rounded-full border-4 border-muted" />
            <div className="absolute inset-0 h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-muted-foreground">Loading your phrases...</p>
        </div>
      </AdminPadding>
    );
  }

  const hasPhrasesAssigned = stats.total > 0;

  return (
    <AdminPadding>
      <div className="min-h-screen bg-background animate-fade-in">
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
                variant="outline"
                size="lg"
                className="gap-2 border-2"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft className="h-5 w-5" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {!hasPhrasesAssigned ? (
            // Empty state - Pack selection
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="flex justify-center">
                  <div className="rounded-full bg-primary/10 p-4">
                    <BookOpen className="h-10 w-10 text-primary" />
                  </div>
                </div>
                <h3 className="font-semibold text-lg">Choose a phrase pack to get started</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Select a themed pack to begin your spaced repetition practice, or import your own phrases via TSV.
                </p>
              </div>

              {/* Pack selection grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Small Talk */}
                <Card className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all" onClick={() => handleSeedStarterPack('pack-001', 'Small Talk Starter')}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/30">
                        <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <CardTitle className="text-base">Small Talk</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">Everyday conversational phrases</p>
                    <Badge variant="secondary">10 phrases</Badge>
                  </CardContent>
                </Card>

                {/* School */}
                <Card className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all" onClick={() => handleSeedStarterPack('pack-004', 'School Essentials')}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-green-100 dark:bg-green-900/30">
                        <GraduationCap className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <CardTitle className="text-base">School</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">Academic & classroom settings</p>
                    <Badge variant="secondary">10 phrases</Badge>
                  </CardContent>
                </Card>

                {/* Work */}
                <Card className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all" onClick={() => handleSeedStarterPack('pack-005', 'Workplace Professional')}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-purple-100 dark:bg-purple-900/30">
                        <Briefcase className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <CardTitle className="text-base">Work</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">Office & professional contexts</p>
                    <Badge variant="secondary">10 phrases</Badge>
                  </CardContent>
                </Card>

                {/* Daily */}
                <Card className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all" onClick={() => handleSeedStarterPack('pack-006', 'Daily Life Basics')}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-orange-100 dark:bg-orange-900/30">
                        <Sun className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <CardTitle className="text-base">Daily Life</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">Routine activities & interactions</p>
                    <Badge variant="secondary">10 phrases</Badge>
                  </CardContent>
                </Card>
              </div>

              {/* TSV Import option */}
              <div className="flex justify-center pt-4 border-t">
                <TSVImportDialog
                  memberId={memberId}
                  onImport={handleTSVImport}
                />
              </div>
            </div>
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
                      Want to expand your practice? Add a themed pack or import your own.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                      <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => handleSeedStarterPack('pack-001', 'Small Talk')}>
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        Small Talk
                      </Button>
                      <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => handleSeedStarterPack('pack-004', 'School')}>
                        <GraduationCap className="w-4 h-4 text-green-600" />
                        School
                      </Button>
                      <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => handleSeedStarterPack('pack-005', 'Work')}>
                        <Briefcase className="w-4 h-4 text-purple-600" />
                        Work
                      </Button>
                      <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => handleSeedStarterPack('pack-006', 'Daily Life')}>
                        <Sun className="w-4 h-4 text-orange-600" />
                        Daily Life
                      </Button>
                    </div>
                    <TSVImportDialog onImport={handleTSVImport} memberId={memberId}>
                      <Button variant="outline" size="sm">
                        <Upload className="w-4 h-4 mr-2" />
                        Import TSV
                      </Button>
                    </TSVImportDialog>
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

