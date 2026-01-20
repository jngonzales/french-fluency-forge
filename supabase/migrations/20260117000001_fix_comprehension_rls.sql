-- Fix RLS policies for comprehension_items table
-- This ensures anonymous/public users can read items

-- Ensure RLS is enabled
ALTER TABLE public.comprehension_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Anyone can read comprehension items" ON public.comprehension_items;
DROP POLICY IF EXISTS "Public can read comprehension items" ON public.comprehension_items;
DROP POLICY IF EXISTS "Anon can read comprehension items" ON public.comprehension_items;

-- Create policy for public/authenticated users
CREATE POLICY "Public can read comprehension items" 
ON public.comprehension_items 
FOR SELECT 
TO public
USING (true);

-- Create policy specifically for anon role (unauthenticated users)
CREATE POLICY "Anon can read comprehension items" 
ON public.comprehension_items 
FOR SELECT 
TO anon
USING (true);
