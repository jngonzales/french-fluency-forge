# Admin Operations Guide

**For: SOLV Languages Administrators**  
**Last Updated:** January 28, 2026

This document provides the SQL queries and Supabase Dashboard steps needed to perform common administrative operations.

---

## Quick Access: Admin UI Panel

For common tasks, use the built-in Admin Panel:

**URL:** `/admin/users`

Features:
- **Invite New User** - Send email invitations directly
- **Assign Flashcard Pack** - Add phrase categories to users

The admin panel requires admin role and is protected by authentication.

---

## Database Setup (One-Time)

If the admin panel shows "Admin access required", ensure the profiles table has a `role` column and your user is set as admin.

### Add Role Column to Profiles (if missing)

```sql
-- Add role column if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Create index for faster role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
```

### Set a User as Admin

```sql
-- Replace 'your.email@example.com' with the admin's email
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'your.email@example.com'
);
```

### Verify Admin Status

```sql
-- Check who is an admin
SELECT p.id, u.email, p.role 
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.role = 'admin';
```

**Note:** The frontend also checks a hardcoded list in `src/config/admin.ts`. Add emails there for client-side admin access.

---

## Table of Contents

1. [Database Setup](#database-setup-one-time)
   - [Add Role Column to Profiles](#add-role-column-to-profiles-if-missing)
   - [Set a User as Admin](#set-a-user-as-admin)
2. [User Management](#1-user-management)
   - [Invite a New User](#invite-a-new-user)
   - [View All Users](#view-all-users)
3. [Flashcard Assignment](#2-flashcard-assignment)
   - [View Available Phrase Packs](#view-available-phrase-packs)
   - [Assign Phrases to a User](#assign-phrases-to-a-user)
   - [View User's Assigned Phrases](#view-users-assigned-phrases)
4. [Maintenance Operations](#3-maintenance-operations)
   - [Clear Audio Cache (Force Re-generation)](#clear-audio-cache-force-re-generation)
   - [Fix Invalid Scheduling Dates](#fix-invalid-scheduling-dates)

---

## 1. User Management

### Invite a New User

**Via Supabase Dashboard:**
1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Click **"Invite user"** button
3. Enter the user's email address
4. Click **"Send invitation"**

The user will receive an email with a link to set their password.

**Via SQL (if you have the user's password):**
```sql
-- Note: For security, prefer using the Dashboard invite method
-- This is for edge cases only

SELECT auth.uid() FROM auth.users WHERE email = 'user@example.com';
```

### View All Users

```sql
-- View all registered users
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at,
  raw_user_meta_data->>'full_name' as name
FROM auth.users
ORDER BY created_at DESC;
```

---

## 2. Flashcard Assignment

### View Available Phrase Packs

```sql
-- View all phrase packs (categories/groups)
SELECT DISTINCT 
  category,
  COUNT(*) as phrase_count
FROM public.phrases
GROUP BY category
ORDER BY category;
```

```sql
-- View all phrases in a specific category
SELECT 
  id,
  canonical_fr,
  canonical_en,
  cefr_level
FROM public.phrases
WHERE category = 'YOUR_CATEGORY_NAME'
ORDER BY cefr_level, canonical_fr;
```

### Assign Phrases to a User

**Step 1: Get the User's ID**
```sql
-- Find user ID by email
SELECT id, email 
FROM auth.users 
WHERE email = 'student@example.com';
```

**Step 2: Assign All Phrases from a Category**
```sql
-- Assign all phrases from a category to a user
-- Replace 'USER_ID_HERE' with the actual user ID
-- Replace 'CATEGORY_NAME' with the phrase category

INSERT INTO public.member_phrase_cards (
  member_id,
  phrase_id,
  status,
  scheduler,
  lapses,
  reviews,
  created_at,
  updated_at
)
SELECT 
  'USER_ID_HERE'::uuid,
  p.id,
  'active',
  jsonb_build_object(
    'state', 'new',
    'due_at', NOW(),
    'last_reviewed_at', NULL,
    'interval_days', 0,
    'ease_factor', 2.5,
    'repetitions', 0
  ),
  0,
  0,
  NOW(),
  NOW()
FROM public.phrases p
WHERE p.category = 'CATEGORY_NAME'
ON CONFLICT (member_id, phrase_id) DO NOTHING;
```

**Step 3: Assign Specific Phrases by ID**
```sql
-- Assign specific phrase IDs to a user
-- Replace 'USER_ID_HERE' with the user's ID
-- Replace the phrase IDs in the array

INSERT INTO public.member_phrase_cards (
  member_id,
  phrase_id,
  status,
  scheduler,
  lapses,
  reviews,
  created_at,
  updated_at
)
SELECT 
  'USER_ID_HERE'::uuid,
  p.id,
  'active',
  jsonb_build_object(
    'state', 'new',
    'due_at', NOW(),
    'last_reviewed_at', NULL,
    'interval_days', 0,
    'ease_factor', 2.5,
    'repetitions', 0
  ),
  0,
  0,
  NOW(),
  NOW()
FROM public.phrases p
WHERE p.id IN (
  'phrase-id-1',
  'phrase-id-2',
  'phrase-id-3'
)
ON CONFLICT (member_id, phrase_id) DO NOTHING;
```

### View User's Assigned Phrases

```sql
-- View all phrases assigned to a user
SELECT 
  mpc.id as card_id,
  mpc.status,
  mpc.scheduler->>'state' as learning_state,
  mpc.scheduler->>'due_at' as due_at,
  mpc.reviews,
  p.canonical_fr,
  p.canonical_en,
  p.cefr_level
FROM public.member_phrase_cards mpc
JOIN public.phrases p ON p.id = mpc.phrase_id
WHERE mpc.member_id = 'USER_ID_HERE'
ORDER BY (mpc.scheduler->>'due_at')::timestamp;
```

---

## 3. Maintenance Operations

### Clear Audio Cache (Force Re-generation)

When you change the TTS voice (like switching from Laura to Thomas), old audio files are still cached in Supabase Storage. To force the app to re-generate audio with the new voice:

**Option A: Clear ALL cached phrase audio (via Supabase Dashboard)**
1. Go to **Supabase Dashboard** → **Storage** → **phrases-audio**
2. Select the **phrases/** folder
3. Select all files and click **Delete**

**Option B: Clear audio via SQL (delete storage objects)**
```sql
-- WARNING: This deletes all cached audio files from storage
-- The app will regenerate audio on next playback

DELETE FROM storage.objects 
WHERE bucket_id = 'phrases-audio' 
AND name LIKE 'phrases/%';
```

**Option C: Clear audio for specific phrases only**
```sql
-- Delete cached audio for specific phrase IDs
DELETE FROM storage.objects 
WHERE bucket_id = 'phrases-audio' 
AND name IN (
  'phrases/PHRASE_ID_1.mp3',
  'phrases/PHRASE_ID_2.mp3'
);
```

**After clearing cache:**
- Users will see a brief loading spinner when playing audio
- New audio will be generated with the Thomas (Metropolitan French) voice
- Audio will be re-cached automatically for future instant playback

### Fix Invalid Scheduling Dates

If cards are showing "NaN years" or invalid dates, run this cleanup:

```sql
-- Fix cards with invalid or null due_at dates
-- Sets them to review tomorrow

UPDATE public.member_phrase_cards
SET 
  scheduler = jsonb_set(
    scheduler,
    '{due_at}',
    to_jsonb(to_char(NOW() + INTERVAL '1 day', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
  ),
  updated_at = NOW()
WHERE 
  scheduler->>'due_at' IS NULL
  OR scheduler->>'due_at' = 'null'
  OR scheduler->>'due_at' = ''
  OR NOT (scheduler->>'due_at' ~ '^\d{4}-\d{2}-\d{2}');
```

```sql
-- Fix cards with extremely far future dates (> 1 year)
-- Sets them to review in 30 days

UPDATE public.member_phrase_cards
SET 
  scheduler = jsonb_set(
    scheduler,
    '{due_at}',
    to_jsonb(to_char(NOW() + INTERVAL '30 days', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
  ),
  scheduler = jsonb_set(
    scheduler,
    '{interval_days}',
    '30'::jsonb
  ),
  updated_at = NOW()
WHERE 
  (scheduler->>'due_at')::timestamp > NOW() + INTERVAL '1 year';
```

---

## Quick Reference

| Task | Method |
|------|--------|
| Invite user | Dashboard → Auth → Users → Invite |
| Find user ID | `SELECT id FROM auth.users WHERE email = '...'` |
| Assign phrases | Use INSERT INTO member_phrase_cards (see above) |
| Clear audio cache | Dashboard → Storage → phrases-audio → Delete folder |
| Fix broken dates | Run the UPDATE queries above |

---

## Support

For technical issues, contact the development team.

For end-user support, direct inquiries to: **support@solvlanguages.com**
