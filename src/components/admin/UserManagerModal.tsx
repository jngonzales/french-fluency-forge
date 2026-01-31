/**
 * User Manager Modal
 * Admin interface for managing users, teachers, and access
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isAdminEmail } from '@/config/admin';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

  // Fetch users from profiles + app_accounts
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      // Get profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        toast.error('Failed to fetch profiles');
        setLoading(false);
        return;
      }

      // Get app_accounts
      const { data: appAccounts, error: accountsError } = await supabase
        .from('app_accounts')
        .select('email, access_status, user_id');

      if (accountsError) {
        console.error('Error fetching app_accounts:', accountsError);
        // Continue without app_accounts data
      }

      // Create a map of email to app_account
      const accountMap = new Map<string, { access_status: string; user_id: string | null }>();
      appAccounts?.forEach((acc) => {
        accountMap.set(acc.email.toLowerCase(), {
          access_status: acc.access_status,
          user_id: acc.user_id,
        });
      });

      // Get roles from profiles (if role column exists)
      // We'll handle this dynamically since the column may not exist
      const roleMap = new Map<string, string>();
      try {
        const { data: profilesWithRole } = await (supabase as any)
          .from('profiles')
          .select('id, role');
        
        profilesWithRole?.forEach((p: { id: string; role?: string }) => {
          if (p.role) {
            roleMap.set(p.id, p.role);
          }
        });
      } catch {
        // role column doesn't exist, use email-based detection
      }

      // Combine data
      const combinedUsers: UserProfile[] = (profiles || []).map((profile) => {
        const account = accountMap.get(profile.email.toLowerCase());
        
        // Determine role: check roleMap first, then email-based admin check, default to student
        let role: UserRole = 'student';
        if (roleMap.has(profile.id)) {
          const dbRole = roleMap.get(profile.id);
          if (dbRole === 'admin') role = 'admin';
          else if (dbRole === 'teacher') role = 'teacher';
          else role = 'student';
        } else if (isAdminEmail(profile.email)) {
          role = 'admin';
        }

        return {
          id: profile.id,
          email: profile.email,
          created_at: profile.created_at,
          role,
          access_status: account?.access_status || 'no_account',
          has_app_account: !!account,
        };
      });

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

  // Filter users
  const filteredUsers = users.filter((user) => {
    if (filter === 'all') return true;
    if (filter === 'teachers') return user.role === 'teacher' || user.role === 'admin';
    if (filter === 'pending') return user.access_status !== 'active';
    return true;
  });

  // Invite teacher
  const handleInviteTeacher = async () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }

    setInviting(true);
    try {
      // Create app_account with active status
      const { error: accountError } = await supabase
        .from('app_accounts')
        .upsert(
          {
            email: inviteEmail.toLowerCase(),
            access_status: 'active',
          },
          { onConflict: 'email' }
        );

      if (accountError) {
        console.error('Error creating app_account:', accountError);
        toast.error('Failed to create account');
        return;
      }

      // Send invite email via Supabase Auth
      const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
        inviteEmail
      );

      if (inviteError) {
        // If admin invite fails (common without service role), show manual instructions
        console.warn('Admin invite failed (expected without service role):', inviteError);
        toast.success(
          `Account created for ${inviteEmail}. Ask them to sign up at the login page.`,
          { duration: 5000 }
        );
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

  // Toggle access status
  const toggleAccess = async (user: UserProfile) => {
    setUpdatingUsers((prev) => new Set(prev).add(user.id));
    try {
      const newStatus = user.access_status === 'active' ? 'inactive' : 'active';

      if (!user.has_app_account) {
        // Create new app_account
        const { error } = await supabase.from('app_accounts').insert({
          email: user.email.toLowerCase(),
          access_status: newStatus,
          user_id: user.id,
        });

        if (error) {
          console.error('Error creating app_account:', error);
          toast.error('Failed to update access');
          return;
        }
      } else {
        // Update existing app_account
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

  // Change role
  const changeRole = async (user: UserProfile, newRole: UserRole) => {
    setUpdatingUsers((prev) => new Set(prev).add(user.id));
    try {
      // Update profiles.role column (may need to be created first)
      const { error } = await (supabase as any)
        .from('profiles')
        .update({ role: newRole })
        .eq('id', user.id);

      if (error) {
        // If role column doesn't exist, show a helpful message
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

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get access badge color
  const getAccessBadgeVariant = (status: string) => {
    if (status === 'active') return 'default';
    if (status === 'inactive') return 'secondary';
    return 'outline';
  };

  // Get role badge color
  const getRoleBadgeVariant = (role: UserRole) => {
    if (role === 'admin') return 'destructive';
    if (role === 'teacher') return 'default';
    return 'secondary';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">Manage Users</DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUsers}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </DialogHeader>

        {/* Invite Teacher Section */}
        <div className="flex-shrink-0 border rounded-lg p-4 bg-muted/30">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Invite New Teacher
          </h3>
          <div className="flex gap-2">
            <Input
              placeholder="teacher@example.com"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleInviteTeacher} disabled={inviting}>
              {inviting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-1" />
              )}
              Invite
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex-shrink-0 flex items-center gap-2 py-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex gap-1">
            {(['all', 'teachers', 'pending'] as FilterType[]).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f)}
                className="capitalize"
              >
                {f}
              </Button>
            ))}
          </div>
          <span className="text-sm text-muted-foreground ml-auto">
            {filteredUsers.length} users
          </span>
        </div>

        {/* Users Table */}
        <div className="flex-1 overflow-auto border rounded-lg">
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
                <TableRow>
                  <TableHead className="w-[250px]">Email</TableHead>
                  <TableHead className="w-[100px]">Created</TableHead>
                  <TableHead className="w-[120px]">Role</TableHead>
                  <TableHead className="w-[100px]">Access</TableHead>
                  <TableHead className="w-[80px]">Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const isUpdating = updatingUsers.has(user.id);
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono text-xs">
                        {user.email}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(value: UserRole) => changeRole(user, value)}
                          disabled={isUpdating}
                        >
                          <SelectTrigger className="h-7 w-[100px]">
                            <SelectValue>
                              <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                                {user.role}
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
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
