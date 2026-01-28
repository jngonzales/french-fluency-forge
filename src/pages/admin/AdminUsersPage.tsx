/**
 * Admin Users Page - "Grandparent-Proof" Admin Panel
 * Simple interface to invite users and assign flashcard packs
 * 
 * NOTE: Uses Supabase Edge Function for user invites (requires service role key)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminMode } from '@/hooks/useAdminMode';

// Cast to 'any' to access untyped tables (phrases, member_phrase_cards)
// These tables exist but aren't in the generated Supabase types
const db = supabase as any;
import { AdminPadding } from '@/components/AdminPadding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, UserPlus, Package, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PhrasePack {
  category: string;
  count: number;
}

interface RecentUser {
  id: string;
  email: string;
  created_at: string;
}

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdminMode();

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Assign cards form state
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPack, setSelectedPack] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);

  // Data state
  const [phrasePacks, setPhrasePacks] = useState<PhrasePack[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Redirect non-admins
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      toast.error('Admin access required');
      navigate('/dashboard');
    }
  }, [isAdmin, adminLoading, navigate]);

  // Load phrase packs by grouping tags
  useEffect(() => {
    async function loadData() {
      if (!user?.id) return;

      try {
        // Load all phrases and group by first tag
        const { data: phrases, error: phrasesError } = await db
          .from('phrases')
          .select('id, tags');

        if (!phrasesError && phrases) {
          // Group by first tag as "category"
          const packCounts: Record<string, number> = {};
          phrases.forEach((p: { id: string; tags: string[] | null }) => {
            const tag = p.tags?.[0] || 'All Phrases';
            packCounts[tag] = (packCounts[tag] || 0) + 1;
          });
          
          // Also add an "All Phrases" option
          const totalCount = phrases.length;
          const packs = [
            { category: 'ALL', count: totalCount },
            ...Object.entries(packCounts).map(([category, count]) => ({
              category,
              count,
            }))
          ];
          setPhrasePacks(packs);
        }

        // Note: We can't directly query auth.users from the client
        // Users will need to enter the user ID manually or we need an edge function
        setRecentUsers([]);
      } catch (err) {
        console.error('[AdminUsers] Error loading data:', err);
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, [user?.id]);

  // Handle invite user
  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setInviteLoading(true);
    setInviteSuccess(false);

    try {
      // Call the invite-user Edge Function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({ email: inviteEmail.trim() }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to invite user');
      }

      setInviteSuccess(true);
      setInviteEmail('');
      toast.success(`Invitation sent to ${inviteEmail}`);
    } catch (err) {
      console.error('[AdminUsers] Invite error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to invite user');
    } finally {
      setInviteLoading(false);
    }
  }

  // Handle assign flashcards
  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUserId.trim() || !selectedPack) {
      toast.error('Please enter a User ID and select a pack');
      return;
    }

    setAssignLoading(true);
    setAssignSuccess(false);

    try {
      // Get phrases - either all or filtered by tag
      const query = db.from('phrases').select('id, tags');
      
      // If not "ALL", filter by first tag containing the selected pack name
      const { data: phrases, error: phrasesError } = await query;

      if (phrasesError) throw phrasesError;
      
      // Filter client-side if not ALL
      let filteredPhrases = phrases || [];
      if (selectedPack !== 'ALL') {
        filteredPhrases = phrases.filter((p: { id: string; tags: string[] | null }) => 
          p.tags?.includes(selectedPack)
        );
      }
      
      if (filteredPhrases.length === 0) {
        toast.error('No phrases found in this pack');
        setAssignLoading(false);
        return;
      }

      // Create member_phrase_cards for each phrase
      const cards = filteredPhrases.map((phrase: { id: string }) => ({
        member_id: selectedUserId.trim(),
        phrase_id: phrase.id,
        status: 'active',
        scheduler: {
          state: 'new',
          due_at: new Date().toISOString(),
          last_reviewed_at: null,
          interval_days: 0,
          ease_factor: 2.5,
          repetitions: 0,
        },
        lapses: 0,
        reviews: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      // Use upsert to avoid duplicates
      const { error: insertError } = await db
        .from('member_phrase_cards')
        .upsert(cards, { onConflict: 'member_id,phrase_id' });

      if (insertError) throw insertError;

      setAssignSuccess(true);
      toast.success(`Assigned ${filteredPhrases.length} phrases to user`);
    } catch (err) {
      console.error('[AdminUsers] Assign error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to assign flashcards');
    } finally {
      setAssignLoading(false);
    }
  }

  if (adminLoading || loadingData) {
    return (
      <AdminPadding>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminPadding>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminPadding>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold mt-4">Admin: User Management</h1>
            <p className="text-muted-foreground">Invite users and assign flashcard packs</p>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
          {/* Invite User Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Invite New User
              </CardTitle>
              <CardDescription>
                Send an invitation email to a new user. They will receive a link to set their password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInvite} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="inviteEmail" className="text-lg">Email Address</Label>
                  <Input
                    id="inviteEmail"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="h-12 text-lg"
                    disabled={inviteLoading}
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  disabled={inviteLoading || !inviteEmail.trim()}
                  className="gap-2"
                >
                  {inviteLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : inviteSuccess ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Invitation Sent!
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </form>

              {/* Manual instructions fallback */}
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Alternative: Invite via Supabase Dashboard</p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Go to Supabase Dashboard → Authentication → Users</li>
                  <li>Click "Invite user"</li>
                  <li>Enter the email address</li>
                  <li>Click "Send invitation"</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Assign Flashcards Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Assign Flashcard Pack
              </CardTitle>
              <CardDescription>
                Assign a pack of phrases to a user. You'll need their User ID from the database.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAssign} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="userId" className="text-lg">User ID (UUID)</Label>
                  <Input
                    id="userId"
                    type="text"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    placeholder="e.g., 12345678-1234-1234-1234-123456789012"
                    className="h-12 text-base font-mono"
                    disabled={assignLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Find this in Supabase Dashboard → Authentication → Users → Click user → Copy ID
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pack" className="text-lg">Flashcard Pack</Label>
                  <Select
                    value={selectedPack}
                    onValueChange={setSelectedPack}
                    disabled={assignLoading}
                  >
                    <SelectTrigger className="h-12 text-lg">
                      <SelectValue placeholder="Select a pack..." />
                    </SelectTrigger>
                    <SelectContent>
                      {phrasePacks.map((pack) => (
                        <SelectItem key={pack.category} value={pack.category}>
                          {pack.category} ({pack.count} phrases)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={assignLoading || !selectedUserId.trim() || !selectedPack}
                  className="gap-2"
                >
                  {assignLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Assigning...
                    </>
                  ) : assignSuccess ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Assigned!
                    </>
                  ) : (
                    <>
                      <Package className="w-5 h-5" />
                      Assign Pack to User
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Quick Reference */}
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-lg">Quick Reference</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>To invite a user:</strong> Enter their email above, or use the Supabase Dashboard.
              </p>
              <p>
                <strong>To get a User ID:</strong> Go to Supabase Dashboard → Authentication → Users → 
                Click on the user → Copy the ID (UUID format).
              </p>
              <p>
                <strong>For detailed SQL queries:</strong> See <code>docs/ADMIN_OPS.md</code>
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    </AdminPadding>
  );
}
