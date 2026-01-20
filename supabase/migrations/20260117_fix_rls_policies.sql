-- ============================================
-- FIX RLS POLICIES - Run this to fix 403 errors
-- Safe to run multiple times (uses DROP IF EXISTS)
-- ============================================

-- ============================================
-- HABITS TABLE RLS
-- ============================================
DO $$ 
BEGIN
  -- Create table if not exists
  CREATE TABLE IF NOT EXISTS habits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly')),
    source text NOT NULL DEFAULT 'personal' CHECK (source IN ('system', 'personal')),
    intensity integer CHECK (intensity IS NULL OR (intensity >= 1 AND intensity <= 6)),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Enable RLS
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Users can view own habits" ON habits;
CREATE POLICY "Users can view own habits"
  ON habits FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own habits" ON habits;
CREATE POLICY "Users can create own habits"
  ON habits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own habits" ON habits;
CREATE POLICY "Users can update own habits"
  ON habits FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own habits" ON habits;
CREATE POLICY "Users can delete own habits"
  ON habits FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- GOALS TABLE RLS
-- ============================================
DO $$ 
BEGIN
  CREATE TABLE IF NOT EXISTS goals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    target_date date,
    source text NOT NULL DEFAULT 'personal' CHECK (source IN ('system', 'personal')),
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Enable RLS
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Users can view own goals" ON goals;
CREATE POLICY "Users can view own goals"
  ON goals FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own goals" ON goals;
CREATE POLICY "Users can create own goals"
  ON goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own goals" ON goals;
CREATE POLICY "Users can update own goals"
  ON goals FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own goals" ON goals;
CREATE POLICY "Users can delete own goals"
  ON goals FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- MEMBER_PHRASE_CARDS TABLE RLS
-- ============================================
-- (Table should already exist from phrases_learning_ladder migration)

-- Enable RLS (safe to run even if already enabled)
ALTER TABLE IF EXISTS public.member_phrase_cards ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Members can view their own cards" ON public.member_phrase_cards;
CREATE POLICY "Members can view their own cards"
  ON public.member_phrase_cards FOR SELECT
  USING (auth.uid() = member_id);

DROP POLICY IF EXISTS "Members can insert their own cards" ON public.member_phrase_cards;
CREATE POLICY "Members can insert their own cards"
  ON public.member_phrase_cards FOR INSERT
  WITH CHECK (auth.uid() = member_id);

DROP POLICY IF EXISTS "Members can update their own cards" ON public.member_phrase_cards;
CREATE POLICY "Members can update their own cards"
  ON public.member_phrase_cards FOR UPDATE
  USING (auth.uid() = member_id)
  WITH CHECK (auth.uid() = member_id);

DROP POLICY IF EXISTS "Members can delete their own cards" ON public.member_phrase_cards;
CREATE POLICY "Members can delete their own cards"
  ON public.member_phrase_cards FOR DELETE
  USING (auth.uid() = member_id);

-- ============================================
-- HABIT_CELLS TABLE RLS
-- ============================================
-- Enable RLS (safe to run even if already enabled)
ALTER TABLE IF EXISTS habit_cells ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Users can view own habit cells" ON habit_cells;
CREATE POLICY "Users can view own habit cells"
  ON habit_cells FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own habit cells" ON habit_cells;
CREATE POLICY "Users can create own habit cells"
  ON habit_cells FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own habit cells" ON habit_cells;
CREATE POLICY "Users can update own habit cells"
  ON habit_cells FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own habit cells" ON habit_cells;
CREATE POLICY "Users can delete own habit cells"
  ON habit_cells FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON habits TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON habit_cells TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON goals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_phrase_cards TO authenticated;
