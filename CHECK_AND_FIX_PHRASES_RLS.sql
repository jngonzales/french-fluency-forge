-- CHECK_AND_FIX_PHRASES_RLS.sql
-- Run this in Supabase SQL Editor to debug and fix RLS issues

-- =====================================================
-- STEP 1: Check if RLS is enabled
-- =====================================================
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename IN ('phrase_review_logs', 'member_phrase_settings', 'member_phrase_cards');

-- =====================================================
-- STEP 2: Check what auth.uid() returns for your user
-- This should return your user ID when logged in
-- =====================================================
-- Note: This only works in authenticated context

-- =====================================================
-- STEP 3: Check the exact column names in phrase_review_logs
-- =====================================================
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'phrase_review_logs'
ORDER BY ordinal_position;

-- =====================================================
-- STEP 4: Temporarily disable RLS for testing (UNSAFE - only for debugging)
-- Uncomment to test if RLS is the issue
-- =====================================================
-- ALTER TABLE phrase_review_logs DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE member_phrase_settings DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 5: Alternative - Grant table permissions to authenticated role
-- This ensures the authenticated role has table-level access
-- =====================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON phrase_review_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON member_phrase_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON member_phrase_cards TO authenticated;

-- =====================================================
-- STEP 6: Check if there are any conflicting policies
-- =====================================================
SELECT 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check 
FROM pg_policies 
WHERE tablename = 'phrase_review_logs';

-- =====================================================
-- STEP 7: Create a simpler, more permissive policy
-- DROP the existing ones and create one that's definitely correct
-- =====================================================

-- For phrase_review_logs
DROP POLICY IF EXISTS "Users can view their own review logs" ON phrase_review_logs;
DROP POLICY IF EXISTS "Users can insert their own review logs" ON phrase_review_logs;
DROP POLICY IF EXISTS "Users can update their own review logs" ON phrase_review_logs;
DROP POLICY IF EXISTS "Users can delete their own review logs" ON phrase_review_logs;
DROP POLICY IF EXISTS "Members can view their own review logs" ON phrase_review_logs;
DROP POLICY IF EXISTS "Members can insert their own review logs" ON phrase_review_logs;

-- Create simple policies that allow authenticated users
CREATE POLICY "allow_select_own_logs" ON phrase_review_logs 
    FOR SELECT TO authenticated 
    USING (auth.uid() = member_id);

CREATE POLICY "allow_insert_own_logs" ON phrase_review_logs 
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = member_id);

CREATE POLICY "allow_update_own_logs" ON phrase_review_logs 
    FOR UPDATE TO authenticated 
    USING (auth.uid() = member_id)
    WITH CHECK (auth.uid() = member_id);

CREATE POLICY "allow_delete_own_logs" ON phrase_review_logs 
    FOR DELETE TO authenticated 
    USING (auth.uid() = member_id);

-- For member_phrase_settings
DROP POLICY IF EXISTS "Users can view their own settings" ON member_phrase_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON member_phrase_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON member_phrase_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON member_phrase_settings;
DROP POLICY IF EXISTS "Members can view their own settings" ON member_phrase_settings;
DROP POLICY IF EXISTS "Members can insert their own settings" ON member_phrase_settings;
DROP POLICY IF EXISTS "Members can update their own settings" ON member_phrase_settings;

CREATE POLICY "allow_select_own_settings" ON member_phrase_settings 
    FOR SELECT TO authenticated 
    USING (auth.uid() = member_id);

CREATE POLICY "allow_insert_own_settings" ON member_phrase_settings 
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = member_id);

CREATE POLICY "allow_update_own_settings" ON member_phrase_settings 
    FOR UPDATE TO authenticated 
    USING (auth.uid() = member_id)
    WITH CHECK (auth.uid() = member_id);

CREATE POLICY "allow_delete_own_settings" ON member_phrase_settings 
    FOR DELETE TO authenticated 
    USING (auth.uid() = member_id);

-- =====================================================
-- STEP 8: Verify policies after changes
-- =====================================================
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('phrase_review_logs', 'member_phrase_settings')
ORDER BY tablename, cmd;
