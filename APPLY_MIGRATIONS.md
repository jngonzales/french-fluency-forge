# Apply Comprehension Items Migrations

Since Supabase CLI is not installed, apply these migrations via the Supabase Dashboard:

## Option 1: Supabase Dashboard SQL Editor (Recommended)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor**
4. Click **New Query**
5. Copy and paste the contents of each migration file below
6. Click **Run** (or press Cmd/Ctrl + Enter)

## Migration 1: Create Table

Copy the entire contents of:
`supabase/migrations/20260106122428_comprehension_items.sql`

## Migration 2: Seed Data

Copy the entire contents of:
`supabase/migrations/20260106122429_seed_comprehension_items.sql`

---

## Option 2: Install Supabase CLI (Alternative)

If you prefer using CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Or via Homebrew (macOS)
brew install supabase/tap/supabase

# Link to your project (if not already linked)
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

---

## Verify Migrations Applied

After applying, verify in SQL Editor:

```sql
-- Check table exists
SELECT COUNT(*) FROM comprehension_items;
-- Should return 12

-- Check items have correct structure
SELECT id, cefr_level, audio_url IS NOT NULL as has_audio 
FROM comprehension_items 
ORDER BY cefr_level, id;
-- Should show all 12 items with has_audio = false initially

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'comprehension_items';
-- Should show idx_comprehension_items_has_audio and idx_comprehension_items_cefr
```

---

## Next Steps

After migrations are applied:

1. **Generate TypeScript types:**
   ```bash
   # If you have Supabase CLI
   supabase gen types typescript --local > src/integrations/supabase/types.ts
   
   # Or use Supabase Dashboard:
   # Settings → API → Generate TypeScript types
   ```

2. **Generate audio files:**
   - Go to `/dev/comprehension-audio` in your app
   - Click "Generate All Audio"
   - Wait for all 12 items to be processed

