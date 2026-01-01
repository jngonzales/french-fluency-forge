/**
 * Admin Configuration
 * 
 * Add admin user emails here to enable admin mode for specific users
 * Admin users get special dev tools even in production
 */

export const ADMIN_EMAILS = [
  // Add your email(s) here
  'tom@example.com',
  'tomgauthier@gmail.com',
  'admin@example.com',
  // Add more admin emails as needed
];

/**
 * Check if email is an admin
 */
export function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

