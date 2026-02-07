/**
 * Admin Configuration
 * 
 * DEPRECATED: Admin detection is now handled via the `role` column in the `profiles` table.
 * To make a user an admin, set their role to 'admin' in Supabase:
 * 
 * UPDATE public.profiles SET role = 'admin' WHERE email = 'user@example.com';
 * 
 * This file is kept for reference only.
 */

/**
 * @deprecated Use profiles.role in the database instead
 */
export const ADMIN_EMAILS = [
  'tom@solvlanguages.com',
  'jngonzales.dev@gmail.com',
  'tomgauthier0@gmail.com',
  'jngonz24@gmail.com'
];

/**
 * @deprecated Check profiles.role === 'admin' in the database instead
 */
export function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

