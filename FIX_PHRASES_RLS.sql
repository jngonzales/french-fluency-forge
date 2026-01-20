-- FIX_PHRASES_RLS.sql
-- Run this in Supabase SQL Editor to fix all RLS policies for phrases feature

-- =====================================================
-- 1. MEMBER_PHRASE_SETTINGS TABLE
-- =====================================================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS member_phrase_settings (
    member_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    new_per_day INTEGER DEFAULT 10,
    reviews_per_day INTEGER DEFAULT 50,
    target_retention DECIMAL(3,2) DEFAULT 0.90,
    speech_feedback_enabled BOOLEAN DEFAULT true,
    auto_assess_enabled BOOLEAN DEFAULT false,
    recognition_shadow_default TEXT DEFAULT 'recognition',
    show_time_to_recall BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE member_phrase_settings ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies (using DO block to avoid errors)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own settings" ON member_phrase_settings;
    DROP POLICY IF EXISTS "Users can insert their own settings" ON member_phrase_settings;
    DROP POLICY IF EXISTS "Users can update their own settings" ON member_phrase_settings;
    DROP POLICY IF EXISTS "Users can delete their own settings" ON member_phrase_settings;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Users can view their own settings" 
    ON member_phrase_settings FOR SELECT 
    USING (auth.uid() = member_id);

CREATE POLICY "Users can insert their own settings" 
    ON member_phrase_settings FOR INSERT 
    WITH CHECK (auth.uid() = member_id);

CREATE POLICY "Users can update their own settings" 
    ON member_phrase_settings FOR UPDATE 
    USING (auth.uid() = member_id)
    WITH CHECK (auth.uid() = member_id);

CREATE POLICY "Users can delete their own settings" 
    ON member_phrase_settings FOR DELETE 
    USING (auth.uid() = member_id);

-- =====================================================
-- 2. PHRASE_REVIEW_LOGS TABLE  
-- =====================================================

-- Enable RLS on existing table
ALTER TABLE phrase_review_logs ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own review logs" ON phrase_review_logs;
    DROP POLICY IF EXISTS "Users can insert their own review logs" ON phrase_review_logs;
    DROP POLICY IF EXISTS "Users can update their own review logs" ON phrase_review_logs;
    DROP POLICY IF EXISTS "Users can delete their own review logs" ON phrase_review_logs;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Users can view their own review logs" 
    ON phrase_review_logs FOR SELECT 
    USING (auth.uid() = member_id);

CREATE POLICY "Users can insert their own review logs" 
    ON phrase_review_logs FOR INSERT 
    WITH CHECK (auth.uid() = member_id);

CREATE POLICY "Users can update their own review logs" 
    ON phrase_review_logs FOR UPDATE 
    USING (auth.uid() = member_id)
    WITH CHECK (auth.uid() = member_id);

CREATE POLICY "Users can delete their own review logs" 
    ON phrase_review_logs FOR DELETE 
    USING (auth.uid() = member_id);

-- =====================================================
-- 3. MEMBER_PHRASE_CARDS TABLE (ensure policies exist)
-- =====================================================

-- Enable RLS
ALTER TABLE member_phrase_cards ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own cards" ON member_phrase_cards;
    DROP POLICY IF EXISTS "Users can insert their own cards" ON member_phrase_cards;
    DROP POLICY IF EXISTS "Users can update their own cards" ON member_phrase_cards;
    DROP POLICY IF EXISTS "Users can delete their own cards" ON member_phrase_cards;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Users can view their own cards" 
    ON member_phrase_cards FOR SELECT 
    USING (auth.uid() = member_id);

CREATE POLICY "Users can insert their own cards" 
    ON member_phrase_cards FOR INSERT 
    WITH CHECK (auth.uid() = member_id);

CREATE POLICY "Users can update their own cards" 
    ON member_phrase_cards FOR UPDATE 
    USING (auth.uid() = member_id)
    WITH CHECK (auth.uid() = member_id);

CREATE POLICY "Users can delete their own cards" 
    ON member_phrase_cards FOR DELETE 
    USING (auth.uid() = member_id);

-- =====================================================
-- 4. PHRASE_EXPLANATIONS TABLE
-- =====================================================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS phrase_explanations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phrase_id UUID NOT NULL,
    explanation_type TEXT NOT NULL,
    content JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(phrase_id, explanation_type)
);

-- Enable RLS
ALTER TABLE phrase_explanations ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Anyone can view explanations" ON phrase_explanations;
    DROP POLICY IF EXISTS "Authenticated users can insert explanations" ON phrase_explanations;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Anyone can view explanations" 
    ON phrase_explanations FOR SELECT 
    USING (true);

CREATE POLICY "Authenticated users can insert explanations" 
    ON phrase_explanations FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check policies exist
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('member_phrase_settings', 'phrase_review_logs', 'member_phrase_cards', 'phrase_explanations')
ORDER BY tablename, policyname;
