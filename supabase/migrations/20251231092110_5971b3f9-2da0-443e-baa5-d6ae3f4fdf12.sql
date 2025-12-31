-- Add comprehension_locked columns to assessment_sessions
ALTER TABLE public.assessment_sessions 
ADD COLUMN IF NOT EXISTS comprehension_locked boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS comprehension_locked_at timestamp with time zone;

-- Create comprehension_recordings table
CREATE TABLE IF NOT EXISTS public.comprehension_recordings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  item_id text NOT NULL,
  attempt_number integer NOT NULL DEFAULT 1,
  audio_storage_path text,
  transcript text,
  audio_played_at timestamp with time zone,
  status text NOT NULL DEFAULT 'pending',
  ai_score numeric,
  ai_feedback_fr text,
  understood_facts jsonb,
  intent_match jsonb,
  ai_confidence numeric,
  superseded boolean NOT NULL DEFAULT false,
  used_for_scoring boolean NOT NULL DEFAULT true,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

-- Enable Row Level Security
ALTER TABLE public.comprehension_recordings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comprehension_recordings
CREATE POLICY "Users can insert own comprehension recordings" 
ON public.comprehension_recordings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comprehension recordings" 
ON public.comprehension_recordings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view own comprehension recordings" 
ON public.comprehension_recordings 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_comprehension_recordings_session 
ON public.comprehension_recordings(session_id);

CREATE INDEX IF NOT EXISTS idx_comprehension_recordings_user 
ON public.comprehension_recordings(user_id);