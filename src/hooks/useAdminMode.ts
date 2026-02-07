import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to detect if current user is an admin or teacher
 * Admin and teacher users get special dev tools even in production
 * 
 * Admin status is determined by the `role` column in the `profiles` table.
 * Both 'admin' and 'teacher' roles grant admin access.
 */
export function useAdminMode() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        // Check database for admin role in profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data?.role === 'admin' || data?.role === 'teacher');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  // Always show in dev mode OR for admin users
  const shouldShowDevTools = import.meta.env.DEV || isAdmin;

  return { 
    isAdmin, 
    isLoading, 
    isDev: import.meta.env.DEV,
    showDevTools: shouldShowDevTools 
  };
}

