/**
 * User Manager Modal
 * Admin interface for managing users, teachers, and access
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  RefreshCw,
  Mail,
  UserPlus,
  Loader2,
  Filter,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

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

interface UserManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserManagerModal({ open, onOpenChange }: UserManagerModalProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [updatingUsers, setUpdatingUsers] = useState<Set<string>>(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data: profiles, error: profilesError } = await (supabase as any)
        .from('profiles')
        .select('id, email, created_at, role')
        .order('created_at', { ascending: false }) as { data: Array<{ id: string; email: string; created_at: string; role?: string }> | null; error: any };

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

      const allEmails = new Set<string>();
      profiles?.forEach((p) => allEmails.add(p.email.toLowerCase()));
      appAccounts?.forEach((a) => allEmails.add(a.email.toLowerCase()));

      // Determine roles from DB (pure database-driven)
      const combinedUsers: UserProfile[] = Array.from(allEmails).map((email) => {
        const profile = profileMap.get(email);
        const account = accountMap.get(email);
        
        const id = profile?.id || account?.user_id || `temp-${email}`;
        const created_at = profile?.created_at || account?.created_at || new Date().toISOString();

        // Use DB role if available, otherwise default to student
        let role: UserRole;
        if (profile?.role && ['admin', 'teacher', 'student'].includes(profile.role)) {
          role = profile.role as UserRole;
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
    if (open) {
      fetchUsers();
    }
  }, [open, fetchUsers]);

  const filteredUsers = users.filter((user) => {
    if (filter === 'all') return true;
    if (filter === 'teachers') return user.role === 'teacher' || user.role === 'admin';
    if (filter === 'pending') return user.access_status !== 'active';
    return true;
  });

  const handleInviteTeacher = async () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }

    setInviting(true);
    try {
      const { error: accountError } = await supabase
        .from('app_accounts')
        .upsert({ email: inviteEmail.toLowerCase(), access_status: 'active' }, { onConflict: 'email' });

      if (accountError) {
        console.error('Error creating app_account:', accountError);
        toast.error('Failed to create account');
        return;
      }

      const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(inviteEmail);

      if (inviteError) {
        console.warn('Admin invite failed:', inviteError);
        toast.success(`Account created for ${inviteEmail}. Ask them to sign up at the login page.`, { duration: 5000 });
      } else {
        toast.success(`Invitation sent to ${inviteEmail}`);
      }

      setInviteEmail('');
      fetchUsers();
    } catch (error) {
      console.error('Error inviting teacher:', error);
      toast.error('Failed to invite teacher');
    } finally {
      setInviting(false);
    }
  };

  const toggleAccess = async (user: UserProfile) => {
    setUpdatingUsers((prev) => new Set(prev).add(user.id));
    try {
      const newStatus = user.access_status === 'active' ? 'inactive' : 'active';

      if (!user.has_app_account) {
        const { error } = await supabase.from('app_accounts').insert({
          email: user.email.toLowerCase(),
          access_status: newStatus,
          user_id: user.id.startsWith('temp-') ? null : user.id,
        });
        if (error) {
          console.error('Error creating app_account:', error);
          toast.error('Failed to update access');
          return;
        }
      } else {
        const { error } = await supabase
          .from('app_accounts')
          .update({ access_status: newStatus })
          .eq('email', user.email.toLowerCase());
        if (error) {
          console.error('Error updating app_account:', error);
          toast.error('Failed to update access');
          return;
        }
      }

      toast.success(`Access ${newStatus === 'active' ? 'enabled' : 'disabled'} for ${user.email}`);
      fetchUsers();
    } catch (error) {
      console.error('Error toggling access:', error);
      toast.error('Failed to toggle access');
    } finally {
      setUpdatingUsers((prev) => {
        const next = new Set(prev);
        next.delete(user.id);
        return next;
      });
    }
  };

  const changeRole = async (user: UserProfile, newRole: UserRole) => {
    if (user.id.startsWith('temp-')) {
      toast.error('Cannot change role for users without a profile.');
      return;
    }
    
    setUpdatingUsers((prev) => new Set(prev).add(user.id));
    try {
      const { error } = await (supabase as any)
        .from('profiles')
        .update({ role: newRole })
        .eq('id', user.id);

      if (error) {
        if (error.code === '42703') {
          toast.error('Role column not found. Run the migration from ADMIN_OPS.md first.');
        } else {
          console.error('Error updating role:', error);
          toast.error('Failed to update role');
        }
        return;
      }

      toast.success(`Role updated to ${newRole} for ${user.email}`);
      fetchUsers();
    } catch (error) {
      console.error('Error changing role:', error);
      toast.error('Failed to change role');
    } finally {
      setUpdatingUsers((prev) => {
        const next = new Set(prev);
        next.delete(user.id);
        return next;
      });
    }
  };

  const confirmDelete = (user: UserProfile) => {
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  };

  const deleteUser = async () => {
    if (!userToDelete) return;
    
    setDeleting(true);
    try {
      const userId = userToDelete.id;
      const userEmail = userToDelete.email.toLowerCase();

      // Delete in order to handle foreign key constraints
      // 1. Delete from app_accounts
      await supabase.from('app_accounts').delete().eq('email', userEmail);
      
      // 2. Delete user data from related tables (cascade delete)
      if (!userId.startsWith('temp-')) {
        // Delete recordings
        await supabase.from('skill_recordings').delete().eq('user_id', userId);
        await supabase.from('fluency_recordings').delete().eq('user_id', userId);
        await supabase.from('comprehension_recordings').delete().eq('user_id', userId);
        
        // Delete assessment sessions
        await supabase.from('assessment_sessions').delete().eq('user_id', userId);
        
        // Delete consent records
        await supabase.from('consent_records').delete().eq('user_id', userId);
        
        // Delete archetype feedback
        await supabase.from('archetype_feedback').delete().eq('user_id', userId);
        
        // Delete purchases
        await supabase.from('purchases').delete().eq('user_id', userId);
        
        // Delete profile (this should cascade in Supabase with proper FK setup)
        const { error: profileError } = await supabase.from('profiles').delete().eq('id', userId);
        if (profileError) {
          console.error('Error deleting profile:', profileError);
        }
      }

      toast.success(`User ${userToDelete.email} deleted successfully`);
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user. Some data may need manual cleanup.');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getAccessBadgeVariant = (status: string) => {
    if (status === 'active') return 'default';
    if (status === 'inactive') return 'secondary';
    return 'outline';
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    if (role === 'admin') return 'destructive';
    if (role === 'teacher') return 'default';
    return 'secondary';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-orange-500/5">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">Manage Users</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">View and manage user roles and access</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-shrink-0 mx-6 mt-4 border rounded-xl p-4 bg-card shadow-sm">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <UserPlus className="h-4 w-4 text-primary" />
            </div>
            Invite New Teacher
          </h3>
          <div className="flex gap-2">
            <Input
              placeholder="teacher@example.com"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1 h-10"
            />
            <Button onClick={handleInviteTeacher} disabled={inviting} className="h-10 px-4">
              {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
              Invite
            </Button>
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center gap-3 px-6 py-3">
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
          <span className="text-sm text-muted-foreground ml-auto font-medium">
            {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex-1 overflow-auto mx-6 mb-4 border rounded-xl">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">No users found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[280px] font-semibold">Email</TableHead>
                  <TableHead className="w-[100px] font-semibold">Created</TableHead>
                  <TableHead className="w-[120px] font-semibold">Role</TableHead>
                  <TableHead className="w-[100px] font-semibold">Access</TableHead>
                  <TableHead className="w-[80px] font-semibold">Active</TableHead>
                  <TableHead className="w-[60px] font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const isUpdating = updatingUsers.has(user.id);
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono text-xs">{user.email}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(user.created_at)}</TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(value: UserRole) => changeRole(user, value)}
                          disabled={isUpdating || user.id.startsWith('temp-')}
                        >
                          <SelectTrigger className="h-7 w-[100px]">
                            <SelectValue>
                              <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">{user.role}</Badge>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="teacher">Teacher</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getAccessBadgeVariant(user.access_status)} className="text-xs">
                          {user.access_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={user.access_status === 'active'}
                          onCheckedChange={() => toggleAccess(user)}
                          disabled={isUpdating}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => confirmDelete(user)}
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
        </div>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
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
                <p className="text-sm">
                  This will permanently remove:
                </p>
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
    </Dialog>
  );
}
