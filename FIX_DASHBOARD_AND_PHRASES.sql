-- FIX_DASHBOARD_AND_PHRASES.sql
-- Apply this in Supabase SQL Editor

-- ============================================================================
-- 1. Backfill completed_at for existing completed sessions
-- ============================================================================
UPDATE assessment_sessions 
SET completed_at = created_at 
WHERE status = 'completed' 
  AND completed_at IS NULL;

-- ============================================================================
-- 2. Create member_phrase_settings table if it doesn't exist
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.member_phrase_settings (
  member_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  new_per_day INTEGER NOT NULL DEFAULT 20,
  reviews_per_day INTEGER NOT NULL DEFAULT 100,
  target_retention REAL NOT NULL DEFAULT 0.9,
  speech_feedback_enabled BOOLEAN NOT NULL DEFAULT false,
  auto_assess_enabled BOOLEAN NOT NULL DEFAULT false,
  recognition_shadow_default BOOLEAN NOT NULL DEFAULT false,
  show_time_to_recall BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 3. Enable RLS on member_phrase_settings
-- ============================================================================
ALTER TABLE public.member_phrase_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. Create RLS policies for member_phrase_settings
-- ============================================================================
DROP POLICY IF EXISTS "Members can view their own settings" ON public.member_phrase_settings;
CREATE POLICY "Members can view their own settings"
  ON public.member_phrase_settings FOR SELECT
  USING (auth.uid() = member_id);

DROP POLICY IF EXISTS "Members can insert their own settings" ON public.member_phrase_settings;
CREATE POLICY "Members can insert their own settings"
  ON public.member_phrase_settings FOR INSERT
  WITH CHECK (auth.uid() = member_id);

DROP POLICY IF EXISTS "Members can update their own settings" ON public.member_phrase_settings;
CREATE POLICY "Members can update their own settings"
  ON public.member_phrase_settings FOR UPDATE
  USING (auth.uid() = member_id)
  WITH CHECK (auth.uid() = member_id);

-- ============================================================================
-- 5. Create phrase_explanations table if it doesn't exist
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.phrase_explanations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phrase_id UUID NOT NULL REFERENCES public.phrases(id) ON DELETE CASCADE,
  explanation_json JSONB NOT NULL,
  model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  version INTEGER NOT NULL DEFAULT 1,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(phrase_id)
);

-- ============================================================================
-- 6. Enable RLS on phrase_explanations
-- ============================================================================
ALTER TABLE public.phrase_explanations ENABLE ROW LEVEL SECURITY;

-- Everyone can read explanations
DROP POLICY IF EXISTS "Phrase explanations are viewable by everyone" ON public.phrase_explanations;
CREATE POLICY "Phrase explanations are viewable by everyone"
  ON public.phrase_explanations FOR SELECT
  USING (true);

-- Service role can insert/update (edge function uses service role)
DROP POLICY IF EXISTS "Service role can manage phrase explanations" ON public.phrase_explanations;
CREATE POLICY "Service role can manage phrase explanations"
  ON public.phrase_explanations FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- 7. Verify assessment_sessions has completed_at column
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assessment_sessions' 
    AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE public.assessment_sessions 
    ADD COLUMN completed_at TIMESTAMPTZ;
  END IF;
END $$;

-- ============================================================================
-- 8. Create updated_at trigger for member_phrase_settings
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_member_phrase_settings_updated_at ON public.member_phrase_settings;
CREATE TRIGGER update_member_phrase_settings_updated_at
  BEFORE UPDATE ON public.member_phrase_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- Done! Check results:
-- ============================================================================
SELECT 'Sessions with completed_at:' as check, count(*) 
FROM assessment_sessions 
WHERE completed_at IS NOT NULL;
