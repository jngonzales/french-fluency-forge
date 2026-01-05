-- User Phoneme Statistics Tracking
-- Tracks per-user pronunciation accuracy for each French phoneme

-- ============================================================================
-- USER PHONEME STATS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_phoneme_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phoneme TEXT NOT NULL,
  
  -- Statistics
  attempts INTEGER NOT NULL DEFAULT 0,
  mean_accuracy FLOAT NOT NULL DEFAULT 0, -- 0-100
  confidence FLOAT NOT NULL DEFAULT 0, -- 0-1
  
  -- Tracking
  last_tested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- One row per user per phoneme
  UNIQUE(user_id, phoneme)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_phoneme_stats_user 
  ON public.user_phoneme_stats(user_id);

CREATE INDEX IF NOT EXISTS idx_user_phoneme_stats_confidence 
  ON public.user_phoneme_stats(user_id, confidence DESC);

CREATE INDEX IF NOT EXISTS idx_user_phoneme_stats_accuracy 
  ON public.user_phoneme_stats(user_id, mean_accuracy ASC);

CREATE INDEX IF NOT EXISTS idx_user_phoneme_stats_attempts 
  ON public.user_phoneme_stats(user_id, attempts ASC);

-- ============================================================================
-- EXTEND PRONUNCIATION RECORDINGS
-- ============================================================================

-- Add phoneme data to pronunciation recordings
ALTER TABLE public.pronunciation_recordings
  ADD COLUMN IF NOT EXISTS phoneme_scores JSONB,
  ADD COLUMN IF NOT EXISTS phoneme_coverage JSONB,
  ADD COLUMN IF NOT EXISTS phrase_id TEXT,
  ADD COLUMN IF NOT EXISTS phrase_ipa TEXT;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.user_phoneme_stats ENABLE ROW LEVEL SECURITY;

-- Users can view their own phoneme stats
CREATE POLICY "Users can view own phoneme stats" 
  ON public.user_phoneme_stats
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own phoneme stats
CREATE POLICY "Users can insert own phoneme stats" 
  ON public.user_phoneme_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own phoneme stats
CREATE POLICY "Users can update own phoneme stats" 
  ON public.user_phoneme_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update phoneme stats (online mean calculation)
CREATE OR REPLACE FUNCTION public.update_user_phoneme_stat(
  p_user_id UUID,
  p_phoneme TEXT,
  p_accuracy FLOAT
)
RETURNS void AS $$
DECLARE
  v_current_attempts INTEGER;
  v_current_mean FLOAT;
  v_new_attempts INTEGER;
  v_new_mean FLOAT;
  v_new_confidence FLOAT;
BEGIN
  -- Get current stats (if exists)
  SELECT attempts, mean_accuracy
  INTO v_current_attempts, v_current_mean
  FROM public.user_phoneme_stats
  WHERE user_id = p_user_id AND phoneme = p_phoneme;

  IF FOUND THEN
    -- Update existing record (online mean)
    v_new_attempts := v_current_attempts + 1;
    v_new_mean := (v_current_mean * v_current_attempts + p_accuracy) / v_new_attempts;
    v_new_confidence := 1 - EXP(-v_new_attempts / 12.0);

    UPDATE public.user_phoneme_stats
    SET 
      attempts = v_new_attempts,
      mean_accuracy = v_new_mean,
      confidence = v_new_confidence,
      last_tested_at = now(),
      updated_at = now()
    WHERE user_id = p_user_id AND phoneme = p_phoneme;
  ELSE
    -- Insert new record
    v_new_confidence := 1 - EXP(-1 / 12.0);

    INSERT INTO public.user_phoneme_stats (
      user_id,
      phoneme,
      attempts,
      mean_accuracy,
      confidence,
      last_tested_at
    ) VALUES (
      p_user_id,
      p_phoneme,
      1,
      p_accuracy,
      v_new_confidence,
      now()
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER FOR UPDATED_AT
-- ============================================================================

CREATE TRIGGER update_user_phoneme_stats_updated_at
  BEFORE UPDATE ON public.user_phoneme_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_speaking_assessment_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.user_phoneme_stats IS 'Tracks per-user pronunciation accuracy for each French phoneme over time';
COMMENT ON COLUMN public.user_phoneme_stats.phoneme IS 'IPA symbol (e.g., /u/, /ʁ/, /ɛ̃/)';
COMMENT ON COLUMN public.user_phoneme_stats.attempts IS 'Number of times this phoneme has been tested';
COMMENT ON COLUMN public.user_phoneme_stats.mean_accuracy IS 'Average accuracy score 0-100 (online mean)';
COMMENT ON COLUMN public.user_phoneme_stats.confidence IS 'Confidence in the mean (0-1), formula: 1 - exp(-attempts/12)';
COMMENT ON FUNCTION public.update_user_phoneme_stat IS 'Updates phoneme stats using online mean calculation';

