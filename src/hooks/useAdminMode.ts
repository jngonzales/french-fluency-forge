import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { isAdminEmail } from '@/config/admin';

/**
 * Hook to detect if current user is an admin
 * Admin users get special dev tools even in production
 * 
 * Configure admin emails in: src/config/admin.ts
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
        // Check by email from config
        const isAdminByEmail = isAdminEmail(user.email);

        // Optional: Check database for admin flag (future enhancement)
        // const { data } = await supabase
        //   .from('app_accounts')
        //   .select('is_admin')
        //   .eq('email', user.email)
        //   .single();
        // const isAdminByDB = data?.is_admin || false;

        setIsAdmin(isAdminByEmail);
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

