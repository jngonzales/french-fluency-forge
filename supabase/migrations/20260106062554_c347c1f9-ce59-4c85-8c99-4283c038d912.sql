-- Allow public/anonymous uploads for comprehension-audio bucket (for script use)
CREATE POLICY "Allow uploads to comprehension-audio"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'comprehension-audio');