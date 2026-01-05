-- Speaking Assessment Sessions and Items (Monster Spec Implementation)
-- This migration creates new tables for resumable, deterministic speaking assessment sessions

-- ============================================================================
-- NEW TABLES: assessment_sessions and assessment_items
-- ============================================================================

-- Assessment Sessions table (separate from existing assessment_sessions for speaking checkup)
CREATE TABLE IF NOT EXISTS public.speaking_assessment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('full', 'single_module')),
  single_module_type TEXT NULL CHECK (single_module_type IS NULL OR single_module_type IN ('pronunciation', 'fluency', 'confidence', 'syntax', 'conversation', 'comprehension')),
  status TEXT NOT NULL CHECK (status IN ('created', 'in_progress', 'completed', 'abandoned')) DEFAULT 'created',
  
  -- Deterministic prompt selection
  seed INTEGER NOT NULL,
  prompt_version TEXT NOT NULL DEFAULT '2026-01-04',
  scorer_version TEXT NOT NULL DEFAULT '2026-01-04',
  asr_version TEXT NOT NULL DEFAULT 'whisper-1',
  
  -- Progress tracking
  current_module TEXT NULL,
  current_item_index INTEGER NOT NULL DEFAULT 0,
  selected_prompt_ids JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Metadata
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Assessment Items table (tracks individual items within sessions)
CREATE TABLE IF NOT EXISTS public.speaking_assessment_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.speaking_assessment_sessions(id) ON DELETE CASCADE,
  module_type TEXT NOT NULL CHECK (module_type IN ('pronunciation', 'fluency', 'confidence', 'syntax', 'conversation', 'comprehension')),
  item_index INTEGER NOT NULL,
  prompt_id TEXT NOT NULL,
  prompt_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('not_started', 'recording', 'processing', 'completed', 'error')) DEFAULT 'not_started',
  attempt_number INTEGER NOT NULL DEFAULT 1,
  result_ref JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Unique constraint: one item per session/module/index
  UNIQUE(session_id, module_type, item_index)
);

-- ============================================================================
-- EXTEND EXISTING RECORDING TABLES
-- ============================================================================

-- Add session/item tracking to fluency_recordings
ALTER TABLE public.fluency_recordings
  ADD COLUMN IF NOT EXISTS speaking_session_id UUID REFERENCES public.speaking_assessment_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS speaking_item_id UUID REFERENCES public.speaking_assessment_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS prompt_id TEXT,
  ADD COLUMN IF NOT EXISTS prompt_version TEXT,
  ADD COLUMN IF NOT EXISTS scorer_version TEXT,
  ADD COLUMN IF NOT EXISTS asr_version TEXT;

-- Add session/item tracking to skill_recordings
ALTER TABLE public.skill_recordings
  ADD COLUMN IF NOT EXISTS speaking_session_id UUID REFERENCES public.speaking_assessment_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS speaking_item_id UUID REFERENCES public.speaking_assessment_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS prompt_id TEXT,
  ADD COLUMN IF NOT EXISTS prompt_version TEXT,
  ADD COLUMN IF NOT EXISTS scorer_version TEXT,
  ADD COLUMN IF NOT EXISTS asr_version TEXT;

-- Add session/item tracking to pronunciation_recordings (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pronunciation_recordings') THEN
    ALTER TABLE public.pronunciation_recordings
      ADD COLUMN IF NOT EXISTS speaking_session_id UUID REFERENCES public.speaking_assessment_sessions(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS speaking_item_id UUID REFERENCES public.speaking_assessment_items(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS prompt_id TEXT,
      ADD COLUMN IF NOT EXISTS prompt_version TEXT,
      ADD COLUMN IF NOT EXISTS scorer_version TEXT,
      ADD COLUMN IF NOT EXISTS asr_version TEXT;
  END IF;
END $$;

-- Add session/item tracking to comprehension_recordings
ALTER TABLE public.comprehension_recordings
  ADD COLUMN IF NOT EXISTS speaking_session_id UUID REFERENCES public.speaking_assessment_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS speaking_item_id UUID REFERENCES public.speaking_assessment_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS prompt_id TEXT,
  ADD COLUMN IF NOT EXISTS prompt_version TEXT,
  ADD COLUMN IF NOT EXISTS scorer_version TEXT,
  ADD COLUMN IF NOT EXISTS asr_version TEXT;

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_speaking_sessions_user_status 
  ON public.speaking_assessment_sessions(user_id, status);

CREATE INDEX IF NOT EXISTS idx_speaking_sessions_created 
  ON public.speaking_assessment_sessions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_speaking_items_session_module 
  ON public.speaking_assessment_items(session_id, module_type);

CREATE INDEX IF NOT EXISTS idx_speaking_items_status 
  ON public.speaking_assessment_items(session_id, status);

CREATE INDEX IF NOT EXISTS idx_fluency_recordings_speaking_session 
  ON public.fluency_recordings(speaking_session_id);

CREATE INDEX IF NOT EXISTS idx_skill_recordings_speaking_session 
  ON public.skill_recordings(speaking_session_id);

CREATE INDEX IF NOT EXISTS idx_comprehension_recordings_speaking_session 
  ON public.comprehension_recordings(speaking_session_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.speaking_assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speaking_assessment_items ENABLE ROW LEVEL SECURITY;

-- Speaking assessment sessions policies
CREATE POLICY "Users can view own speaking sessions" 
  ON public.speaking_assessment_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own speaking sessions" 
  ON public.speaking_assessment_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own speaking sessions" 
  ON public.speaking_assessment_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Speaking assessment items policies
CREATE POLICY "Users can view own speaking items" 
  ON public.speaking_assessment_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.speaking_assessment_sessions
      WHERE id = speaking_assessment_items.session_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert speaking items via sessions" 
  ON public.speaking_assessment_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.speaking_assessment_sessions
      WHERE id = speaking_assessment_items.session_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own speaking items" 
  ON public.speaking_assessment_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.speaking_assessment_sessions
      WHERE id = speaking_assessment_items.session_id
      AND user_id = auth.uid()
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_speaking_assessment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_speaking_sessions_updated_at
  BEFORE UPDATE ON public.speaking_assessment_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_speaking_assessment_updated_at();

CREATE TRIGGER update_speaking_items_updated_at
  BEFORE UPDATE ON public.speaking_assessment_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_speaking_assessment_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.speaking_assessment_sessions IS 'Tracks speaking assessment sessions with deterministic prompt selection and resume capability';
COMMENT ON TABLE public.speaking_assessment_items IS 'Individual items within speaking assessment sessions (prompts/questions/pictures)';
COMMENT ON COLUMN public.speaking_assessment_sessions.seed IS 'Random seed for deterministic prompt selection';
COMMENT ON COLUMN public.speaking_assessment_sessions.selected_prompt_ids IS 'Map of module -> array of selected prompt IDs';
COMMENT ON COLUMN public.speaking_assessment_items.result_ref IS 'Reference to result record (table + id)';

