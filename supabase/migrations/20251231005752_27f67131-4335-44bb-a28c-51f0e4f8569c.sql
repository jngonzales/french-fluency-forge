-- Create fluency recordings table to track all attempts
CREATE TABLE public.fluency_recordings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  item_id TEXT NOT NULL, -- e.g., 'fluency-1', 'fluency-2'
  attempt_number INTEGER NOT NULL DEFAULT 1,
  used_for_scoring BOOLEAN NOT NULL DEFAULT true,
  superseded BOOLEAN NOT NULL DEFAULT false,
  
  -- Analysis results (stored, but never shown to user)
  transcript TEXT,
  word_count INTEGER,
  duration_seconds NUMERIC(10, 2),
  wpm INTEGER,
  pause_count INTEGER,
  total_pause_duration NUMERIC(10, 2),
  
  -- Storage reference (audio stored in blob storage, not DB)
  audio_storage_path TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Ensure unique attempt numbers per item per session
  UNIQUE(session_id, item_id, attempt_number)
);

-- Add fluency_locked column to assessment_sessions to track lock state
ALTER TABLE public.assessment_sessions 
ADD COLUMN fluency_locked BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN fluency_locked_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient queries
CREATE INDEX idx_fluency_recordings_session ON public.fluency_recordings(session_id);
CREATE INDEX idx_fluency_recordings_user ON public.fluency_recordings(user_id);
CREATE INDEX idx_fluency_recordings_scoring ON public.fluency_recordings(session_id, item_id, used_for_scoring) WHERE used_for_scoring = true;

-- Enable RLS
ALTER TABLE public.fluency_recordings ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only access their own recordings
CREATE POLICY "Users can view own fluency recordings"
ON public.fluency_recordings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fluency recordings"
ON public.fluency_recordings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fluency recordings"
ON public.fluency_recordings
FOR UPDATE
USING (auth.uid() = user_id);

-- Create event logging table for fluency events
CREATE TABLE public.fluency_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'fluency_recording_started',
    'fluency_recording_completed',
    'fluency_redo_clicked',
    'fluency_redo_confirmed',
    'fluency_redo_cancelled',
    'fluency_module_locked'
  )),
  item_id TEXT,
  attempt_number INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient event queries
CREATE INDEX idx_fluency_events_session ON public.fluency_events(session_id);

-- Enable RLS on events
ALTER TABLE public.fluency_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for events
CREATE POLICY "Users can view own fluency events"
ON public.fluency_events
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fluency events"
ON public.fluency_events
FOR INSERT
WITH CHECK (auth.uid() = user_id);