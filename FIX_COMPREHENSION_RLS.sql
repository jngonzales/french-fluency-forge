-- Fix RLS policies for comprehension_items table
-- Run this in Supabase Dashboard -> SQL Editor

-- First, check if RLS is enabled
ALTER TABLE public.comprehension_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Anyone can read comprehension items" ON public.comprehension_items;
DROP POLICY IF EXISTS "Public can read comprehension items" ON public.comprehension_items;

-- Create public read policy (allows anyone, including anonymous users)
CREATE POLICY "Public can read comprehension items" 
ON public.comprehension_items 
FOR SELECT 
TO public
USING (true);

-- Also add an anon role policy explicitly
DROP POLICY IF EXISTS "Anon can read comprehension items" ON public.comprehension_items;
CREATE POLICY "Anon can read comprehension items" 
ON public.comprehension_items 
FOR SELECT 
TO anon
USING (true);

-- Verify policies exist
SELECT schemaname, tablename, policyname, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'comprehension_items';
