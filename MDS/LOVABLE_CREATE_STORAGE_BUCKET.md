# Lovable: Create Storage Bucket

## Task
Create a Supabase storage bucket named `phrases-audio` for storing comprehension audio files.

## Steps

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard/project/mjqykgcvfteihqmgeufb
   - Or navigate: Storage → New bucket

2. **Create Bucket:**
   - **Name:** `phrases-audio`
   - **Public bucket:** ✅ Yes (must be checked for public URL access)
   - **File size limit:** 10 MB (or leave default)
   - **Allowed MIME types:** (optional) `audio/mpeg, audio/wav, audio/mp3`

3. **Verify:**
   - Bucket should appear in Storage list
   - Public access should be enabled

## Why This Is Needed

The comprehension audio generation script needs this bucket to store WAV files. Without it, all 12 items fail with "Bucket not found" error.

## After Creation

Once created, run:
```bash
npx tsx scripts/generate-comprehension-audio.ts
```

This will generate audio for all 12 comprehension items and update the database.

