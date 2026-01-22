# Fix Storage Policies and Generate Audio

## Current Status
- ✅ Bucket `comprehension-audio` exists
- ❌ Storage policies blocking uploads (RLS error)
- ❌ 12 items need audio generation

## Step 1: Fix Storage Policies

**Run this SQL in Supabase Dashboard SQL Editor:**

File: `supabase/migrations/20260106130001_fix_comprehension_audio_policies.sql`

Or copy-paste:
```sql
-- Public read access
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
```

## Step 2: Generate Audio

After policies are fixed, run:
```bash
export VITE_SUPABASE_URL="https://mjqykgcvfteihqmgeufb.supabase.co"
export VITE_SUPABASE_PUBLISHABLE_KEY="your-key"
npx tsx scripts/generate-comprehension-audio.ts
```

Or tell me when policies are fixed and I'll run it!

