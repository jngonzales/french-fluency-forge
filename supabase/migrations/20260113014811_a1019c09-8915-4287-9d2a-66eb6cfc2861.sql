-- ============================================
-- MIGRATION: HABITS, GOALS, AND AUDIO BUCKET (without phrases)
-- ============================================

-- ============================================
-- PART 1: HABITS TABLE
-- ============================================
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

CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

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
-- PART 2: HABIT CELLS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS habit_cells (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text NOT NULL DEFAULT 'na' CHECK (status IN ('done', 'missed', 'na', 'future')),
  intensity integer CHECK (intensity IS NULL OR (intensity >= 1 AND intensity <= 6)),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(habit_id, date)
);

CREATE INDEX IF NOT EXISTS idx_habit_cells_habit_id ON habit_cells(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_cells_user_id ON habit_cells(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_cells_date ON habit_cells(date);

ALTER TABLE habit_cells ENABLE ROW LEVEL SECURITY;

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
-- PART 3: GOALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  acceptance_criteria text,
  deadline date,
  goal_type text NOT NULL CHECK (goal_type IN ('skill', 'volume', 'freeform')),
  locked boolean NOT NULL DEFAULT false,
  dimension text CHECK (dimension IS NULL OR dimension IN (
    'pronunciation', 'fluency', 'confidence', 'syntax', 'conversation', 'comprehension'
  )),
  target_score integer CHECK (target_score IS NULL OR (target_score >= 0 AND target_score <= 100)),
  metric text,
  target_value integer,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

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
-- PART 4: UPDATED_AT TRIGGERS (only if function doesn't exist)
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_habits_updated_at ON habits;
CREATE TRIGGER update_habits_updated_at
  BEFORE UPDATE ON habits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_habit_cells_updated_at ON habit_cells;
CREATE TRIGGER update_habit_cells_updated_at
  BEFORE UPDATE ON habit_cells
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_goals_updated_at ON goals;
CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PART 5: PHRASES-AUDIO STORAGE BUCKET
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'phrases-audio',
  'phrases-audio',
  true,
  10485760,
  ARRAY['audio/mpeg', 'audio/wav', 'audio/mp3']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read access for phrases-audio" ON storage.objects;
CREATE POLICY "Public read access for phrases-audio"
ON storage.objects
FOR SELECT
USING (bucket_id = 'phrases-audio');

DROP POLICY IF EXISTS "Authenticated users can upload to phrases-audio" ON storage.objects;
CREATE POLICY "Authenticated users can upload to phrases-audio"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'phrases-audio' AND
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Authenticated users can update phrases-audio" ON storage.objects;
CREATE POLICY "Authenticated users can update phrases-audio"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'phrases-audio' AND
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Authenticated users can delete phrases-audio" ON storage.objects;
CREATE POLICY "Authenticated users can delete phrases-audio"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'phrases-audio' AND
  auth.role() = 'authenticated'
);