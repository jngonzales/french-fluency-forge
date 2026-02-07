/**
 * Admin User Detail Page
 * Shows a student's profile info, dashboard (via embedded view), and phrases.
 * Accessed from /admin/users/:userId
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAdminMode } from '@/hooks/useAdminMode';
import { AdminPadding } from '@/components/AdminPadding';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Loader2,
  LayoutDashboard,
  BookOpen,
  Upload,
  User,
  Calendar,
  Shield,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';
import { TSVImportDialog } from '@/features/phrases/components/TSVImportDialog';
import { insertPhrases, upsertMemberCards } from '@/features/phrases/services/phrasesApi';
import type { Phrase, MemberPhraseCard } from '@/features/phrases/types';

interface StudentProfile {
  id: string;
  email: string;
  created_at: string;
  role: string | null;
}

interface StudentStats {
  totalCards: number;
  dueCards: number;
  assessmentCount: number;
}

export default function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { isAdmin, isLoading: adminLoading } = useAdminMode();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [stats, setStats] = useState<StudentStats>({ totalCards: 0, dueCards: 0, assessmentCount: 0 });
  const [loading, setLoading] = useState(true);

  // Redirect non-admins
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      toast.error('Admin access required');
      navigate('/dashboard');
    }
  }, [isAdmin, adminLoading, navigate]);

  // Fetch student profile and stats
  useEffect(() => {
    async function fetchStudent() {
      if (!userId) return;
      setLoading(true);

      try {
        // Fetch profile
        const { data: profileData, error: profileError } = await (supabase as any)
          .from('profiles')
          .select('id, email, created_at, role')
          .eq('id', userId)
          .single() as { data: StudentProfile | null; error: any };

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          toast.error('Failed to load user profile');
          return;
        }

        setProfile(profileData);

        // Fetch flashcard stats
        const { count: totalCards } = await (supabase as any)
          .from('member_phrase_cards')
          .select('*', { count: 'exact', head: true })
          .eq('member_id', userId) as { count: number | null };

        const { count: dueCards } = await (supabase as any)
          .from('member_phrase_cards')
          .select('*', { count: 'exact', head: true })
          .eq('member_id', userId)
          .lte('due_at', new Date().toISOString()) as { count: number | null };

        // Fetch assessment session count
        const { count: assessmentCount } = await supabase
          .from('assessment_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        setStats({
          totalCards: totalCards ?? 0,
          dueCards: dueCards ?? 0,
          assessmentCount: assessmentCount ?? 0,
        });
      } catch (error) {
        console.error('Error fetching student data:', error);
        toast.error('Failed to load student data');
      } finally {
        setLoading(false);
      }
    }

    if (!adminLoading && isAdmin) {
      fetchStudent();
    }
  }, [userId, adminLoading, isAdmin]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDisplayName = () => {
    return profile?.email || 'Unknown';
  };

  if (adminLoading || loading) {
    return (
      <AdminPadding>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminPadding>
    );
  }

  if (!isAdmin) return null;

  if (!profile) {
    return (
      <AdminPadding>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <p className="text-xl text-muted-foreground">User not found</p>
          <Button variant="outline" onClick={() => navigate('/admin/users')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
        </div>
      </AdminPadding>
    );
  }

  return (
    <AdminPadding>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-orange-50/30 dark:to-orange-950/10">
        {/* Header */}
        <header className="bg-card/95 border-b border-border/50 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/users')}
              className="gap-2 text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Users
            </Button>

            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-orange-600 via-primary to-orange-500 bg-clip-text text-transparent">
                  {getDisplayName()}
                </h1>
                <p className="text-muted-foreground mt-1 font-mono text-sm">{profile.email}</p>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant={profile.role === 'admin' ? 'destructive' : profile.role === 'teacher' ? 'default' : 'secondary'}
                  className="text-sm"
                >
                  <Shield className="w-3 h-3 mr-1" />
                  {profile.role || 'student'}
                </Badge>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border border-border/50 bg-card/95">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalCards}</p>
                    <p className="text-xs text-muted-foreground">Total Flashcards</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/50 bg-card/95">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-orange-500/10">
                    <Activity className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.dueCards}</p>
                    <p className="text-xs text-muted-foreground">Cards Due Now</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/50 bg-card/95">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-green-500/10">
                    <Calendar className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.assessmentCount}</p>
                    <p className="text-xs text-muted-foreground">Assessments</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Info */}
          <Card className="border border-border/50 bg-card/95">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground font-medium">Email</dt>
                  <dd className="font-mono">{profile.email}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground font-medium">Member Since</dt>
                  <dd>{formatDate(profile.created_at)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground font-medium">User ID</dt>
                  <dd className="font-mono text-xs text-muted-foreground">{profile.id}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground font-medium">Role</dt>
                  <dd className="capitalize">{profile.role || 'student'}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Action Tabs */}
          <Tabs defaultValue="actions" className="space-y-4">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="actions">Quick Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="actions" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* View Dashboard */}
                <Card
                  className="border border-border/50 bg-card/95 hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer group"
                  onClick={() => navigate(`/dashboard?memberId=${userId}`)}
                >
                  <CardContent className="py-6 flex flex-col items-center text-center gap-3">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 group-hover:from-primary/30 transition-colors">
                      <LayoutDashboard className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">View Dashboard</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        See this student's dashboard as they see it
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* View Phrases */}
                <Card
                  className="border border-border/50 bg-card/95 hover:shadow-lg hover:border-orange-500/30 transition-all cursor-pointer group"
                  onClick={() => navigate(`/phrases?memberId=${userId}`)}
                >
                  <CardContent className="py-6 flex flex-col items-center text-center gap-3">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 group-hover:from-orange-500/30 transition-colors">
                      <BookOpen className="h-8 w-8 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold">View Phrases</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Browse this student's flashcard library
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Import TSV */}
                <TSVImportDialog
                  memberId={userId || ''}
                  onImport={async (phrases: Phrase[], cards: MemberPhraseCard[]) => {
                    await insertPhrases(phrases);
                    await upsertMemberCards(cards);
                    toast.success(`Imported ${phrases.length} flashcard${phrases.length !== 1 ? 's' : ''} for this student`);
                  }}
                >
                  <Card
                    className="border border-border/50 bg-card/95 hover:shadow-lg hover:border-green-500/30 transition-all cursor-pointer group"
                  >
                    <CardContent className="py-6 flex flex-col items-center text-center gap-3">
                      <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-500/5 group-hover:from-green-500/30 transition-colors">
                        <Upload className="h-8 w-8 text-green-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Import Flashcards (TSV)</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Paste TSV data to add cards for this student
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TSVImportDialog>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AdminPadding>
  );
}
