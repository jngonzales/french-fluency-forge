-- Create comprehension_items table
CREATE TABLE IF NOT EXISTS public.comprehension_items (
  id TEXT PRIMARY KEY,
  language TEXT NOT NULL DEFAULT 'fr-FR',
  cefr_level TEXT NOT NULL CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  transcript_fr TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  estimated_duration_s NUMERIC NOT NULL,
  prompt_fr TEXT NOT NULL,
  prompt_en TEXT NOT NULL,
  options JSONB NOT NULL,
  answer_key JSONB NOT NULL,
  audio_url TEXT,
  audio_storage_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_comprehension_items_cefr ON public.comprehension_items(cefr_level);
CREATE INDEX IF NOT EXISTS idx_comprehension_items_language ON public.comprehension_items(language);

-- Enable RLS
ALTER TABLE public.comprehension_items ENABLE ROW LEVEL SECURITY;

-- Public read access (items are reference data)
DROP POLICY IF EXISTS "Anyone can read comprehension items" ON public.comprehension_items;
CREATE POLICY "Anyone can read comprehension items"
  ON public.comprehension_items
  FOR SELECT
  USING (true);

-- Only admins can modify (via service role or admin check)
DROP POLICY IF EXISTS "Admins can insert comprehension items" ON public.comprehension_items;
CREATE POLICY "Admins can insert comprehension items"
  ON public.comprehension_items
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND is_admin_user(profiles.email)
  ));

DROP POLICY IF EXISTS "Admins can update comprehension items" ON public.comprehension_items;
CREATE POLICY "Admins can update comprehension items"
  ON public.comprehension_items
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND is_admin_user(profiles.email)
  ));

DROP POLICY IF EXISTS "Admins can delete comprehension items" ON public.comprehension_items;
CREATE POLICY "Admins can delete comprehension items"
  ON public.comprehension_items
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND is_admin_user(profiles.email)
  ));

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_comprehension_items_updated_at ON public.comprehension_items;
CREATE TRIGGER update_comprehension_items_updated_at
  BEFORE UPDATE ON public.comprehension_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
