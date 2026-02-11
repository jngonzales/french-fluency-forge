/**
 * Admin Users Page - Full User Management
 * Lists all users in a clickable table. Clicking a row navigates to the user detail page.
 * Includes invite, role management, access toggle, and delete.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminMode } from '@/hooks/useAdminMode';
import { AdminPadding } from '@/components/AdminPadding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  RefreshCw,
  Mail,
  UserPlus,
  Loader2,
  Filter,
  Trash2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

type UserRole = 'student' | 'teacher' | 'admin';
type FilterType = 'all' | 'teachers' | 'pending';

interface UserProfile {
  id: string;
  email: string;
  created_at: string;
  role: UserRole;
  access_status: string;
  has_app_account: boolean;
}

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdminMode();

  // Users state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [updatingUsers, setUpdatingUsers] = useState<Set<string>>(new Set());

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  // Delete state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Redirect non-admins
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      toast.error('Admin access required');
      navigate('/dashboard');
    }
  }, [isAdmin, adminLoading, navigate]);

  // Fetch users from profiles + app_accounts
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data: profiles, error: profilesError } = await (supabase as any)
        .from('profiles')
        .select('id, email, created_at, role')
        .order('created_at', { ascending: false }) as {
          data: Array<{ id: string; email: string; created_at: string; role?: string }> | null;
          error: any;
        };

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      const { data: appAccounts, error: accountsError } = await supabase
        .from('app_accounts')
        .select('id, email, access_status, user_id, created_at')
        .order('created_at', { ascending: false });

      if (accountsError) {
        console.error('Error fetching app_accounts:', accountsError);
      }

      // Build lookup maps
      const profileMap = new Map<string, { id: string; email: string; created_at: string; role?: string }>();
      profiles?.forEach((profile) => {
        profileMap.set(profile.email.toLowerCase(), profile);
      });

      const accountMap = new Map<string, { access_status: string; user_id: string | null; created_at: string }>();
      appAccounts?.forEach((acc) => {
        accountMap.set(acc.email.toLowerCase(), {
          access_status: acc.access_status,
          user_id: acc.user_id,
          created_at: acc.created_at,
        });
      });

      // Merge all unique emails
      const allEmails = new Set<string>();
      profiles?.forEach((p) => allEmails.add(p.email.toLowerCase()));
      appAccounts?.forEach((a) => allEmails.add(a.email.toLowerCase()));

      const combinedUsers: UserProfile[] = Array.from(allEmails).map((email) => {
        const profile = profileMap.get(email);
        const account = accountMap.get(email);

        const id = profile?.id || account?.user_id || `temp-${email}`;
        const created_at = profile?.created_at || account?.created_at || new Date().toISOString();

        let role: UserRole;
        if (profile?.role && ['admin', 'teacher', 'student'].includes(profile.role)) {
          role = profile.role as UserRole;
        } else if (profile?.role === 'user') {
          // Legacy default 'user' maps to 'student'
          role = 'student';
        } else {
          role = 'student';
        }

        return {
          id,
          email,
          created_at,
          role,
          access_status: account?.access_status || 'no_account',
          has_app_account: !!account,
        };
      });

      combinedUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setUsers(combinedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!adminLoading && isAdmin) {
      fetchUsers();
    }
  }, [adminLoading, isAdmin, fetchUsers]);

  // Filter logic
  const filteredUsers = users.filter((u) => {
    if (filter === 'all') return true;
    if (filter === 'teachers') return u.role === 'teacher' || u.role === 'admin';
    if (filter === 'pending') return u.access_status !== 'active';
    return true;
  });

  // Invite handler
  const handleInvite = async () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }

    setInviting(true);
    try {
      const normalizedEmail = inviteEmail.trim().toLowerCase();

      // Call edge function to send invite email AND create app_account (server-side)
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      
      if (!accessToken) {
        toast.error('Session expired. Please refresh and try again.');
        setInviting(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ email: normalizedEmail }),
        }
      );

      if (!response.ok) {
        let errorMsg = 'Failed to send invitation';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
          if (response.status === 403) {
            errorMsg = 'Permission denied. Your account may not have invite privileges. Contact an admin.';
          }
        } catch {
          // Couldn't parse error response
        }
        console.error('[handleInvite] Edge function error:', response.status, errorMsg);
        toast.error(errorMsg);
        setInviting(false);
        return;
      }

      toast.success(`Invitation sent to ${inviteEmail}`);

      setInviteEmail('');
      fetchUsers();
    } catch (error) {
      console.error('Error inviting:', error);
      toast.error('Failed to invite user');
    } finally {
      setInviting(false);
    }
  };

  // Role change
  const changeRole = async (targetUser: UserProfile, newRole: UserRole) => {
    if (targetUser.id.startsWith('temp-')) {
      toast.error('Cannot change role for users without a profile.');
      return;
    }

    setUpdatingUsers((prev) => new Set(prev).add(targetUser.id));
    try {
      const { error } = await (supabase as any)
        .from('profiles')
        .update({ role: newRole })
        .eq('id', targetUser.id);

      if (error) {
        if (error.code === '42703') {
          toast.error('Role column not found. Run the migration from ADMIN_OPS.md first.');
        } else {
          toast.error('Failed to update role');
        }
        return;
      }

      toast.success(`Role updated to ${newRole} for ${targetUser.email}`);
      fetchUsers();
    } catch {
      toast.error('Failed to change role');
    } finally {
      setUpdatingUsers((prev) => {
        const next = new Set(prev);
        next.delete(targetUser.id);
        return next;
      });
    }
  };

  // Access toggle
  const toggleAccess = async (targetUser: UserProfile) => {
    setUpdatingUsers((prev) => new Set(prev).add(targetUser.id));
    try {
      const newStatus = targetUser.access_status === 'active' ? 'inactive' : 'active';

      if (!targetUser.has_app_account) {
        const { error } = await supabase.from('app_accounts').insert({
          email: targetUser.email.toLowerCase(),
          access_status: newStatus,
          user_id: targetUser.id.startsWith('temp-') ? null : targetUser.id,
        });
        if (error) {
          toast.error('Failed to update access');
          return;
        }
      } else {
        const { error } = await supabase
          .from('app_accounts')
          .update({ access_status: newStatus })
          .eq('email', targetUser.email.toLowerCase());
        if (error) {
          toast.error('Failed to update access');
          return;
        }
      }

      toast.success(
        `Access ${newStatus === 'active' ? 'enabled' : 'disabled'} for ${targetUser.email}`
      );
      fetchUsers();
    } catch {
      toast.error('Failed to toggle access');
    } finally {
      setUpdatingUsers((prev) => {
        const next = new Set(prev);
        next.delete(targetUser.id);
        return next;
      });
    }
  };

  // Delete user
  const confirmDelete = (targetUser: UserProfile) => {
    setUserToDelete(targetUser);
    setDeleteConfirmOpen(true);
  };

  const deleteUser = async () => {
    if (!userToDelete) return;

    setDeleting(true);
    try {
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;

      if (!accessToken) {
        toast.error('Session expired. Please refresh and try again.');
        setDeleting(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            userId: userToDelete.id,
            email: userToDelete.email,
          }),
        }
      );

      if (!response.ok) {
        let errorMsg = 'Failed to delete user';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch {
          // Couldn't parse error response
        }
        toast.error(errorMsg);
        setDeleting(false);
        return;
      }

      const result = await response.json();
      if (result.warnings?.length) {
        toast.success(`User deleted with warnings: ${result.warnings.join(', ')}`);
      } else {
        toast.success(`User ${userToDelete.email} deleted successfully`);
      }

      setDeleteConfirmOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch {
      toast.error('Failed to delete user. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // Helpers
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getAccessBadgeVariant = (status: string) => {
    if (status === 'active') return 'default' as const;
    if (status === 'inactive') return 'secondary' as const;
    return 'outline' as const;
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    if (role === 'admin') return 'destructive' as const;
    if (role === 'teacher') return 'default' as const;
    return 'secondary' as const;
  };

  if (adminLoading) {
    return (
      <AdminPadding>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminPadding>
    );
  }

  if (!isAdmin) return null;

  return (
    <AdminPadding>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-orange-50/30 dark:to-orange-950/10">
        {/* Header */}
        <header className="bg-card/95 border-b border-border/50 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchUsers}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            <div className="mt-6 mb-2">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-orange-600 via-primary to-orange-500 bg-clip-text text-transparent drop-shadow-sm">
                User Management
              </h1>
              <p className="text-lg text-muted-foreground mt-1">
                Manage users, roles, and access. Click a user to view their dashboard.
              </p>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          {/* Invite Section */}
          <Card className="border border-border/50 bg-card/95 shadow-sm">
            <CardContent className="py-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <UserPlus className="h-4 w-4 text-primary" />
                </div>
                Invite New User
              </h3>
              <div className="flex gap-2">
                <Input
                  placeholder="user@example.com"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                  className="flex-1 h-10"
                />
                <Button onClick={handleInvite} disabled={inviting} className="h-10 px-4">
                  {inviting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  Invite
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Filters + Count */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <div className="flex gap-1 p-1 bg-muted rounded-lg">
                {(['all', 'teachers', 'pending'] as FilterType[]).map((f) => (
                  <Button
                    key={f}
                    variant={filter === f ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFilter(f)}
                    className={`capitalize h-8 ${filter === f ? 'shadow-sm' : ''}`}
                  >
                    {f}
                  </Button>
                ))}
              </div>
            </div>
            <span className="text-sm text-muted-foreground font-medium">
              {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* User Table */}
          <Card className="border border-border/50 bg-card/95 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                No users found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold w-[110px]">Created</TableHead>
                    <TableHead className="font-semibold w-[120px]">Role</TableHead>
                    <TableHead className="font-semibold w-[100px]">Access</TableHead>
                    <TableHead className="font-semibold w-[80px]">Active</TableHead>
                    <TableHead className="font-semibold w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => {
                    const isUpdating = updatingUsers.has(u.id);
                    const isClickable = !u.id.startsWith('temp-');
                    return (
                      <TableRow
                        key={u.id}
                        className={
                          isClickable
                            ? 'cursor-pointer hover:bg-primary/5 transition-colors'
                            : ''
                        }
                        onClick={() => {
                          if (isClickable) {
                            navigate(`/admin/users/${u.id}`);
                          }
                        }}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">{u.email}</span>
                            {isClickable && (
                              <ExternalLink className="h-3 w-3 text-muted-foreground/50" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(u.created_at)}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={u.role}
                            onValueChange={(value: string) => changeRole(u, value as UserRole)}
                            disabled={isUpdating || u.id.startsWith('temp-')}
                          >
                            <SelectTrigger className="h-7 w-[100px]">
                              <SelectValue>
                                <Badge
                                  variant={getRoleBadgeVariant(u.role)}
                                  className="text-xs"
                                >
                                  {u.role}
                                </Badge>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="student">Student</SelectItem>
                              <SelectItem value="teacher">Teacher</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Badge
                            variant={getAccessBadgeVariant(u.access_status)}
                            className="text-xs"
                          >
                            {u.access_status}
                          </Badge>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Switch
                            checked={u.access_status === 'active'}
                            onCheckedChange={() => toggleAccess(u)}
                            disabled={isUpdating}
                          />
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => confirmDelete(u)}
                            disabled={isUpdating}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Card>

          {/* Quick Reference */}
          <Card className="border border-border/30 bg-gradient-to-r from-muted/30 to-transparent ">
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-base">💡</span>
                  <span>
                    Click a user row to view their dashboard, phrases, and manage flashcards
                  </span>
                </div>
                <div className="h-4 w-px bg-border/50 hidden md:block" />
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-base">📖</span>
                  <span>
                    Full docs:{' '}
                    <code className="text-xs bg-muted/60 px-1.5 py-0.5 rounded font-mono">
                      docs/ADMIN_OPS.md
                    </code>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete User
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Are you sure you want to delete <strong>{userToDelete?.email}</strong>?
                </p>
                <p className="text-sm">This will permanently remove:</p>
                <ul className="text-sm list-disc list-inside text-muted-foreground">
                  <li>User profile and account data</li>
                  <li>All assessment sessions and recordings</li>
                  <li>Flashcard progress and history</li>
                  <li>Consent records and purchases</li>
                </ul>
                <p className="text-sm font-medium text-destructive">
                  This action cannot be undone.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteUser}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete User
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPadding>
  );
}
