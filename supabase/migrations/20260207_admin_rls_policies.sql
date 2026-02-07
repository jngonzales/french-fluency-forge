-- ============================================================================
-- EMERGENCY FIX: Remove the recursive policies and replace with safe ones
-- Run this IMMEDIATELY in Supabase SQL Editor to restore normal operation
-- ============================================================================

-- Step 1: Drop ALL the recursive policies we just created
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all member_phrase_cards" ON public.member_phrase_cards;
DROP POLICY IF EXISTS "Admins can insert member_phrase_cards for any user" ON public.member_phrase_cards;
DROP POLICY IF EXISTS "Admins can view all phrases" ON public.phrases;
DROP POLICY IF EXISTS "Admins can insert phrases" ON public.phrases;
DROP POLICY IF EXISTS "Admins can view all assessment_sessions" ON public.assessment_sessions;
DROP POLICY IF EXISTS "Admins can manage all app_accounts" ON public.app_accounts;
DROP POLICY IF EXISTS "Admins can view all habits" ON public.habits;
DROP POLICY IF EXISTS "Admins can view all goals" ON public.goals;
DROP POLICY IF EXISTS "Admins can view all skill_recordings" ON public.skill_recordings;
DROP POLICY IF EXISTS "Admins can view all fluency_recordings" ON public.fluency_recordings;
DROP POLICY IF EXISTS "Admins can view all comprehension_recordings" ON public.comprehension_recordings;
DROP POLICY IF EXISTS "Admins can view all consent_records" ON public.consent_records;
DROP POLICY IF EXISTS "Admins can view all habit_cells" ON public.habit_cells;


-- Step 2: Create a SECURITY DEFINER function that checks admin role
-- This bypasses RLS to avoid infinite recursion on the profiles table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;


-- Step 3: Recreate admin policies using the safe is_admin() function
-- ===========================================================================

-- PROFILES: Allow admins to read all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id OR public.is_admin()
);

-- MEMBER_PHRASE_CARDS: Allow admins to read + insert all cards
CREATE POLICY "Admins can view all member_phrase_cards"
ON public.member_phrase_cards
FOR SELECT
USING (
  member_id = auth.uid() OR public.is_admin()
);

CREATE POLICY "Admins can insert member_phrase_cards for any user"
ON public.member_phrase_cards
FOR INSERT
WITH CHECK (
  member_id = auth.uid() OR public.is_admin()
);

-- PHRASES: Allow anyone to read, admins to insert
CREATE POLICY "Admins can view all phrases"
ON public.phrases
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert phrases"
ON public.phrases
FOR INSERT
WITH CHECK (public.is_admin());

-- ASSESSMENT_SESSIONS: Allow admins to read all
CREATE POLICY "Admins can view all assessment_sessions"
ON public.assessment_sessions
FOR SELECT
USING (
  user_id = auth.uid() OR public.is_admin()
);

-- APP_ACCOUNTS: Allow admins full CRUD
CREATE POLICY "Admins can manage all app_accounts"
ON public.app_accounts
FOR ALL
USING (public.is_admin());

-- HABITS: Allow admins to read all
CREATE POLICY "Admins can view all habits"
ON public.habits
FOR SELECT
USING (
  user_id = auth.uid() OR public.is_admin()
);

-- GOALS: Allow admins to read all
CREATE POLICY "Admins can view all goals"
ON public.goals
FOR SELECT
USING (
  user_id = auth.uid() OR public.is_admin()
);

-- SKILL_RECORDINGS
CREATE POLICY "Admins can view all skill_recordings"
ON public.skill_recordings
FOR SELECT
USING (
  user_id = auth.uid() OR public.is_admin()
);

-- FLUENCY_RECORDINGS
CREATE POLICY "Admins can view all fluency_recordings"
ON public.fluency_recordings
FOR SELECT
USING (
  user_id = auth.uid() OR public.is_admin()
);

-- COMPREHENSION_RECORDINGS
CREATE POLICY "Admins can view all comprehension_recordings"
ON public.comprehension_recordings
FOR SELECT
USING (
  user_id = auth.uid() OR public.is_admin()
);

-- CONSENT_RECORDS
CREATE POLICY "Admins can view all consent_records"
ON public.consent_records
FOR SELECT
USING (
  user_id = auth.uid() OR public.is_admin()
);

-- HABIT_CELLS
CREATE POLICY "Admins can view all habit_cells"
ON public.habit_cells
FOR SELECT
USING (
  user_id = auth.uid() OR public.is_admin()
);

-- ===========================================================================
-- DONE! The is_admin() function uses SECURITY DEFINER to bypass RLS,
-- preventing the infinite recursion issue on the profiles table.
-- ===========================================================================
