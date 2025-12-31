-- Create skill_recordings table for confidence, syntax, and conversation modules
CREATE TABLE public.skill_recordings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_type TEXT NOT NULL CHECK (module_type IN ('confidence', 'syntax', 'conversation')),
  item_id TEXT NOT NULL,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  audio_storage_path TEXT,
  transcript TEXT,
  duration_seconds NUMERIC,
  word_count INTEGER,
  ai_score NUMERIC,
  ai_feedback TEXT,
  ai_breakdown JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'uploading', 'processing', 'completed', 'error')),
  error_message TEXT,
  superseded BOOLEAN NOT NULL DEFAULT false,
  used_for_scoring BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Add lock columns to assessment_sessions for new modules
ALTER TABLE public.assessment_sessions 
  ADD COLUMN confidence_locked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN confidence_locked_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN syntax_locked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN syntax_locked_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN conversation_locked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN conversation_locked_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS on skill_recordings
ALTER TABLE public.skill_recordings ENABLE ROW LEVEL SECURITY;

-- RLS policies for skill_recordings
CREATE POLICY "Users can insert own skill recordings"
ON public.skill_recordings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own skill recordings"
ON public.skill_recordings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own skill recordings"
ON public.skill_recordings
FOR UPDATE
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_skill_recordings_session_id ON public.skill_recordings(session_id);
CREATE INDEX idx_skill_recordings_user_id ON public.skill_recordings(user_id);
CREATE INDEX idx_skill_recordings_module_type ON public.skill_recordings(module_type);