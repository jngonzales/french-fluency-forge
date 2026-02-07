-- ===========================================================================
-- Migration: Grant teacher role admin-level access
-- Date: 2026-02-07
-- Description: Updates the is_admin() function to also grant admin privileges
--              to users with role = 'teacher'
-- ===========================================================================

-- Update the is_admin() function to include teachers
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'teacher')
  );
$$;

-- DONE! Teachers now have the same RLS access as admins.
-- The function is SECURITY DEFINER so it bypasses RLS on profiles table.
