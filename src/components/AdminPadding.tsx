import { useState, useEffect } from 'react';
import { useAdminMode } from '@/hooks/useAdminMode';

/**
 * Wrapper component to add padding for admin toolbar
 * Use this to wrap pages that need space for the admin toolbar
 * Respects the hidden state (Ctrl+Shift+A to toggle)
 */

interface AdminPaddingProps {
  children: React.ReactNode;
  className?: string;
}

export function AdminPadding({ children, className = '' }: AdminPaddingProps) {
  const { showDevTools } = useAdminMode();
  
  // Listen for toolbar hidden state changes
  const [isToolbarHidden, setIsToolbarHidden] = useState(() => {
    return sessionStorage.getItem('admin_toolbar_hidden') === 'true';
  });

  // Listen for keyboard shortcut changes to hidden state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        // Re-read from sessionStorage after a tick (after AdminToolbar updates it)
        setTimeout(() => {
          setIsToolbarHidden(sessionStorage.getItem('admin_toolbar_hidden') === 'true');
        }, 10);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const needsPadding = showDevTools && !isToolbarHidden;

  return (
    <div className={`${needsPadding ? 'pt-20' : ''} ${className}`}>
      {children}
    </div>
  );
}

