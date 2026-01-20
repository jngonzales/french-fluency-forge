-- Add progress tracking columns to assessment_sessions
-- This enables resuming sessions at the exact point where the user left off

-- Add current_module column to track which module the user is on
ALTER TABLE public.assessment_sessions
ADD COLUMN IF NOT EXISTS current_module TEXT CHECK (
  current_module IS NULL OR 
  current_module IN ('pronunciation', 'comprehension', 'confidence', 'conversation')
);

-- Add current_item_index column to track progress within a module
ALTER TABLE public.assessment_sessions
ADD COLUMN IF NOT EXISTS current_item_index INTEGER DEFAULT 0;

-- Add seed column for deterministic phrase selection on resume
ALTER TABLE public.assessment_sessions
ADD COLUMN IF NOT EXISTS phrase_seed INTEGER;

-- Add selected_phrase_ids to store the exact phrases selected for this session
ALTER TABLE public.assessment_sessions
ADD COLUMN IF NOT EXISTS selected_phrase_ids JSONB DEFAULT '[]'::jsonb;

-- Comment for documentation
COMMENT ON COLUMN public.assessment_sessions.current_module IS 'Current module being taken: pronunciation, comprehension, confidence, or conversation';
COMMENT ON COLUMN public.assessment_sessions.current_item_index IS 'Current item index within the current module (0-based)';
COMMENT ON COLUMN public.assessment_sessions.phrase_seed IS 'Random seed used for deterministic phrase selection';
COMMENT ON COLUMN public.assessment_sessions.selected_phrase_ids IS 'Array of phrase IDs selected for this session, in order';
