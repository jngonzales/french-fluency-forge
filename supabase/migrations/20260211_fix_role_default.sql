-- ===========================================================================
-- Migration: Fix role default from 'user' to 'student'
-- Date: 2026-02-11
-- Description: The profiles.role column had DEFAULT 'user' which doesn't 
--              match the expected roles (student, teacher, admin).
--              This changes the default to 'student' and updates existing
--              'user' entries to 'student'.
-- ===========================================================================

-- 1. Change the default for new profiles
ALTER TABLE public.profiles 
ALTER COLUMN role SET DEFAULT 'student';

-- 2. Fix any existing profiles with role = 'user' → 'student'
UPDATE public.profiles 
SET role = 'student' 
WHERE role = 'user';

-- 3. Update the handle_new_user trigger to explicitly set role = 'student'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'student');
  RETURN NEW;
END;
$$;

-- DONE! New users will default to 'student' role.
