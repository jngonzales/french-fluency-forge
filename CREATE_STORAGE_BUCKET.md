# Create Storage Bucket for Comprehension Audio

The `phrases-audio` bucket doesn't exist yet. Please create it:

## Quick Steps

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Select your project

2. **Create Bucket:**
   - Navigate to **Storage** (left sidebar)
   - Click **"New bucket"** or **"Create bucket"**
   - Fill in:
     - **Name:** `phrases-audio`
     - **Public bucket:** ✅ Yes (check this)
     - **File size limit:** 10 MB
     - **Allowed MIME types:** `audio/mpeg, audio/wav, audio/mp3` (optional, can leave blank)

3. **Set Permissions:**
   - After creating, go to **Storage** → **policies** (or **Settings**)
   - Ensure public read access is enabled
   - Allow authenticated users to upload

4. **Run Audio Generation:**
   ```bash
   export VITE_SUPABASE_URL="https://mjqykgcvfteihqmgeufb.supabase.co"
   export VITE_SUPABASE_PUBLISHABLE_KEY="your-key"
   npx tsx scripts/generate-comprehension-audio.ts
   ```

## Alternative: Use Supabase CLI

If you have Supabase CLI installed:

```bash
supabase storage create phrases-audio --public
```

---

**Once the bucket is created, I can run the audio generation script again!**

