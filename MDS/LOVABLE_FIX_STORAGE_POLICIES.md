# Lovable: Fix Storage Bucket Policies

## Issue
The `comprehension-audio` bucket exists but uploads are failing with:
"new row violates row-level security policy"

## Solution
Update the storage bucket policies to allow authenticated users to upload files.

## Steps

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard/project/mjqykgcvfteihqmgeufb/storage/policies

2. **For `comprehension-audio` bucket, add/update policies:**

   **Policy 1: Public Read Access**
   ```sql
   CREATE POLICY "Public read access for comprehension-audio"
   ON storage.objects
   FOR SELECT
   USING (bucket_id = 'comprehension-audio');
   ```

   **Policy 2: Allow Authenticated Uploads**
   ```sql
   CREATE POLICY "Authenticated users can upload to comprehension-audio"
   ON storage.objects
   FOR INSERT
   WITH CHECK (
     bucket_id = 'comprehension-audio' AND
     auth.role() = 'authenticated'
   );
   ```

   **Policy 3: Allow Updates**
   ```sql
   CREATE POLICY "Authenticated users can update files in comprehension-audio"
   ON storage.objects
   FOR UPDATE
   USING (
     bucket_id = 'comprehension-audio' AND
     auth.role() = 'authenticated'
   );
   ```

3. **Or use Supabase Dashboard:**
   - Go to Storage → Policies
   - Select `comprehension-audio` bucket
   - Add policies for:
     - SELECT: Public (anyone)
     - INSERT: Authenticated users
     - UPDATE: Authenticated users

## Alternative: Allow Service Role Uploads

If you need to upload via script without authentication:
```sql
CREATE POLICY "Service role can upload to comprehension-audio"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'comprehension-audio');
```

---

**After fixing policies, run the generation script again!**

