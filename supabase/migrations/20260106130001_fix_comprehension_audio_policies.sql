-- Fix storage policies for comprehension-audio bucket
-- Run this in Supabase Dashboard SQL Editor

-- Drop existing policies if they exist (optional - will fail if they don't exist, that's ok)
DROP POLICY IF EXISTS "Public read access for comprehension-audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to comprehension-audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update files in comprehension-audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete files in comprehension-audio" ON storage.objects;

-- Public read access (anyone can read files)
CREATE POLICY "Public read access for comprehension-audio"
ON storage.objects
FOR SELECT
USING (bucket_id = 'comprehension-audio');

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload to comprehension-audio"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'comprehension-audio' AND
  auth.role() = 'authenticated'
);

-- Authenticated users can update
CREATE POLICY "Authenticated users can update files in comprehension-audio"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'comprehension-audio' AND
  auth.role() = 'authenticated'
);

-- Authenticated users can delete
CREATE POLICY "Authenticated users can delete files in comprehension-audio"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'comprehension-audio' AND
  auth.role() = 'authenticated'
);

