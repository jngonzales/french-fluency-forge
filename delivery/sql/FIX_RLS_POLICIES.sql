-- ============================================================================
-- FIX RLS POLICIES FOR ALL TABLES
-- Run this if you get "permission denied" errors
-- ============================================================================

-- ============================================================================
-- PROFILES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================================
-- CONSENT_RECORDS
-- ============================================================================
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own consent" ON public.consent_records;
CREATE POLICY "Users can view own consent" ON public.consent_records FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own consent" ON public.consent_records;
CREATE POLICY "Users can insert own consent" ON public.consent_records FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- ASSESSMENT_SESSIONS
-- ============================================================================
ALTER TABLE public.assessment_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own sessions" ON public.assessment_sessions;
CREATE POLICY "Users can view own sessions" ON public.assessment_sessions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.assessment_sessions;
CREATE POLICY "Users can insert own sessions" ON public.assessment_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own sessions" ON public.assessment_sessions;
CREATE POLICY "Users can update own sessions" ON public.assessment_sessions FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- FLUENCY_RECORDINGS
-- ============================================================================
ALTER TABLE public.fluency_recordings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own fluency recordings" ON public.fluency_recordings;
CREATE POLICY "Users can view own fluency recordings" ON public.fluency_recordings FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own fluency recordings" ON public.fluency_recordings;
CREATE POLICY "Users can insert own fluency recordings" ON public.fluency_recordings FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own fluency recordings" ON public.fluency_recordings;
CREATE POLICY "Users can update own fluency recordings" ON public.fluency_recordings FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- FLUENCY_EVENTS
-- ============================================================================
ALTER TABLE public.fluency_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own fluency events" ON public.fluency_events;
CREATE POLICY "Users can view own fluency events" ON public.fluency_events FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own fluency events" ON public.fluency_events;
CREATE POLICY "Users can insert own fluency events" ON public.fluency_events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- SKILL_RECORDINGS
-- ============================================================================
ALTER TABLE public.skill_recordings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own skill recordings" ON public.skill_recordings;
CREATE POLICY "Users can view own skill recordings" ON public.skill_recordings FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own skill recordings" ON public.skill_recordings;
CREATE POLICY "Users can insert own skill recordings" ON public.skill_recordings FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own skill recordings" ON public.skill_recordings;
CREATE POLICY "Users can update own skill recordings" ON public.skill_recordings FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- COMPREHENSION_RECORDINGS
-- ============================================================================
ALTER TABLE public.comprehension_recordings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own comprehension recordings" ON public.comprehension_recordings;
CREATE POLICY "Users can view own comprehension recordings" ON public.comprehension_recordings FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own comprehension recordings" ON public.comprehension_recordings;
CREATE POLICY "Users can insert own comprehension recordings" ON public.comprehension_recordings FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own comprehension recordings" ON public.comprehension_recordings;
CREATE POLICY "Users can update own comprehension recordings" ON public.comprehension_recordings FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- PURCHASES
-- ============================================================================
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own purchases" ON public.purchases;
CREATE POLICY "Users can view own purchases" ON public.purchases FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- ARCHETYPE_FEEDBACK
-- ============================================================================
ALTER TABLE public.archetype_feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own feedback" ON public.archetype_feedback;
CREATE POLICY "Users can view own feedback" ON public.archetype_feedback FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own feedback" ON public.archetype_feedback;
CREATE POLICY "Users can insert own feedback" ON public.archetype_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- CONFIDENCE_QUESTIONNAIRE_RESPONSES
-- ============================================================================
ALTER TABLE public.confidence_questionnaire_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own responses" ON public.confidence_questionnaire_responses;
CREATE POLICY "Users can view own responses" ON public.confidence_questionnaire_responses FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own responses" ON public.confidence_questionnaire_responses;
CREATE POLICY "Users can insert own responses" ON public.confidence_questionnaire_responses FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- GRANT ALL TO AUTHENTICATED (fallback)
-- ============================================================================
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.consent_records TO authenticated;
GRANT ALL ON public.assessment_sessions TO authenticated;
GRANT ALL ON public.fluency_recordings TO authenticated;
GRANT ALL ON public.fluency_events TO authenticated;
GRANT ALL ON public.skill_recordings TO authenticated;
GRANT ALL ON public.comprehension_recordings TO authenticated;
GRANT ALL ON public.purchases TO authenticated;
GRANT ALL ON public.archetype_feedback TO authenticated;
GRANT ALL ON public.confidence_questionnaire_responses TO authenticated;

-- ============================================================================
-- SCORING_TRACES (for calibration console)
-- ============================================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'scoring_traces') THEN
    ALTER TABLE public.scoring_traces ENABLE ROW LEVEL SECURITY;
    
    -- Users can read their own traces (via session ownership)
    DROP POLICY IF EXISTS "Users can read own scoring traces" ON public.scoring_traces;
    CREATE POLICY "Users can read own scoring traces" ON public.scoring_traces
      FOR SELECT USING (
        session_id IN (SELECT id FROM assessment_sessions WHERE user_id = auth.uid())
      );
    
    -- Users can insert their own traces
    DROP POLICY IF EXISTS "Users can insert own scoring traces" ON public.scoring_traces;
    CREATE POLICY "Users can insert own scoring traces" ON public.scoring_traces
      FOR INSERT WITH CHECK (
        session_id IN (SELECT id FROM assessment_sessions WHERE user_id = auth.uid())
      );
    
    GRANT ALL ON public.scoring_traces TO authenticated;
  END IF;
END $$;

-- ============================================================================
-- DONE
-- ============================================================================
