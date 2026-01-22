# Lovable Prompt: Create Supabase Storage for Comprehension Audio

## Task
Create a Supabase storage bucket for pre-generated comprehension exercise audio files.

## Requirements

1. **Create Storage Bucket**
   - Bucket name: `comprehension-audio`
   - Make it public (for public URL access)
   - Enable file uploads

2. **Storage Policies**
   - Public read access (anyone can read/list files)
   - Authenticated users can upload (for the generation script)
   - Files should be accessible via public URLs

3. **File Structure**
   - Files will be named: `{itemId}.mp3` (e.g., `lc_fr_a1_0001.mp3`)
   - Format: MP3 audio files
   - Content type: `audio/mpeg`

## Implementation

Create a SQL migration file that:
- Creates the `comprehension-audio` storage bucket
- Sets up RLS policies for public read access
- Allows authenticated users to upload files

Or use Supabase Dashboard to:
1. Go to Storage → Create Bucket
2. Name: `comprehension-audio`
3. Public: Yes
4. File size limit: 10MB (audio files are typically 50-200KB)
5. Allowed MIME types: `audio/mpeg`, `audio/mp3`

## Alternative
If you prefer to reuse the existing `phrases-audio` bucket, that's also fine - just note it in the response.

