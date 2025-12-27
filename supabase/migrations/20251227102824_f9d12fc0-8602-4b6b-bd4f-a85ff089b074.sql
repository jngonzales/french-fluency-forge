-- Add archetype column to store quiz results
ALTER TABLE public.assessment_sessions 
ADD COLUMN archetype text;