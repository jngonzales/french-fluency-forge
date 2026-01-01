/**
 * Admin Configuration
 * 
 * Add admin user emails here to enable admin mode for specific users
 * Admin users get special dev tools even in production
 */

export const ADMIN_EMAILS = [
  'tom@solvlanguages.com',
];

/**
 * Check if email is an admin
 */
export function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

