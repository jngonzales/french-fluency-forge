-- Create table for confidence questionnaire responses
CREATE TABLE public.confidence_questionnaire_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  responses jsonb NOT NULL DEFAULT '{}',
  raw_score numeric,
  normalized_score numeric,
  honesty_flag boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (session_id)
);

-- Enable RLS
ALTER TABLE public.confidence_questionnaire_responses ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can insert own questionnaire responses"
ON public.confidence_questionnaire_responses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own questionnaire responses"
ON public.confidence_questionnaire_responses
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own questionnaire responses"
ON public.confidence_questionnaire_responses
FOR UPDATE
USING (auth.uid() = user_id);