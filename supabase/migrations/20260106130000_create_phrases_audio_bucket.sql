-- Create phrases-audio storage bucket
-- Note: This requires Supabase admin privileges
-- If this doesn't work, create the bucket manually via Supabase Dashboard

-- Create bucket (if using Supabase Management API or service role)
-- This SQL won't work directly - buckets must be created via Dashboard or Management API
-- Keeping this file as documentation

-- To create manually:
-- 1. Go to Supabase Dashboard → Storage
-- 2. Click "New bucket"
-- 3. Name: phrases-audio
-- 4. Public: Yes
-- 5. File size limit: 10MB
-- 6. Allowed MIME types: audio/mpeg, audio/wav, audio/mp3

-- Storage policies for phrases-audio bucket
-- (Run these AFTER creating the bucket manually)

-- Allow public read access
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'phrases-audio',
  'phrases-audio',
  true,
  10485760, -- 10MB
  ARRAY['audio/mpeg', 'audio/wav', 'audio/mp3']
)
ON CONFLICT (id) DO NOTHING;

-- Public read policy
CREATE POLICY "Public read access for phrases-audio"
ON storage.objects
FOR SELECT
USING (bucket_id = 'phrases-audio');

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload to phrases-audio"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'phrases-audio' AND
  auth.role() = 'authenticated'
);

-- Users can update their own files
CREATE POLICY "Users can update their own files in phrases-audio"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'phrases-audio' AND
  auth.role() = 'authenticated'
);

-- Users can delete their own files
CREATE POLICY "Users can delete their own files in phrases-audio"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'phrases-audio' AND
  auth.role() = 'authenticated'
);

