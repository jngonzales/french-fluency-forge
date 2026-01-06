-- Comprehension items table
CREATE TABLE IF NOT EXISTS public.comprehension_items (
  id TEXT PRIMARY KEY, -- e.g., "lc_fr_a1_0001"
  language TEXT NOT NULL DEFAULT 'fr-FR',
  cefr_level TEXT NOT NULL CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  transcript_fr TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  estimated_duration_s NUMERIC NOT NULL,
  prompt_fr TEXT NOT NULL,
  prompt_en TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of {id, fr, en}
  answer_key JSONB NOT NULL, -- {correct_option_ids: string[]}
  audio_url TEXT, -- Public URL to WAV file in storage
  audio_storage_path TEXT, -- Storage path for the audio file
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for filtering by audio availability
CREATE INDEX IF NOT EXISTS idx_comprehension_items_has_audio 
ON public.comprehension_items(audio_url) 
WHERE audio_url IS NOT NULL;

-- Index for CEFR level filtering
CREATE INDEX IF NOT EXISTS idx_comprehension_items_cefr 
ON public.comprehension_items(cefr_level);

-- Enable RLS
ALTER TABLE public.comprehension_items ENABLE ROW LEVEL SECURITY;

-- Public read access (items are not user-specific)
CREATE POLICY "Anyone can read comprehension items" 
ON public.comprehension_items 
FOR SELECT 
USING (true);

