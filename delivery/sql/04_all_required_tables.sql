-- ============================================================================
-- COMPLETE MIGRATION FILE FOR FRENCH FLUENCY FORGE
-- ============================================================================
-- Run this entire file in Supabase SQL Editor to set up all required tables.
-- All statements are idempotent (safe to run multiple times).
-- ============================================================================


-- ============================================================================
-- 1. SCORING TRACES TABLE (for Calibration Console)
-- ============================================================================
CREATE TABLE IF NOT EXISTS scoring_traces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES assessment_sessions(id) ON DELETE CASCADE,
  module_type TEXT NOT NULL CHECK (module_type IN ('fluency', 'syntax', 'conversation', 'confidence', 'pronunciation', 'comprehension')),
  trace_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scoring_traces_session ON scoring_traces(session_id);
CREATE INDEX IF NOT EXISTS idx_scoring_traces_module ON scoring_traces(module_type);
CREATE INDEX IF NOT EXISTS idx_scoring_traces_created ON scoring_traces(created_at DESC);

ALTER TABLE scoring_traces ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scoring_traces' AND policyname = 'Users can read own scoring traces') THEN
    CREATE POLICY "Users can read own scoring traces" ON scoring_traces FOR SELECT
    USING (session_id IN (SELECT id FROM assessment_sessions WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scoring_traces' AND policyname = 'Users can insert own scoring traces') THEN
    CREATE POLICY "Users can insert own scoring traces" ON scoring_traces FOR INSERT
    WITH CHECK (session_id IN (SELECT id FROM assessment_sessions WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scoring_traces' AND policyname = 'Service role full access to scoring traces') THEN
    CREATE POLICY "Service role full access to scoring traces" ON scoring_traces FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');
  END IF;
END $$;


-- ============================================================================
-- 2. COMPREHENSION ITEMS TABLE (for Listening Comprehension)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.comprehension_items (
  id TEXT PRIMARY KEY,
  language TEXT NOT NULL DEFAULT 'fr-FR',
  cefr_level TEXT NOT NULL,
  transcript_fr TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  estimated_duration_s NUMERIC NOT NULL,
  prompt_fr TEXT NOT NULL,
  prompt_en TEXT NOT NULL,
  options JSONB NOT NULL,
  answer_key JSONB NOT NULL,
  audio_url TEXT,
  audio_storage_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comprehension_items_has_audio 
ON public.comprehension_items(audio_url) 
WHERE audio_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_comprehension_items_cefr 
ON public.comprehension_items(cefr_level);

ALTER TABLE public.comprehension_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comprehension_items' AND policyname = 'Anyone can read comprehension items') THEN
    CREATE POLICY "Anyone can read comprehension items" ON public.comprehension_items FOR SELECT USING (true);
  END IF;
END $$;


-- ============================================================================
-- 3. SEED COMPREHENSION ITEMS (French listening exercises)
-- ============================================================================
INSERT INTO public.comprehension_items (
  id, language, cefr_level, transcript_fr, word_count, estimated_duration_s,
  prompt_fr, prompt_en, options, answer_key
) VALUES
(
  'lc_fr_a1_0001',
  'fr-FR',
  'A1',
  'Il pleut fort. Marie cherche vite son parapluie, mais il est dans la voiture.',
  14,
  5.6,
  'Que se passe-t-il ? Sélectionne toutes les affirmations vraies.',
  'What is going on? Select all statements that are true.',
  '[
    {"id": "o1", "fr": "Il pleut fort.", "en": "It is raining hard."},
    {"id": "o2", "fr": "Marie cherche son parapluie.", "en": "Marie is looking for her umbrella."},
    {"id": "o3", "fr": "Le parapluie est dans la voiture.", "en": "The umbrella is in the car."},
    {"id": "o4", "fr": "Marie a oublié son parapluie au travail.", "en": "Marie forgot her umbrella at work."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3"]}'::jsonb
),
(
  'lc_fr_a1_0002',
  'fr-FR',
  'A1',
  'Au café, Paul commande un thé sans sucre, attend deux minutes, puis demande l''addition.',
  15,
  6.0,
  'Que se passe-t-il ? Sélectionne toutes les affirmations vraies.',
  'What is going on? Select all statements that are true.',
  '[
    {"id": "o1", "fr": "Paul commande un thé sans sucre.", "en": "Paul orders a tea with no sugar."},
    {"id": "o2", "fr": "Il attend deux minutes.", "en": "He waits two minutes."},
    {"id": "o3", "fr": "Il demande l''addition.", "en": "He asks for the bill."},
    {"id": "o4", "fr": "Paul commande un café.", "en": "Paul orders a coffee."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3"]}'::jsonb
),
(
  'lc_fr_a2_0003',
  'fr-FR',
  'A2',
  'Dans le bus, quelqu''un a oublié un sac bleu sous un siège. Le chauffeur l''annonce au micro.',
  17,
  6.8,
  'Que se passe-t-il ? Sélectionne toutes les affirmations vraies.',
  'What is going on? Select all statements that are true.',
  '[
    {"id": "o1", "fr": "Quelqu''un a oublié un sac bleu.", "en": "Someone forgot a blue bag."},
    {"id": "o2", "fr": "Le chauffeur l''annonce au micro.", "en": "The driver announces it."},
    {"id": "o3", "fr": "Le sac est sous un siège.", "en": "The bag is under a seat."},
    {"id": "o4", "fr": "Le sac est rouge.", "en": "The bag is red."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3"]}'::jsonb
),
(
  'lc_fr_a2_0004',
  'fr-FR',
  'A2',
  'On se retrouve à la station République à 18h. Désolé, mon bus est bloqué, je serai dix minutes en retard.',
  18,
  7.2,
  'Que se passe-t-il ? Sélectionne toutes les affirmations vraies.',
  'What is going on? Select all statements that are true.',
  '[
    {"id": "o1", "fr": "Le rendez-vous est à République.", "en": "The meeting is at République."},
    {"id": "o2", "fr": "Le rendez-vous est à 18h.", "en": "The meeting is at 6pm."},
    {"id": "o3", "fr": "La personne sera en retard.", "en": "The person will be late."},
    {"id": "o4", "fr": "Le rendez-vous est à 8h.", "en": "The meeting is at 8am."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3"]}'::jsonb
),
(
  'lc_fr_b1_0007',
  'fr-FR',
  'B1',
  'Le musée d''Orsay ferme exceptionnellement mardi prochain pour travaux. Les visiteurs ayant déjà acheté des billets peuvent demander un remboursement ou échanger leur billet pour une autre date.',
  32,
  12.8,
  'Que se passe-t-il ? Sélectionne toutes les affirmations vraies.',
  'What is going on? Select all statements that are true.',
  '[
    {"id": "o1", "fr": "Le musée ferme mardi.", "en": "The museum closes on Tuesday."},
    {"id": "o2", "fr": "C''est pour des travaux.", "en": "It is for maintenance work."},
    {"id": "o3", "fr": "On peut demander un remboursement.", "en": "You can ask for a refund."},
    {"id": "o4", "fr": "Le musée ferme définitivement.", "en": "The museum closes permanently."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3"]}'::jsonb
),
(
  'lc_fr_b2_0011',
  'fr-FR',
  'B2',
  'Suite à des travaux sur la ligne B, le trafic sera interrompu ce week-end entre Gare du Nord et Châtelet. Des bus de remplacement seront mis en place toutes les dix minutes.',
  32,
  12.8,
  'Que se passe-t-il ? Sélectionne toutes les affirmations vraies.',
  'What is going on? Select all statements that are true.',
  '[
    {"id": "o1", "fr": "Il y a des travaux sur la ligne B.", "en": "There is work on line B."},
    {"id": "o2", "fr": "Le trafic sera interrompu ce week-end.", "en": "Traffic will be interrupted this weekend."},
    {"id": "o3", "fr": "Des bus de remplacement sont prévus.", "en": "Replacement buses are planned."},
    {"id": "o4", "fr": "Les travaux durent un mois.", "en": "The work lasts a month."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3"]}'::jsonb
)
ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- 4. UPDATE COMPREHENSION ITEMS WITH AUDIO URLs
-- ============================================================================
UPDATE public.comprehension_items
SET audio_url = '/audio/comprehension/' || id || '.mp3'
WHERE id IN (
  'lc_fr_a1_0001',
  'lc_fr_a1_0002',
  'lc_fr_a2_0003',
  'lc_fr_a2_0004',
  'lc_fr_b1_0007',
  'lc_fr_b2_0011'
);


-- ============================================================================
-- 5. HABITS & GOALS TABLES (from Option B delivery)
-- ============================================================================
-- (These are already in 01_habits_goals.sql, but included here for completeness)

CREATE TABLE IF NOT EXISTS public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly')),
  source TEXT NOT NULL DEFAULT 'personal' CHECK (source IN ('system', 'personal')),
  intensity INTEGER CHECK (intensity >= 1 AND intensity <= 6),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.habit_cells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'future' CHECK (status IN ('done', 'missed', 'na', 'future')),
  intensity INTEGER CHECK (intensity >= 1 AND intensity <= 6),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(habit_id, date)
);

CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  acceptance_criteria TEXT,
  deadline DATE,
  goal_type TEXT NOT NULL DEFAULT 'freeform' CHECK (goal_type IN ('skill', 'volume', 'freeform')),
  locked BOOLEAN DEFAULT false,
  dimension TEXT,
  target_score INTEGER,
  target_value INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- 6. DONE!
-- ============================================================================
-- All required tables have been created or updated.
-- 
-- Verify by running:
--   SELECT COUNT(*) FROM comprehension_items WHERE audio_url IS NOT NULL;
--   (Should return 6 or more)
--
--   SELECT COUNT(*) FROM scoring_traces;
--   (Should return 0 - this is fine, traces are created during assessments)
