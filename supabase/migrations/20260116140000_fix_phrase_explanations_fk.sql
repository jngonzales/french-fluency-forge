-- Drop foreign key constraint on phrase_explanations
-- This allows caching explanations for phrases that don't exist in the phrases table
-- (e.g., mock phrases defined in frontend code)

-- First, drop the UNIQUE constraint that might reference the FK
ALTER TABLE IF EXISTS public.phrase_explanations 
  DROP CONSTRAINT IF EXISTS phrase_explanations_phrase_id_key;

-- Drop the foreign key constraint
ALTER TABLE IF EXISTS public.phrase_explanations 
  DROP CONSTRAINT IF EXISTS phrase_explanations_phrase_id_fkey;

-- Recreate UNIQUE constraint without FK
ALTER TABLE IF EXISTS public.phrase_explanations 
  ADD CONSTRAINT phrase_explanations_phrase_id_key UNIQUE (phrase_id);

-- Also ensure service role can insert
DROP POLICY IF EXISTS "Service role can manage explanations" ON public.phrase_explanations;
CREATE POLICY "Service role can manage explanations"
  ON public.phrase_explanations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Ensure the column types are correct (in case table was created differently)
-- Note: This won't change if already correct
DO $$ 
BEGIN
  -- Check if explanation_json column exists, if not alter the table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'phrase_explanations' 
    AND column_name = 'explanation_json'
  ) THEN
    -- The table might have 'content' column instead, rename it
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'phrase_explanations' 
      AND column_name = 'content'
    ) THEN
      ALTER TABLE public.phrase_explanations RENAME COLUMN content TO explanation_json;
    ELSE
      -- Add the column if it doesn't exist at all
      ALTER TABLE public.phrase_explanations ADD COLUMN IF NOT EXISTS explanation_json JSONB;
    END IF;
  END IF;
  
  -- Add model column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'phrase_explanations' 
    AND column_name = 'model'
  ) THEN
    ALTER TABLE public.phrase_explanations ADD COLUMN model TEXT;
  END IF;
  
  -- Add version column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'phrase_explanations' 
    AND column_name = 'version'
  ) THEN
    ALTER TABLE public.phrase_explanations ADD COLUMN version INTEGER DEFAULT 1;
  END IF;
  
  -- Add generated_at column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'phrase_explanations' 
    AND column_name = 'generated_at'
  ) THEN
    ALTER TABLE public.phrase_explanations ADD COLUMN generated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- Clear any bad data
DELETE FROM public.phrase_explanations WHERE explanation_json IS NULL;
