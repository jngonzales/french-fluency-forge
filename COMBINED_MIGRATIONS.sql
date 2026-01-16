-- FRENCH FLUENCY FORGE - COMBINED MIGRATIONS
-- Run this file in Supabase SQL Editor to set up all tables
-- Generated: 2026-01-09
-- ============================================================================


-- ============================================================================
-- FILE: 20251227095032_1d079ce4-40a4-444f-9b72-bf325c0add22.sql
-- ============================================================================

-- Enums
CREATE TYPE public.gender_type AS ENUM ('male', 'female', 'non_binary', 'prefer_not');
CREATE TYPE public.age_band_type AS ENUM ('18_24', '25_34', '35_44', '45_54', '55_64', '65_plus');
CREATE TYPE public.track_type AS ENUM ('small_talk', 'transactions', 'bilingual_friends', 'work', 'home', 'in_laws');
CREATE TYPE public.session_status AS ENUM ('intake', 'consent', 'quiz', 'mic_check', 'assessment', 'processing', 'completed', 'abandoned');

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Purchases table
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'eur',
  status TEXT NOT NULL DEFAULT 'pending',
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Consent records table
CREATE TABLE public.consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  recording_consent BOOLEAN NOT NULL DEFAULT false,
  data_processing_consent BOOLEAN NOT NULL DEFAULT false,
  retention_acknowledged BOOLEAN NOT NULL DEFAULT false,
  consented_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Assessment sessions table
CREATE TABLE public.assessment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  purchase_id UUID REFERENCES public.purchases(id) ON DELETE SET NULL,
  status session_status NOT NULL DEFAULT 'intake',
  
  -- Intake data
  gender gender_type,
  age_band age_band_type,
  languages_spoken TEXT[],
  goals TEXT,
  primary_track track_type,
  
  -- Timing
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  
  -- A/B testing
  variant TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_sessions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
  
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Purchases policies (users see their own, service can create)
CREATE POLICY "Users can view own purchases" ON public.purchases
  FOR SELECT USING (auth.uid() = user_id);

-- Consent policies
CREATE POLICY "Users can view own consent" ON public.consent_records
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert own consent" ON public.consent_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Assessment session policies
CREATE POLICY "Users can view own sessions" ON public.assessment_sessions
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert own sessions" ON public.assessment_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update own sessions" ON public.assessment_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_assessment_sessions_updated_at
  BEFORE UPDATE ON public.assessment_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ============================================================================
-- FILE: 20251227095040_ab59e67b-587b-4e4d-98c2-d9dffee3dab2.sql
-- ============================================================================

-- Fix function search path for update_updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- ============================================================================
-- FILE: 20251227102824_f9d12fc0-8602-4b6b-bd4f-a85ff089b074.sql
-- ============================================================================

-- Add archetype column to store quiz results
ALTER TABLE public.assessment_sessions 
ADD COLUMN archetype text;


-- ============================================================================
-- FILE: 20251231005752_27f67131-4335-44bb-a28c-51f0e4f8569c.sql
-- ============================================================================

-- Create fluency recordings table to track all attempts
CREATE TABLE public.fluency_recordings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  item_id TEXT NOT NULL, -- e.g., 'fluency-1', 'fluency-2'
  attempt_number INTEGER NOT NULL DEFAULT 1,
  used_for_scoring BOOLEAN NOT NULL DEFAULT true,
  superseded BOOLEAN NOT NULL DEFAULT false,
  
  -- Analysis results (stored, but never shown to user)
  transcript TEXT,
  word_count INTEGER,
  duration_seconds NUMERIC(10, 2),
  wpm INTEGER,
  pause_count INTEGER,
  total_pause_duration NUMERIC(10, 2),
  
  -- Storage reference (audio stored in blob storage, not DB)
  audio_storage_path TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Ensure unique attempt numbers per item per session
  UNIQUE(session_id, item_id, attempt_number)
);

-- Add fluency_locked column to assessment_sessions to track lock state
ALTER TABLE public.assessment_sessions 
ADD COLUMN fluency_locked BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN fluency_locked_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient queries
CREATE INDEX idx_fluency_recordings_session ON public.fluency_recordings(session_id);
CREATE INDEX idx_fluency_recordings_user ON public.fluency_recordings(user_id);
CREATE INDEX idx_fluency_recordings_scoring ON public.fluency_recordings(session_id, item_id, used_for_scoring) WHERE used_for_scoring = true;

-- Enable RLS
ALTER TABLE public.fluency_recordings ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only access their own recordings
CREATE POLICY "Users can view own fluency recordings"
ON public.fluency_recordings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fluency recordings"
ON public.fluency_recordings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fluency recordings"
ON public.fluency_recordings
FOR UPDATE
USING (auth.uid() = user_id);

-- Create event logging table for fluency events
CREATE TABLE public.fluency_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'fluency_recording_started',
    'fluency_recording_completed',
    'fluency_redo_clicked',
    'fluency_redo_confirmed',
    'fluency_redo_cancelled',
    'fluency_module_locked'
  )),
  item_id TEXT,
  attempt_number INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient event queries
CREATE INDEX idx_fluency_events_session ON public.fluency_events(session_id);

-- Enable RLS on events
ALTER TABLE public.fluency_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for events
CREATE POLICY "Users can view own fluency events"
ON public.fluency_events
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fluency events"
ON public.fluency_events
FOR INSERT
WITH CHECK (auth.uid() = user_id);


-- ============================================================================
-- FILE: 20251231013254_9991f2a7-bd1d-4add-aaed-1651ccabf64e.sql
-- ============================================================================

-- Create table for user feedback on archetype results
CREATE TABLE public.archetype_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id UUID REFERENCES public.assessment_sessions(id),
  feedback_text TEXT NOT NULL,
  marketing_consent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.archetype_feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert their own feedback
CREATE POLICY "Users can insert own feedback"
ON public.archetype_feedback
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback"
ON public.archetype_feedback
FOR SELECT
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_archetype_feedback_user ON public.archetype_feedback(user_id);
CREATE INDEX idx_archetype_feedback_session ON public.archetype_feedback(session_id);


-- ============================================================================
-- FILE: 20251231030934_50a34ff6-3db6-45c8-acb5-3831e9bd0c13.sql
-- ============================================================================

-- Create skill_recordings table for confidence, syntax, and conversation modules
CREATE TABLE public.skill_recordings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_type TEXT NOT NULL CHECK (module_type IN ('confidence', 'syntax', 'conversation')),
  item_id TEXT NOT NULL,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  audio_storage_path TEXT,
  transcript TEXT,
  duration_seconds NUMERIC,
  word_count INTEGER,
  ai_score NUMERIC,
  ai_feedback TEXT,
  ai_breakdown JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'uploading', 'processing', 'completed', 'error')),
  error_message TEXT,
  superseded BOOLEAN NOT NULL DEFAULT false,
  used_for_scoring BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Add lock columns to assessment_sessions for new modules
ALTER TABLE public.assessment_sessions 
  ADD COLUMN confidence_locked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN confidence_locked_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN syntax_locked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN syntax_locked_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN conversation_locked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN conversation_locked_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS on skill_recordings
ALTER TABLE public.skill_recordings ENABLE ROW LEVEL SECURITY;

-- RLS policies for skill_recordings
CREATE POLICY "Users can insert own skill recordings"
ON public.skill_recordings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own skill recordings"
ON public.skill_recordings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own skill recordings"
ON public.skill_recordings
FOR UPDATE
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_skill_recordings_session_id ON public.skill_recordings(session_id);
CREATE INDEX idx_skill_recordings_user_id ON public.skill_recordings(user_id);
CREATE INDEX idx_skill_recordings_module_type ON public.skill_recordings(module_type);


-- ============================================================================
-- FILE: 20251231071040_1ebe9ac4-2e3d-4b62-b41d-9cd9c3d4290b.sql
-- ============================================================================

-- Create table for confidence questionnaire responses
CREATE TABLE public.confidence_questionnaire_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  responses jsonb NOT NULL DEFAULT '{}',
  raw_score numeric,
  normalized_score numeric,
  honesty_flag boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (session_id)
);

-- Enable RLS
ALTER TABLE public.confidence_questionnaire_responses ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can insert own questionnaire responses"
ON public.confidence_questionnaire_responses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own questionnaire responses"
ON public.confidence_questionnaire_responses
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own questionnaire responses"
ON public.confidence_questionnaire_responses
FOR UPDATE
USING (auth.uid() = user_id);


-- ============================================================================
-- FILE: 20251231092110_5971b3f9-2da0-443e-baa5-d6ae3f4fdf12.sql
-- ============================================================================

-- Add comprehension_locked columns to assessment_sessions
ALTER TABLE public.assessment_sessions 
ADD COLUMN IF NOT EXISTS comprehension_locked boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS comprehension_locked_at timestamp with time zone;

-- Create comprehension_recordings table
CREATE TABLE IF NOT EXISTS public.comprehension_recordings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  item_id text NOT NULL,
  attempt_number integer NOT NULL DEFAULT 1,
  audio_storage_path text,
  transcript text,
  audio_played_at timestamp with time zone,
  status text NOT NULL DEFAULT 'pending',
  ai_score numeric,
  ai_feedback_fr text,
  understood_facts jsonb,
  intent_match jsonb,
  ai_confidence numeric,
  superseded boolean NOT NULL DEFAULT false,
  used_for_scoring boolean NOT NULL DEFAULT true,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

-- Enable Row Level Security
ALTER TABLE public.comprehension_recordings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comprehension_recordings
CREATE POLICY "Users can insert own comprehension recordings" 
ON public.comprehension_recordings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comprehension recordings" 
ON public.comprehension_recordings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view own comprehension recordings" 
ON public.comprehension_recordings 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_comprehension_recordings_session 
ON public.comprehension_recordings(session_id);

CREATE INDEX IF NOT EXISTS idx_comprehension_recordings_user 
ON public.comprehension_recordings(user_id);


-- ============================================================================
-- FILE: 20251231104044_6fc3489f-fa02-4342-9be4-6dd512f5d20d.sql
-- ============================================================================

-- Prompt 1: Systeme.io webhook-gated auth + credits system

-- Table 1: systemeio_webhook_events (stores all incoming webhooks)
CREATE TABLE IF NOT EXISTS public.systemeio_webhook_events (
  id text PRIMARY KEY,
  event_name text NOT NULL,
  event_timestamp timestamptz NULL,
  payload jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz NULL,
  processing_status text NOT NULL DEFAULT 'received',
  error text NULL
);

-- Table 2: app_accounts (email-based access control)
CREATE TABLE IF NOT EXISTS public.app_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  email text NOT NULL UNIQUE,
  access_status text NOT NULL DEFAULT 'inactive',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table 3: credit_wallets (credits for paid tests)
CREATE TABLE IF NOT EXISTS public.credit_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL UNIQUE REFERENCES public.app_accounts(id) ON DELETE CASCADE,
  test_credits_remaining int NOT NULL DEFAULT 0,
  test_credits_lifetime int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table 4: credit_transactions (audit log for credit changes)
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.app_accounts(id) ON DELETE CASCADE,
  delta int NOT NULL,
  reason text NOT NULL,
  systemeio_order_id text NULL,
  systemeio_offer_price_plan_id text NULL,
  systemeio_message_id text NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table 5: systemeio_product_map (maps Systeme.io products to access/credits)
CREATE TABLE IF NOT EXISTS public.systemeio_product_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_price_plan_id text NOT NULL UNIQUE,
  product_key text NOT NULL,
  grants_access boolean NOT NULL DEFAULT false,
  credits_delta int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  note text NULL
);

-- Enable RLS on all tables
ALTER TABLE public.systemeio_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.systemeio_product_map ENABLE ROW LEVEL SECURITY;

-- RLS Policies for app_accounts (users can view their own account via user_id link)
CREATE POLICY "Users can view own app_account"
  ON public.app_accounts
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for credit_wallets (users can view their own wallet)
CREATE POLICY "Users can view own credit_wallet"
  ON public.credit_wallets
  FOR SELECT
  USING (
    account_id IN (
      SELECT id FROM public.app_accounts WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for credit_transactions (users can view their own transactions)
CREATE POLICY "Users can view own credit_transactions"
  ON public.credit_transactions
  FOR SELECT
  USING (
    account_id IN (
      SELECT id FROM public.app_accounts WHERE user_id = auth.uid()
    )
  );

-- RLS for systemeio_product_map (only service role can access - no user policies)
-- systemeio_webhook_events has no user access policies (service role only)

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_app_accounts_email ON public.app_accounts(email);
CREATE INDEX IF NOT EXISTS idx_app_accounts_user_id ON public.app_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_wallets_account_id ON public.credit_wallets(account_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_account_id ON public.credit_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created ON public.credit_transactions(account_id, created_at DESC);

-- Trigger to update updated_at on app_accounts
CREATE TRIGGER update_app_accounts_updated_at
  BEFORE UPDATE ON public.app_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Trigger to update updated_at on credit_wallets
CREATE TRIGGER update_credit_wallets_updated_at
  BEFORE UPDATE ON public.credit_wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();


-- ============================================================================
-- FILE: 20251231111732_51d7876c-6308-4001-b2e2-94fa4d8b2105.sql
-- ============================================================================

-- Add RLS policies for systemeio_product_map table (admin management)
CREATE POLICY "Authenticated users can view product map"
ON public.systemeio_product_map
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert product map"
ON public.systemeio_product_map
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update product map"
ON public.systemeio_product_map
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete product map"
ON public.systemeio_product_map
FOR DELETE
TO authenticated
USING (true);


-- ============================================================================
-- FILE: 20260101143952_f497cf23-2d76-4aa8-b5ba-2ed7c1ed110e.sql
-- ============================================================================

-- Sales Copilot Migration
-- Creates tables for leads, calls, and playbook management

-- Enums for call stages and outcomes
CREATE TYPE public.call_stage AS ENUM (
  'rapport',
  'diagnose',
  'qualify',
  'present',
  'objections',
  'close',
  'next_steps'
);

CREATE TYPE public.call_outcome AS ENUM (
  'won',
  'lost',
  'follow_up',
  'refer_out'
);

-- Sales Leads table
CREATE TABLE public.sales_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  linked_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  timezone TEXT,
  country TEXT,
  current_level TEXT,
  goal TEXT,
  deadline_urgency TEXT,
  motivation TEXT,
  biggest_blockers TEXT[],
  past_methods_tried TEXT[],
  time_available_per_week INTEGER,
  willingness_to_speak INTEGER CHECK (willingness_to_speak >= 1 AND willingness_to_speak <= 5),
  budget_comfort INTEGER CHECK (budget_comfort >= 1 AND budget_comfort <= 5),
  decision_maker TEXT CHECK (decision_maker IN ('yes', 'no', 'unsure')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Sales Calls table
CREATE TABLE public.sales_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.sales_leads(id) ON DELETE CASCADE NOT NULL,
  stage call_stage NOT NULL DEFAULT 'rapport',
  transcript_notes TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  answers JSONB DEFAULT '[]'::jsonb,
  outcome call_outcome,
  follow_up_email TEXT,
  summary TEXT,
  qualification_score INTEGER DEFAULT 50 CHECK (qualification_score >= 0 AND qualification_score <= 100),
  qualification_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Sales Playbook table
CREATE TABLE public.sales_playbook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  name TEXT NOT NULL,
  playbook_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_sales_leads_email ON public.sales_leads(email);
CREATE INDEX idx_sales_leads_linked_user ON public.sales_leads(linked_user_id);
CREATE INDEX idx_sales_calls_lead ON public.sales_calls(lead_id);
CREATE INDEX idx_sales_playbook_active ON public.sales_playbook(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.sales_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_playbook ENABLE ROW LEVEL SECURITY;

-- Function to check if user is admin (by email)
CREATE OR REPLACE FUNCTION public.is_admin_user(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check against known admin emails
  -- This should match the ADMIN_EMAILS in src/config/admin.ts
  RETURN user_email IN (
    'tom@solvlanguages.com'
  );
END;
$$;

-- RLS Policies for sales_leads
CREATE POLICY "Admins can view all leads" ON public.sales_leads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can insert leads" ON public.sales_leads
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can update leads" ON public.sales_leads
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

-- RLS Policies for sales_calls
CREATE POLICY "Admins can view all calls" ON public.sales_calls
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can insert calls" ON public.sales_calls
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can update calls" ON public.sales_calls
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

-- RLS Policies for sales_playbook
CREATE POLICY "Admins can view all playbooks" ON public.sales_playbook
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can insert playbooks" ON public.sales_playbook
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can update playbooks" ON public.sales_playbook
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

-- Function to auto-link leads to users by email
CREATE OR REPLACE FUNCTION public.auto_link_lead_to_user()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.linked_user_id IS NULL THEN
    SELECT id INTO NEW.linked_user_id
    FROM public.profiles
    WHERE LOWER(email) = LOWER(NEW.email)
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to auto-link on insert/update
CREATE TRIGGER auto_link_lead_trigger
  BEFORE INSERT OR UPDATE ON public.sales_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_link_lead_to_user();

-- Trigger for updated_at on sales_leads
CREATE TRIGGER update_sales_leads_updated_at
  BEFORE UPDATE ON public.sales_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Trigger for updated_at on sales_calls
CREATE TRIGGER update_sales_calls_updated_at
  BEFORE UPDATE ON public.sales_calls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Trigger for updated_at on sales_playbook
CREATE TRIGGER update_sales_playbook_updated_at
  BEFORE UPDATE ON public.sales_playbook
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();


-- ============================================================================
-- FILE: 20260101143952_f497cf23-2d76-4aa8-b5ba-2ed7c1ed110e.sql
-- ============================================================================

-- Sales Copilot Migration
-- Creates tables for leads, calls, and playbook management

-- Enums for call stages and outcomes
CREATE TYPE public.call_stage AS ENUM (
  'rapport',
  'diagnose',
  'qualify',
  'present',
  'objections',
  'close',
  'next_steps'
);

CREATE TYPE public.call_outcome AS ENUM (
  'won',
  'lost',
  'follow_up',
  'refer_out'
);

-- Sales Leads table
CREATE TABLE public.sales_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  linked_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  timezone TEXT,
  country TEXT,
  current_level TEXT,
  goal TEXT,
  deadline_urgency TEXT,
  motivation TEXT,
  biggest_blockers TEXT[],
  past_methods_tried TEXT[],
  time_available_per_week INTEGER,
  willingness_to_speak INTEGER CHECK (willingness_to_speak >= 1 AND willingness_to_speak <= 5),
  budget_comfort INTEGER CHECK (budget_comfort >= 1 AND budget_comfort <= 5),
  decision_maker TEXT CHECK (decision_maker IN ('yes', 'no', 'unsure')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Sales Calls table
CREATE TABLE public.sales_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.sales_leads(id) ON DELETE CASCADE NOT NULL,
  stage call_stage NOT NULL DEFAULT 'rapport',
  transcript_notes TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  answers JSONB DEFAULT '[]'::jsonb,
  outcome call_outcome,
  follow_up_email TEXT,
  summary TEXT,
  qualification_score INTEGER DEFAULT 50 CHECK (qualification_score >= 0 AND qualification_score <= 100),
  qualification_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Sales Playbook table
CREATE TABLE public.sales_playbook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  name TEXT NOT NULL,
  playbook_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_sales_leads_email ON public.sales_leads(email);
CREATE INDEX idx_sales_leads_linked_user ON public.sales_leads(linked_user_id);
CREATE INDEX idx_sales_calls_lead ON public.sales_calls(lead_id);
CREATE INDEX idx_sales_playbook_active ON public.sales_playbook(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.sales_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_playbook ENABLE ROW LEVEL SECURITY;

-- RLS Policies for app_accounts (users can view their own account via user_id link)
CREATE POLICY "Users can view own app_account"
  ON public.app_accounts
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for credit_wallets (users can view their own wallet)
CREATE POLICY "Users can view own credit_wallet"
  ON public.credit_wallets
  FOR SELECT
  USING (
    account_id IN (
      SELECT id FROM public.app_accounts WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for credit_transactions (users can view their own transactions)
CREATE POLICY "Users can view own credit_transactions"
  ON public.credit_transactions
  FOR SELECT
  USING (
    account_id IN (
      SELECT id FROM public.app_accounts WHERE user_id = auth.uid()
    )
  );

-- RLS for systemeio_product_map (only service role can access - no user policies)
-- systemeio_webhook_events has no user access policies (service role only)

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_app_accounts_email ON public.app_accounts(email);
CREATE INDEX IF NOT EXISTS idx_app_accounts_user_id ON public.app_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_wallets_account_id ON public.credit_wallets(account_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_account_id ON public.credit_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created ON public.credit_transactions(account_id, created_at DESC);

-- Trigger to update updated_at on app_accounts
CREATE TRIGGER update_app_accounts_updated_at
  BEFORE UPDATE ON public.app_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Trigger to update updated_at on credit_wallets
CREATE TRIGGER update_credit_wallets_updated_at
  BEFORE UPDATE ON public.credit_wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();


-- ============================================================================
-- FILE: 20251231111732_51d7876c-6308-4001-b2e2-94fa4d8b2105.sql
-- ============================================================================

-- Add RLS policies for systemeio_product_map table (admin management)
CREATE POLICY "Authenticated users can view product map"
ON public.systemeio_product_map
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert product map"
ON public.systemeio_product_map
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update product map"
ON public.systemeio_product_map
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete product map"
ON public.systemeio_product_map
FOR DELETE
TO authenticated
USING (true);


-- ============================================================================
-- FILE: 20260101143952_f497cf23-2d76-4aa8-b5ba-2ed7c1ed110e.sql
-- ============================================================================

-- Sales Copilot Migration
-- Creates tables for leads, calls, and playbook management

-- Enums for call stages and outcomes
CREATE TYPE public.call_stage AS ENUM (
  'rapport',
  'diagnose',
  'qualify',
  'present',
  'objections',
  'close',
  'next_steps'
);

CREATE TYPE public.call_outcome AS ENUM (
  'won',
  'lost',
  'follow_up',
  'refer_out'
);

-- Sales Leads table
CREATE TABLE public.sales_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  linked_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  timezone TEXT,
  country TEXT,
  current_level TEXT,
  goal TEXT,
  deadline_urgency TEXT,
  motivation TEXT,
  biggest_blockers TEXT[],
  past_methods_tried TEXT[],
  time_available_per_week INTEGER,
  willingness_to_speak INTEGER CHECK (willingness_to_speak >= 1 AND willingness_to_speak <= 5),
  budget_comfort INTEGER CHECK (budget_comfort >= 1 AND budget_comfort <= 5),
  decision_maker TEXT CHECK (decision_maker IN ('yes', 'no', 'unsure')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Sales Calls table
CREATE TABLE public.sales_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.sales_leads(id) ON DELETE CASCADE NOT NULL,
  stage call_stage NOT NULL DEFAULT 'rapport',
  transcript_notes TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  answers JSONB DEFAULT '[]'::jsonb,
  outcome call_outcome,
  follow_up_email TEXT,
  summary TEXT,
  qualification_score INTEGER DEFAULT 50 CHECK (qualification_score >= 0 AND qualification_score <= 100),
  qualification_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Sales Playbook table
CREATE TABLE public.sales_playbook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  name TEXT NOT NULL,
  playbook_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_sales_leads_email ON public.sales_leads(email);
CREATE INDEX idx_sales_leads_linked_user ON public.sales_leads(linked_user_id);
CREATE INDEX idx_sales_calls_lead ON public.sales_calls(lead_id);
CREATE INDEX idx_sales_playbook_active ON public.sales_playbook(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.sales_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_playbook ENABLE ROW LEVEL SECURITY;

-- RLS Policies (admin-only access)
-- Note: We'll use a function to check admin status
-- For now, we'll allow service role and check admin in application layer

-- Function to check if user is admin (by email)
CREATE OR REPLACE FUNCTION public.is_admin_user(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check against known admin emails
  -- This should match the ADMIN_EMAILS in src/config/admin.ts
  RETURN user_email IN (
    'tom@solvlanguages.com'
  );
END;
$$;

-- RLS Policies for sales_leads
CREATE POLICY "Admins can view all leads" ON public.sales_leads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can insert leads" ON public.sales_leads
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can update leads" ON public.sales_leads
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

-- RLS Policies for sales_calls
CREATE POLICY "Admins can view all calls" ON public.sales_calls
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can insert calls" ON public.sales_calls
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can update calls" ON public.sales_calls
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

-- RLS Policies for sales_playbook
CREATE POLICY "Admins can view all playbooks" ON public.sales_playbook
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can insert playbooks" ON public.sales_playbook
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can update playbooks" ON public.sales_playbook
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

-- Function to auto-link leads to users by email
CREATE OR REPLACE FUNCTION public.auto_link_lead_to_user()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.linked_user_id IS NULL THEN
    SELECT id INTO NEW.linked_user_id
    FROM public.profiles
    WHERE LOWER(email) = LOWER(NEW.email)
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to auto-link on insert/update
CREATE TRIGGER auto_link_lead_trigger
  BEFORE INSERT OR UPDATE ON public.sales_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_link_lead_to_user();

-- Trigger for updated_at on sales_leads
CREATE TRIGGER update_sales_leads_updated_at
  BEFORE UPDATE ON public.sales_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Trigger for updated_at on sales_calls
CREATE TRIGGER update_sales_calls_updated_at
  BEFORE UPDATE ON public.sales_calls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Trigger for updated_at on sales_playbook
CREATE TRIGGER update_sales_playbook_updated_at
  BEFORE UPDATE ON public.sales_playbook
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();


-- ============================================================================
-- FILE: 20260101144059_9a2a7c88-20dc-4933-9792-eb3d0301faad.sql
-- ============================================================================

-- Fix search_path for auto_link_lead_to_user function
CREATE OR REPLACE FUNCTION public.auto_link_lead_to_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.linked_user_id IS NULL THEN
    SELECT id INTO NEW.linked_user_id
    FROM public.profiles
    WHERE LOWER(email) = LOWER(NEW.email)
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;


-- ============================================================================
-- FILE: 20260101212344_sales_copilot.sql
-- ============================================================================

-- Sales Copilot Migration
-- Creates tables for leads, calls, and playbook management

-- Enums for call stages and outcomes
CREATE TYPE public.call_stage AS ENUM (
  'rapport',
  'diagnose',
  'qualify',
  'present',
  'objections',
  'close',
  'next_steps'
);

CREATE TYPE public.call_outcome AS ENUM (
  'won',
  'lost',
  'follow_up',
  'refer_out'
);

-- Sales Leads table
CREATE TABLE public.sales_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  linked_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  timezone TEXT,
  country TEXT,
  current_level TEXT,
  goal TEXT,
  deadline_urgency TEXT,
  motivation TEXT,
  biggest_blockers TEXT[],
  past_methods_tried TEXT[],
  time_available_per_week INTEGER,
  willingness_to_speak INTEGER CHECK (willingness_to_speak >= 1 AND willingness_to_speak <= 5),
  budget_comfort INTEGER CHECK (budget_comfort >= 1 AND budget_comfort <= 5),
  decision_maker TEXT CHECK (decision_maker IN ('yes', 'no', 'unsure')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Sales Calls table
CREATE TABLE public.sales_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.sales_leads(id) ON DELETE CASCADE NOT NULL,
  stage call_stage NOT NULL DEFAULT 'rapport',
  transcript_notes TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  answers JSONB DEFAULT '[]'::jsonb,
  outcome call_outcome,
  follow_up_email TEXT,
  summary TEXT,
  qualification_score INTEGER DEFAULT 50 CHECK (qualification_score >= 0 AND qualification_score <= 100),
  qualification_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Sales Playbook table
CREATE TABLE public.sales_playbook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  name TEXT NOT NULL,
  playbook_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_sales_leads_email ON public.sales_leads(email);
CREATE INDEX idx_sales_leads_linked_user ON public.sales_leads(linked_user_id);
CREATE INDEX idx_sales_calls_lead ON public.sales_calls(lead_id);
CREATE INDEX idx_sales_playbook_active ON public.sales_playbook(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.sales_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_playbook ENABLE ROW LEVEL SECURITY;

-- RLS Policies (admin-only access)
-- Note: We'll use a function to check admin status
-- For now, we'll allow service role and check admin in application layer

-- Function to check if user is admin (by email)
CREATE OR REPLACE FUNCTION public.is_admin_user(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check against known admin emails
  -- This should match the ADMIN_EMAILS in src/config/admin.ts
  RETURN user_email IN (
    'tom@solvlanguages.com'
  );
END;
$$;

-- RLS Policies for sales_leads
CREATE POLICY "Admins can view all leads" ON public.sales_leads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can insert leads" ON public.sales_leads
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can update leads" ON public.sales_leads
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

-- RLS Policies for sales_calls
CREATE POLICY "Admins can view all calls" ON public.sales_calls
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can insert calls" ON public.sales_calls
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can update calls" ON public.sales_calls
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

-- RLS Policies for sales_playbook
CREATE POLICY "Admins can view all playbooks" ON public.sales_playbook
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can insert playbooks" ON public.sales_playbook
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can update playbooks" ON public.sales_playbook
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

-- Function to auto-link leads to users by email
CREATE OR REPLACE FUNCTION public.auto_link_lead_to_user()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.linked_user_id IS NULL THEN
    SELECT id INTO NEW.linked_user_id
    FROM public.profiles
    WHERE LOWER(email) = LOWER(NEW.email)
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to auto-link on insert/update
CREATE TRIGGER auto_link_lead_trigger
  BEFORE INSERT OR UPDATE ON public.sales_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_link_lead_to_user();

-- Trigger for updated_at on sales_leads
CREATE TRIGGER update_sales_leads_updated_at
  BEFORE UPDATE ON public.sales_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Trigger for updated_at on sales_calls
CREATE TRIGGER update_sales_calls_updated_at
  BEFORE UPDATE ON public.sales_calls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Trigger for updated_at on sales_playbook
CREATE TRIGGER update_sales_playbook_updated_at
  BEFORE UPDATE ON public.sales_playbook
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();


-- ============================================================================
-- FILE: 20260101144059_9a2a7c88-20dc-4933-9792-eb3d0301faad.sql
-- ============================================================================

-- Fix search_path for auto_link_lead_to_user function
CREATE OR REPLACE FUNCTION public.auto_link_lead_to_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.linked_user_id IS NULL THEN
    SELECT id INTO NEW.linked_user_id
    FROM public.profiles
    WHERE LOWER(email) = LOWER(NEW.email)
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;


-- ============================================================================
-- FILE: 20260101212344_sales_copilot.sql
-- ============================================================================

-- Sales Copilot Migration
-- Creates tables for leads, calls, and playbook management

-- Enums for call stages and outcomes
CREATE TYPE public.call_stage AS ENUM (
  'rapport',
  'diagnose',
  'qualify',
  'present',
  'objections',
  'close',
  'next_steps'
);

CREATE TYPE public.call_outcome AS ENUM (
  'won',
  'lost',
  'follow_up',
  'refer_out'
);

-- Sales Leads table
CREATE TABLE public.sales_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  linked_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  timezone TEXT,
  country TEXT,
  current_level TEXT,
  goal TEXT,
  deadline_urgency TEXT,
  motivation TEXT,
  biggest_blockers TEXT[],
  past_methods_tried TEXT[],
  time_available_per_week INTEGER,
  willingness_to_speak INTEGER CHECK (willingness_to_speak >= 1 AND willingness_to_speak <= 5),
  budget_comfort INTEGER CHECK (budget_comfort >= 1 AND budget_comfort <= 5),
  decision_maker TEXT CHECK (decision_maker IN ('yes', 'no', 'unsure')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Sales Calls table
CREATE TABLE public.sales_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.sales_leads(id) ON DELETE CASCADE NOT NULL,
  stage call_stage NOT NULL DEFAULT 'rapport',
  transcript_notes TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  answers JSONB DEFAULT '[]'::jsonb,
  outcome call_outcome,
  follow_up_email TEXT,
  summary TEXT,
  qualification_score INTEGER DEFAULT 50 CHECK (qualification_score >= 0 AND qualification_score <= 100),
  qualification_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Sales Playbook table
CREATE TABLE public.sales_playbook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  name TEXT NOT NULL,
  playbook_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_sales_leads_email ON public.sales_leads(email);
CREATE INDEX idx_sales_leads_linked_user ON public.sales_leads(linked_user_id);
CREATE INDEX idx_sales_calls_lead ON public.sales_calls(lead_id);
CREATE INDEX idx_sales_playbook_active ON public.sales_playbook(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.sales_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_playbook ENABLE ROW LEVEL SECURITY;

-- RLS Policies (admin-only access)
-- Note: We'll use a function to check admin status
-- For now, we'll allow service role and check admin in application layer

-- Function to check if user is admin (by email)
CREATE OR REPLACE FUNCTION public.is_admin_user(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check against known admin emails
  -- This should match the ADMIN_EMAILS in src/config/admin.ts
  RETURN user_email IN (
    'tom@solvlanguages.com'
  );
END;
$$;

-- RLS Policies for sales_leads
CREATE POLICY "Admins can view all leads" ON public.sales_leads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can insert leads" ON public.sales_leads
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can update leads" ON public.sales_leads
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

-- RLS Policies for sales_calls
CREATE POLICY "Admins can view all calls" ON public.sales_calls
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can insert calls" ON public.sales_calls
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can update calls" ON public.sales_calls
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

-- RLS Policies for sales_playbook
CREATE POLICY "Admins can view all playbooks" ON public.sales_playbook
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can insert playbooks" ON public.sales_playbook
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can update playbooks" ON public.sales_playbook
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

-- Function to auto-link leads to users by email
CREATE OR REPLACE FUNCTION public.auto_link_lead_to_user()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.linked_user_id IS NULL THEN
    SELECT id INTO NEW.linked_user_id
    FROM public.profiles
    WHERE LOWER(email) = LOWER(NEW.email)
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to auto-link on insert/update
CREATE TRIGGER auto_link_lead_trigger
  BEFORE INSERT OR UPDATE ON public.sales_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_link_lead_to_user();

-- Trigger for updated_at on sales_leads
CREATE TRIGGER update_sales_leads_updated_at
  BEFORE UPDATE ON public.sales_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Trigger for updated_at on sales_calls
CREATE TRIGGER update_sales_calls_updated_at
  BEFORE UPDATE ON public.sales_calls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Trigger for updated_at on sales_playbook
CREATE TRIGGER update_sales_playbook_updated_at
  BEFORE UPDATE ON public.sales_playbook
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();


-- ============================================================================
-- FILE: 20260101144059_9a2a7c88-20dc-4933-9792-eb3d0301faad.sql
-- ============================================================================

-- Fix search_path for auto_link_lead_to_user function
CREATE OR REPLACE FUNCTION public.auto_link_lead_to_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.linked_user_id IS NULL THEN
    SELECT id INTO NEW.linked_user_id
    FROM public.profiles
    WHERE LOWER(email) = LOWER(NEW.email)
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;


-- ============================================================================
-- FILE: 20260101212344_sales_copilot.sql
-- ============================================================================

-- Sales Copilot Migration
-- Creates tables for leads, calls, and playbook management

-- Enums for call stages and outcomes
CREATE TYPE public.call_stage AS ENUM (
  'rapport',
  'diagnose',
  'qualify',
  'present',
  'objections',
  'close',
  'next_steps'
);

CREATE TYPE public.call_outcome AS ENUM (
  'won',
  'lost',
  'follow_up',
  'refer_out'
);

-- Sales Leads table
CREATE TABLE public.sales_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  linked_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  timezone TEXT,
  country TEXT,
  current_level TEXT,
  goal TEXT,
  deadline_urgency TEXT,
  motivation TEXT,
  biggest_blockers TEXT[],
  past_methods_tried TEXT[],
  time_available_per_week INTEGER,
  willingness_to_speak INTEGER CHECK (willingness_to_speak >= 1 AND willingness_to_speak <= 5),
  budget_comfort INTEGER CHECK (budget_comfort >= 1 AND budget_comfort <= 5),
  decision_maker TEXT CHECK (decision_maker IN ('yes', 'no', 'unsure')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Sales Calls table
CREATE TABLE public.sales_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.sales_leads(id) ON DELETE CASCADE NOT NULL,
  stage call_stage NOT NULL DEFAULT 'rapport',
  transcript_notes TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  answers JSONB DEFAULT '[]'::jsonb,
  outcome call_outcome,
  follow_up_email TEXT,
  summary TEXT,
  qualification_score INTEGER DEFAULT 50 CHECK (qualification_score >= 0 AND qualification_score <= 100),
  qualification_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Sales Playbook table
CREATE TABLE public.sales_playbook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  name TEXT NOT NULL,
  playbook_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_sales_leads_email ON public.sales_leads(email);
CREATE INDEX idx_sales_leads_linked_user ON public.sales_leads(linked_user_id);
CREATE INDEX idx_sales_calls_lead ON public.sales_calls(lead_id);
CREATE INDEX idx_sales_playbook_active ON public.sales_playbook(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.sales_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_playbook ENABLE ROW LEVEL SECURITY;

-- RLS Policies (admin-only access)
-- Note: We'll use a function to check admin status
-- For now, we'll allow service role and check admin in application layer

-- Function to check if user is admin (by email)
CREATE OR REPLACE FUNCTION public.is_admin_user(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check against known admin emails
  -- This should match the ADMIN_EMAILS in src/config/admin.ts
  RETURN user_email IN (
    'tom@solvlanguages.com'
  );
END;
$$;

-- RLS Policies for sales_leads
CREATE POLICY "Admins can view all leads" ON public.sales_leads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can insert leads" ON public.sales_leads
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can update leads" ON public.sales_leads
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

-- RLS Policies for sales_calls
CREATE POLICY "Admins can view all calls" ON public.sales_calls
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can insert calls" ON public.sales_calls
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can update calls" ON public.sales_calls
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

-- RLS Policies for sales_playbook
CREATE POLICY "Admins can view all playbooks" ON public.sales_playbook
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can insert playbooks" ON public.sales_playbook
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can update playbooks" ON public.sales_playbook
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

-- Function to auto-link leads to users by email
CREATE OR REPLACE FUNCTION public.auto_link_lead_to_user()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.linked_user_id IS NULL THEN
    SELECT id INTO NEW.linked_user_id
    FROM public.profiles
    WHERE LOWER(email) = LOWER(NEW.email)
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to auto-link on insert/update
CREATE TRIGGER auto_link_lead_trigger
  BEFORE INSERT OR UPDATE ON public.sales_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_link_lead_to_user();

-- Trigger for updated_at on sales_leads
CREATE TRIGGER update_sales_leads_updated_at
  BEFORE UPDATE ON public.sales_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Trigger for updated_at on sales_calls
CREATE TRIGGER update_sales_calls_updated_at
  BEFORE UPDATE ON public.sales_calls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Trigger for updated_at on sales_playbook
CREATE TRIGGER update_sales_playbook_updated_at
  BEFORE UPDATE ON public.sales_playbook
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();


-- ============================================================================
-- FILE: 20260101144059_9a2a7c88-20dc-4933-9792-eb3d0301faad.sql
-- ============================================================================

-- Fix search_path for auto_link_lead_to_user function
CREATE OR REPLACE FUNCTION public.auto_link_lead_to_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.linked_user_id IS NULL THEN
    SELECT id INTO NEW.linked_user_id
    FROM public.profiles
    WHERE LOWER(email) = LOWER(NEW.email)
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;


-- ============================================================================
-- FILE: 20260101212344_sales_copilot.sql
-- ============================================================================

-- Sales Copilot Migration
-- Creates tables for leads, calls, and playbook management

-- Enums for call stages and outcomes
CREATE TYPE public.call_stage AS ENUM (
  'rapport',
  'diagnose',
  'qualify',
  'present',
  'objections',
  'close',
  'next_steps'
);

CREATE TYPE public.call_outcome AS ENUM (
  'won',
  'lost',
  'follow_up',
  'refer_out'
);

-- Sales Leads table
CREATE TABLE public.sales_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  linked_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  timezone TEXT,
  country TEXT,
  current_level TEXT,
  goal TEXT,
  deadline_urgency TEXT,
  motivation TEXT,
  biggest_blockers TEXT[],
  past_methods_tried TEXT[],
  time_available_per_week INTEGER,
  willingness_to_speak INTEGER CHECK (willingness_to_speak >= 1 AND willingness_to_speak <= 5),
  budget_comfort INTEGER CHECK (budget_comfort >= 1 AND budget_comfort <= 5),
  decision_maker TEXT CHECK (decision_maker IN ('yes', 'no', 'unsure')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Sales Calls table
CREATE TABLE public.sales_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.sales_leads(id) ON DELETE CASCADE NOT NULL,
  stage call_stage NOT NULL DEFAULT 'rapport',
  transcript_notes TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  answers JSONB DEFAULT '[]'::jsonb,
  outcome call_outcome,
  follow_up_email TEXT,
  summary TEXT,
  qualification_score INTEGER DEFAULT 50 CHECK (qualification_score >= 0 AND qualification_score <= 100),
  qualification_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Sales Playbook table
CREATE TABLE public.sales_playbook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  name TEXT NOT NULL,
  playbook_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_sales_leads_email ON public.sales_leads(email);
CREATE INDEX idx_sales_leads_linked_user ON public.sales_leads(linked_user_id);
CREATE INDEX idx_sales_calls_lead ON public.sales_calls(lead_id);
CREATE INDEX idx_sales_playbook_active ON public.sales_playbook(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.sales_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_playbook ENABLE ROW LEVEL SECURITY;

-- RLS Policies (admin-only access)
-- Note: We'll use a function to check admin status
-- For now, we'll allow service role and check admin in application layer

-- Function to check if user is admin (by email)
CREATE OR REPLACE FUNCTION public.is_admin_user(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check against known admin emails
  -- This should match the ADMIN_EMAILS in src/config/admin.ts
  RETURN user_email IN (
    'tom@solvlanguages.com'
  );
END;
$$;

-- RLS Policies for sales_leads
CREATE POLICY "Admins can view all leads" ON public.sales_leads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can insert leads" ON public.sales_leads
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can update leads" ON public.sales_leads
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

-- RLS Policies for sales_calls
CREATE POLICY "Admins can view all calls" ON public.sales_calls
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can insert calls" ON public.sales_calls
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can update calls" ON public.sales_calls
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

-- RLS Policies for sales_playbook
CREATE POLICY "Admins can view all playbooks" ON public.sales_playbook
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can insert playbooks" ON public.sales_playbook
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can update playbooks" ON public.sales_playbook
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

-- Function to auto-link leads to users by email
CREATE OR REPLACE FUNCTION public.auto_link_lead_to_user()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.linked_user_id IS NULL THEN
    SELECT id INTO NEW.linked_user_id
    FROM public.profiles
    WHERE LOWER(email) = LOWER(NEW.email)
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to auto-link on insert/update
CREATE TRIGGER auto_link_lead_trigger
  BEFORE INSERT OR UPDATE ON public.sales_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_link_lead_to_user();

-- Trigger for updated_at on sales_leads
CREATE TRIGGER update_sales_leads_updated_at
  BEFORE UPDATE ON public.sales_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Trigger for updated_at on sales_calls
CREATE TRIGGER update_sales_calls_updated_at
  BEFORE UPDATE ON public.sales_calls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Trigger for updated_at on sales_playbook
CREATE TRIGGER update_sales_playbook_updated_at
  BEFORE UPDATE ON public.sales_playbook
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();


-- ============================================================================
-- FILE: 20260101144059_9a2a7c88-20dc-4933-9792-eb3d0301faad.sql
-- ============================================================================

-- Fix search_path for auto_link_lead_to_user function
CREATE OR REPLACE FUNCTION public.auto_link_lead_to_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.linked_user_id IS NULL THEN
    SELECT id INTO NEW.linked_user_id
    FROM public.profiles
    WHERE LOWER(email) = LOWER(NEW.email)
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;


-- ============================================================================
-- FILE: 20260101212344_sales_copilot.sql
-- ============================================================================

-- Sales Copilot Migration
-- Creates tables for leads, calls, and playbook management

-- Enums for call stages and outcomes
CREATE TYPE public.call_stage AS ENUM (
  'rapport',
  'diagnose',
  'qualify',
  'present',
  'objections',
  'close',
  'next_steps'
);

CREATE TYPE public.call_outcome AS ENUM (
  'won',
  'lost',
  'follow_up',
  'refer_out'
);

-- Sales Leads table
CREATE TABLE public.sales_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  linked_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  timezone TEXT,
  country TEXT,
  current_level TEXT,
  goal TEXT,
  deadline_urgency TEXT,
  motivation TEXT,
  biggest_blockers TEXT[],
  past_methods_tried TEXT[],
  time_available_per_week INTEGER,
  willingness_to_speak INTEGER CHECK (willingness_to_speak >= 1 AND willingness_to_speak <= 5),
  budget_comfort INTEGER CHECK (budget_comfort >= 1 AND budget_comfort <= 5),
  decision_maker TEXT CHECK (decision_maker IN ('yes', 'no', 'unsure')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Sales Calls table
CREATE TABLE public.sales_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.sales_leads(id) ON DELETE CASCADE NOT NULL,
  stage call_stage NOT NULL DEFAULT 'rapport',
  transcript_notes TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  answers JSONB DEFAULT '[]'::jsonb,
  outcome call_outcome,
  follow_up_email TEXT,
  summary TEXT,
  qualification_score INTEGER DEFAULT 50 CHECK (qualification_score >= 0 AND qualification_score <= 100),
  qualification_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Sales Playbook table
CREATE TABLE public.sales_playbook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  name TEXT NOT NULL,
  playbook_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_sales_leads_email ON public.sales_leads(email);
CREATE INDEX idx_sales_leads_linked_user ON public.sales_leads(linked_user_id);
CREATE INDEX idx_sales_calls_lead ON public.sales_calls(lead_id);
CREATE INDEX idx_sales_playbook_active ON public.sales_playbook(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.sales_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_playbook ENABLE ROW LEVEL SECURITY;

-- RLS Policies (admin-only access)
-- Note: We'll use a function to check admin status
-- For now, we'll allow service role and check admin in application layer

-- Function to check if user is admin (by email)
CREATE OR REPLACE FUNCTION public.is_admin_user(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check against known admin emails
  -- This should match the ADMIN_EMAILS in src/config/admin.ts
  RETURN user_email IN (
    'tom@solvlanguages.com'
  );
END;
$$;

-- RLS Policies for sales_leads
CREATE POLICY "Admins can view all leads" ON public.sales_leads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can insert leads" ON public.sales_leads
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can update leads" ON public.sales_leads
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

-- RLS Policies for sales_calls
CREATE POLICY "Admins can view all calls" ON public.sales_calls
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can insert calls" ON public.sales_calls
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can update calls" ON public.sales_calls
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

-- RLS Policies for sales_playbook
CREATE POLICY "Admins can view all playbooks" ON public.sales_playbook
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can insert playbooks" ON public.sales_playbook
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can update playbooks" ON public.sales_playbook
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

-- Function to auto-link leads to users by email
CREATE OR REPLACE FUNCTION public.auto_link_lead_to_user()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.linked_user_id IS NULL THEN
    SELECT id INTO NEW.linked_user_id
    FROM public.profiles
    WHERE LOWER(email) = LOWER(NEW.email)
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to auto-link on insert/update
CREATE TRIGGER auto_link_lead_trigger
  BEFORE INSERT OR UPDATE ON public.sales_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_link_lead_to_user();

-- Trigger for updated_at on sales_leads
CREATE TRIGGER update_sales_leads_updated_at
  BEFORE UPDATE ON public.sales_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Trigger for updated_at on sales_calls
CREATE TRIGGER update_sales_calls_updated_at
  BEFORE UPDATE ON public.sales_calls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Trigger for updated_at on sales_playbook
CREATE TRIGGER update_sales_playbook_updated_at
  BEFORE UPDATE ON public.sales_playbook
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();


-- ============================================================================
-- FILE: 20260101144059_9a2a7c88-20dc-4933-9792-eb3d0301faad.sql
-- ============================================================================

-- Fix search_path for auto_link_lead_to_user function
CREATE OR REPLACE FUNCTION public.auto_link_lead_to_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.linked_user_id IS NULL THEN
    SELECT id INTO NEW.linked_user_id
    FROM public.profiles
    WHERE LOWER(email) = LOWER(NEW.email)
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;


-- ============================================================================
-- FILE: 20260101212344_sales_copilot.sql
-- ============================================================================

-- Sales Copilot Migration
-- Creates tables for leads, calls, and playbook management

-- Enums for call stages and outcomes
CREATE TYPE public.call_stage AS ENUM (
  'rapport',
  'diagnose',
  'qualify',
  'present',
  'objections',
  'close',
  'next_steps'
);

CREATE TYPE public.call_outcome AS ENUM (
  'won',
  'lost',
  'follow_up',
  'refer_out'
);

-- Sales Leads table
CREATE TABLE public.sales_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  linked_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  timezone TEXT,
  country TEXT,
  current_level TEXT,
  goal TEXT,
  deadline_urgency TEXT,
  motivation TEXT,
  biggest_blockers TEXT[],
  past_methods_tried TEXT[],
  time_available_per_week INTEGER,
  willingness_to_speak INTEGER CHECK (willingness_to_speak >= 1 AND willingness_to_speak <= 5),
  budget_comfort INTEGER CHECK (budget_comfort >= 1 AND budget_comfort <= 5),
  decision_maker TEXT CHECK (decision_maker IN ('yes', 'no', 'unsure')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Sales Calls table
CREATE TABLE public.sales_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.sales_leads(id) ON DELETE CASCADE NOT NULL,
  stage call_stage NOT NULL DEFAULT 'rapport',
  transcript_notes TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  answers JSONB DEFAULT '[]'::jsonb,
  outcome call_outcome,
  follow_up_email TEXT,
  summary TEXT,
  qualification_score INTEGER DEFAULT 50 CHECK (qualification_score >= 0 AND qualification_score <= 100),
  qualification_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Sales Playbook table
CREATE TABLE public.sales_playbook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  name TEXT NOT NULL,
  playbook_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_sales_leads_email ON public.sales_leads(email);
CREATE INDEX idx_sales_leads_linked_user ON public.sales_leads(linked_user_id);
CREATE INDEX idx_sales_calls_lead ON public.sales_calls(lead_id);
CREATE INDEX idx_sales_playbook_active ON public.sales_playbook(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.sales_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_playbook ENABLE ROW LEVEL SECURITY;

-- RLS Policies (admin-only access)
-- Note: We'll use a function to check admin status
-- For now, we'll allow service role and check admin in application layer

-- Function to check if user is admin (by email)
CREATE OR REPLACE FUNCTION public.is_admin_user(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check against known admin emails
  -- This should match the ADMIN_EMAILS in src/config/admin.ts
  RETURN user_email IN (
    'tom@solvlanguages.com'
  );
END;
$$;

-- RLS Policies for sales_leads
CREATE POLICY "Admins can view all leads" ON public.sales_leads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can insert leads" ON public.sales_leads
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can update leads" ON public.sales_leads
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

-- RLS Policies for sales_calls
CREATE POLICY "Admins can view all calls" ON public.sales_calls
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can insert calls" ON public.sales_calls
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can update calls" ON public.sales_calls
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

-- RLS Policies for sales_playbook
CREATE POLICY "Admins can view all playbooks" ON public.sales_playbook
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can insert playbooks" ON public.sales_playbook
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can update playbooks" ON public.sales_playbook
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

-- Function to auto-link leads to users by email
CREATE OR REPLACE FUNCTION public.auto_link_lead_to_user()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.linked_user_id IS NULL THEN
    SELECT id INTO NEW.linked_user_id
    FROM public.profiles
    WHERE LOWER(email) = LOWER(NEW.email)
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to auto-link on insert/update
CREATE TRIGGER auto_link_lead_trigger
  BEFORE INSERT OR UPDATE ON public.sales_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_link_lead_to_user();

-- Trigger for updated_at on sales_leads
CREATE TRIGGER update_sales_leads_updated_at
  BEFORE UPDATE ON public.sales_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Trigger for updated_at on sales_calls
CREATE TRIGGER update_sales_calls_updated_at
  BEFORE UPDATE ON public.sales_calls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Trigger for updated_at on sales_playbook
CREATE TRIGGER update_sales_playbook_updated_at
  BEFORE UPDATE ON public.sales_playbook
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();


-- ============================================================================
-- FILE: 20260101144059_9a2a7c88-20dc-4933-9792-eb3d0301faad.sql
-- ============================================================================

-- Fix search_path for auto_link_lead_to_user function
CREATE OR REPLACE FUNCTION public.auto_link_lead_to_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.linked_user_id IS NULL THEN
    SELECT id INTO NEW.linked_user_id
    FROM public.profiles
    WHERE LOWER(email) = LOWER(NEW.email)
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;


-- ============================================================================
-- FILE: 20260101212344_sales_copilot.sql
-- ============================================================================

-- Sales Copilot Migration
-- Creates tables for leads, calls, and playbook management

-- Enums for call stages and outcomes
CREATE TYPE public.call_stage AS ENUM (
  'rapport',
  'diagnose',
  'qualify',
  'present',
  'objections',
  'close',
  'next_steps'
);

CREATE TYPE public.call_outcome AS ENUM (
  'won',
  'lost',
  'follow_up',
  'refer_out'
);

-- Sales Leads table
CREATE TABLE public.sales_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  linked_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  timezone TEXT,
  country TEXT,
  current_level TEXT,
  goal TEXT,
  deadline_urgency TEXT,
  motivation TEXT,
  biggest_blockers TEXT[],
  past_methods_tried TEXT[],
  time_available_per_week INTEGER,
  willingness_to_speak INTEGER CHECK (willingness_to_speak >= 1 AND willingness_to_speak <= 5),
  budget_comfort INTEGER CHECK (budget_comfort >= 1 AND budget_comfort <= 5),
  decision_maker TEXT CHECK (decision_maker IN ('yes', 'no', 'unsure')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Sales Calls table
CREATE TABLE public.sales_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.sales_leads(id) ON DELETE CASCADE NOT NULL,
  stage call_stage NOT NULL DEFAULT 'rapport',
  transcript_notes TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  answers JSONB DEFAULT '[]'::jsonb,
  outcome call_outcome,
  follow_up_email TEXT,
  summary TEXT,
  qualification_score INTEGER DEFAULT 50 CHECK (qualification_score >= 0 AND qualification_score <= 100),
  qualification_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Sales Playbook table
CREATE TABLE public.sales_playbook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  name TEXT NOT NULL,
  playbook_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_sales_leads_email ON public.sales_leads(email);
CREATE INDEX idx_sales_leads_linked_user ON public.sales_leads(linked_user_id);
CREATE INDEX idx_sales_calls_lead ON public.sales_calls(lead_id);
CREATE INDEX idx_sales_playbook_active ON public.sales_playbook(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.sales_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_playbook ENABLE ROW LEVEL SECURITY;

-- RLS Policies (admin-only access)
-- Note: We'll use a function to check admin status
-- For now, we'll allow service role and check admin in application layer

-- Function to check if user is admin (by email)
CREATE OR REPLACE FUNCTION public.is_admin_user(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check against known admin emails
  -- This should match the ADMIN_EMAILS in src/config/admin.ts
  RETURN user_email IN (
    'tom@solvlanguages.com'
  );
END;
$$;

-- RLS Policies for sales_leads
CREATE POLICY "Admins can view all leads" ON public.sales_leads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can insert leads" ON public.sales_leads
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can update leads" ON public.sales_leads
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

-- RLS Policies for sales_calls
CREATE POLICY "Admins can view all calls" ON public.sales_calls
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can insert calls" ON public.sales_calls
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can update calls" ON public.sales_calls
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

-- RLS Policies for sales_playbook
CREATE POLICY "Admins can view all playbooks" ON public.sales_playbook
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can insert playbooks" ON public.sales_playbook
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can update playbooks" ON public.sales_playbook
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

-- Function to auto-link leads to users by email
CREATE OR REPLACE FUNCTION public.auto_link_lead_to_user()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.linked_user_id IS NULL THEN
    SELECT id INTO NEW.linked_user_id
    FROM public.profiles
    WHERE LOWER(email) = LOWER(NEW.email)
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to auto-link on insert/update
CREATE TRIGGER auto_link_lead_trigger
  BEFORE INSERT OR UPDATE ON public.sales_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_link_lead_to_user();

-- Trigger for updated_at on sales_leads
CREATE TRIGGER update_sales_leads_updated_at
  BEFORE UPDATE ON public.sales_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Trigger for updated_at on sales_calls
CREATE TRIGGER update_sales_calls_updated_at
  BEFORE UPDATE ON public.sales_calls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Trigger for updated_at on sales_playbook
CREATE TRIGGER update_sales_playbook_updated_at
  BEFORE UPDATE ON public.sales_playbook
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();


-- ============================================================================
-- FILE: 20260101144059_9a2a7c88-20dc-4933-9792-eb3d0301faad.sql
-- ============================================================================

-- Fix search_path for auto_link_lead_to_user function
CREATE OR REPLACE FUNCTION public.auto_link_lead_to_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.linked_user_id IS NULL THEN
    SELECT id INTO NEW.linked_user_id
    FROM public.profiles
    WHERE LOWER(email) = LOWER(NEW.email)
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;


-- ============================================================================
-- FILE: 20260101212344_sales_copilot.sql
-- ============================================================================

-- Sales Copilot Migration
-- Creates tables for leads, calls, and playbook management

-- Enums for call stages and outcomes
CREATE TYPE public.call_stage AS ENUM (
  'rapport',
  'diagnose',
  'qualify',
  'present',
  'objections',
  'close',
  'next_steps'
);

CREATE TYPE public.call_outcome AS ENUM (
  'won',
  'lost',
  'follow_up',
  'refer_out'
);

-- Sales Leads table
CREATE TABLE public.sales_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  linked_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  timezone TEXT,
  country TEXT,
  current_level TEXT,
  goal TEXT,
  deadline_urgency TEXT,
  motivation TEXT,
  biggest_blockers TEXT[],
  past_methods_tried TEXT[],
  time_available_per_week INTEGER,
  willingness_to_speak INTEGER CHECK (willingness_to_speak >= 1 AND willingness_to_speak <= 5),
  budget_comfort INTEGER CHECK (budget_comfort >= 1 AND budget_comfort <= 5),
  decision_maker TEXT CHECK (decision_maker IN ('yes', 'no', 'unsure')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Sales Calls table
CREATE TABLE public.sales_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.sales_leads(id) ON DELETE CASCADE NOT NULL,
  stage call_stage NOT NULL DEFAULT 'rapport',
  transcript_notes TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  answers JSONB DEFAULT '[]'::jsonb,
  outcome call_outcome,
  follow_up_email TEXT,
  summary TEXT,
  qualification_score INTEGER DEFAULT 50 CHECK (qualification_score >= 0 AND qualification_score <= 100),
  qualification_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Sales Playbook table
CREATE TABLE public.sales_playbook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  name TEXT NOT NULL,
  playbook_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_sales_leads_email ON public.sales_leads(email);
CREATE INDEX idx_sales_leads_linked_user ON public.sales_leads(linked_user_id);
CREATE INDEX idx_sales_calls_lead ON public.sales_calls(lead_id);
CREATE INDEX idx_sales_playbook_active ON public.sales_playbook(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.sales_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_playbook ENABLE ROW LEVEL SECURITY;

-- RLS Policies (admin-only access)
-- Note: We'll use a function to check admin status
-- For now, we'll allow service role and check admin in application layer

-- Function to check if user is admin (by email)
CREATE OR REPLACE FUNCTION public.is_admin_user(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check against known admin emails
  -- This should match the ADMIN_EMAILS in src/config/admin.ts
  RETURN user_email IN (
    'tom@solvlanguages.com'
  );
END;
$$;

-- RLS Policies for sales_leads
CREATE POLICY "Admins can view all leads" ON public.sales_leads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can insert leads" ON public.sales_leads
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can update leads" ON public.sales_leads
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

-- RLS Policies for sales_calls
CREATE POLICY "Admins can view all calls" ON public.sales_calls
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can insert calls" ON public.sales_calls
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can update calls" ON public.sales_calls
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

-- RLS Policies for sales_playbook
CREATE POLICY "Admins can view all playbooks" ON public.sales_playbook
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can insert playbooks" ON public.sales_playbook
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

CREATE POLICY "Admins can update playbooks" ON public.sales_playbook
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND public.is_admin_user(email)
    )
  );

-- Function to auto-link leads to users by email
CREATE OR REPLACE FUNCTION public.auto_link_lead_to_user()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.linked_user_id IS NULL THEN
    SELECT id INTO NEW.linked_user_id
    FROM public.profiles
    WHERE LOWER(email) = LOWER(NEW.email)
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to auto-link on insert/update
CREATE TRIGGER auto_link_lead_trigger
  BEFORE INSERT OR UPDATE ON public.sales_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_link_lead_to_user();

-- Trigger for updated_at on sales_leads
CREATE TRIGGER update_sales_leads_updated_at
  BEFORE UPDATE ON public.sales_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Trigger for updated_at on sales_calls
CREATE TRIGGER update_sales_calls_updated_at
  BEFORE UPDATE ON public.sales_calls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Trigger for updated_at on sales_playbook
CREATE TRIGGER update_sales_playbook_updated_at
  BEFORE UPDATE ON public.sales_playbook
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();


-- ============================================================================
-- FILE: 20260101144059_9a2a7c88-20dc-4933-9792-eb3d0301faad.sql
-- ============================================================================

-- Fix search_path for auto_link_lead_to_user function
CREATE OR REPLACE FUNCTION public.auto_link_lead_to_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.linked_user_id IS NULL THEN
    SELECT id INTO NEW.linked_user_id
    FROM public.profiles
    WHERE LOWER(email) = LOWER(NEW.email)
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;


-- ============================================================================
-- FILE: 20260106122428_comprehension_items.sql
-- ============================================================================

-- Comprehension items table
CREATE TABLE IF NOT EXISTS public.comprehension_items (
  id TEXT PRIMARY KEY, -- e.g., "lc_fr_a1_0001"
  language TEXT NOT NULL DEFAULT 'fr-FR',
  cefr_level TEXT NOT NULL CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  transcript_fr TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  estimated_duration_s NUMERIC NOT NULL,
  prompt_fr TEXT NOT NULL,
  prompt_en TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of {id, fr, en}
  answer_key JSONB NOT NULL, -- {correct_option_ids: string[]}
  audio_url TEXT, -- Public URL to WAV file in storage
  audio_storage_path TEXT, -- Storage path for the audio file
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for filtering by audio availability
CREATE INDEX IF NOT EXISTS idx_comprehension_items_has_audio 
ON public.comprehension_items(audio_url) 
WHERE audio_url IS NOT NULL;

-- Index for CEFR level filtering
CREATE INDEX IF NOT EXISTS idx_comprehension_items_cefr 
ON public.comprehension_items(cefr_level);

-- Enable RLS
ALTER TABLE public.comprehension_items ENABLE ROW LEVEL SECURITY;

-- Public read access (items are not user-specific)
CREATE POLICY "Anyone can read comprehension items" 
ON public.comprehension_items 
FOR SELECT 
USING (true);


-- ============================================================================
-- FILE: 20260106122429_seed_comprehension_items.sql
-- ============================================================================

-- Seed comprehension items from TypeScript file
INSERT INTO public.comprehension_items (
  id, language, cefr_level, transcript_fr, word_count, estimated_duration_s,
  prompt_fr, prompt_en, options, answer_key
) VALUES
(
  'lc_fr_a1_0001',
  'fr-FR',
  'A1',
  'Il pleut fort. Marie cherche vite son parapluie, mais il est dans la voiture.',
  14,
  5.6,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Il pleut fort.", "en": "It is raining hard."},
    {"id": "o2", "fr": "Marie cherche son parapluie.", "en": "Marie is looking for her umbrella."},
    {"id": "o3", "fr": "Le parapluie est dans la voiture.", "en": "The umbrella is in the car."},
    {"id": "o4", "fr": "Marie a oubliÃ© son parapluie au travail.", "en": "Marie forgot her umbrella at work."},
    {"id": "o5", "fr": "Marie cherche ses clÃ©s.", "en": "Marie is looking for her keys."},
    {"id": "o6", "fr": "Il fait trÃ¨s beau aujourd''hui.", "en": "The weather is very sunny today."},
    {"id": "o7", "fr": "Le parapluie est cassÃ©.", "en": "The umbrella is broken."},
    {"id": "o8", "fr": "Marie va Ã  la plage.", "en": "Marie is going to the beach."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3"]}'::jsonb
),
(
  'lc_fr_a1_0002',
  'fr-FR',
  'A1',
  'Au cafÃ©, Paul commande un thÃ© sans sucre, attend deux minutes, puis demande l''addition et son ticket avant de partir.',
  20,
  8.0,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Paul commande un thÃ© sans sucre.", "en": "Paul orders a tea with no sugar."},
    {"id": "o2", "fr": "Il attend deux minutes.", "en": "He waits two minutes."},
    {"id": "o3", "fr": "Il demande l''addition et le ticket.", "en": "He asks for the bill and the receipt."},
    {"id": "o4", "fr": "Paul commande un cafÃ© au lait.", "en": "Paul orders a coffee with milk."},
    {"id": "o5", "fr": "Il demande la carte des desserts.", "en": "He asks for the dessert menu."},
    {"id": "o6", "fr": "Il reste au cafÃ© pendant une heure.", "en": "He stays at the cafe for an hour."},
    {"id": "o7", "fr": "Il part sans payer.", "en": "He leaves without paying."},
    {"id": "o8", "fr": "Il demande seulement un verre d''eau.", "en": "He only asks for a glass of water."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3"]}'::jsonb
),
(
  'lc_fr_a2_0003',
  'fr-FR',
  'A2',
  'Dans le bus, quelqu''un a oubliÃ© un sac bleu sous un siÃ¨ge. Le chauffeur l''annonce au micro, le met devant lui, et dit de le rÃ©cupÃ©rer au terminus.',
  28,
  11.2,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Quelqu''un a oubliÃ© un sac bleu.", "en": "Someone forgot a blue bag."},
    {"id": "o2", "fr": "Le chauffeur l''annonce au micro.", "en": "The driver announces it over the speaker."},
    {"id": "o3", "fr": "Le chauffeur garde le sac devant lui.", "en": "The driver keeps the bag at the front."},
    {"id": "o4", "fr": "On peut rÃ©cupÃ©rer le sac au terminus.", "en": "You can pick up the bag at the end of the line."},
    {"id": "o5", "fr": "Le sac est rouge.", "en": "The bag is red."},
    {"id": "o6", "fr": "Le chauffeur jette le sac.", "en": "The driver throws the bag away."},
    {"id": "o7", "fr": "Il faut aller au commissariat pour le rÃ©cupÃ©rer.", "en": "You must go to the police station to retrieve it."},
    {"id": "o8", "fr": "Le bus s''arrÃªte tout de suite pour chercher le propriÃ©taire.", "en": "The bus stops immediately to find the owner."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_a2_0004',
  'fr-FR',
  'A2',
  'On se retrouve Ã  la station RÃ©publique Ã  18 h, prÃ¨s de la sortie 3. DÃ©solÃ©, mon bus est bloquÃ© dans les embouteillages, je serai dix minutes en retard. Ne pars pas.',
  32,
  12.8,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Le rendez-vous est Ã  la station RÃ©publique.", "en": "The meeting point is RÃ©publique station."},
    {"id": "o2", "fr": "Le rendez-vous est Ã  18 h.", "en": "The meeting is at 6 pm."},
    {"id": "o3", "fr": "La personne aura environ dix minutes de retard.", "en": "The person will be about ten minutes late."},
    {"id": "o4", "fr": "Son bus est bloquÃ© dans les embouteillages.", "en": "Their bus is stuck in traffic."},
    {"id": "o5", "fr": "Le rendez-vous est Ã  8 h.", "en": "The meeting is at 8 am."},
    {"id": "o6", "fr": "Ils se retrouvent Ã  la station Bastille.", "en": "They are meeting at Bastille station."},
    {"id": "o7", "fr": "La personne est dÃ©jÃ  arrivÃ©e.", "en": "The person has already arrived."},
    {"id": "o8", "fr": "On lui dit de ne pas attendre.", "en": "They tell the other person not to wait."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_a2_0005',
  'fr-FR',
  'A2',
  'Une voisine crie dans la rue : son chat est coincÃ© dans un arbre depuis une heure. Elle veut appeler les pompiers, mais elle ne connaÃ®t pas le numÃ©ro et son tÃ©lÃ©phone est presque dÃ©chargÃ©. Elle demande Ã  un passant de l''aider.',
  42,
  16.8,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Un chat est coincÃ© dans un arbre.", "en": "A cat is stuck in a tree."},
    {"id": "o2", "fr": "Elle veut appeler les pompiers.", "en": "She wants to call the fire department."},
    {"id": "o3", "fr": "Elle ne connaÃ®t pas le numÃ©ro Ã  appeler.", "en": "She doesn''t know the number to call."},
    {"id": "o4", "fr": "Son tÃ©lÃ©phone est presque dÃ©chargÃ©.", "en": "Her phone is almost out of battery."},
    {"id": "o5", "fr": "Un chien est coincÃ© dans un arbre.", "en": "A dog is stuck in a tree."},
    {"id": "o6", "fr": "Les pompiers sont dÃ©jÃ  en route.", "en": "The fire department is already on the way."},
    {"id": "o7", "fr": "Elle veut appeler la police pour un vol.", "en": "She wants to call the police about a theft."},
    {"id": "o8", "fr": "Elle cherche un taxi.", "en": "She is looking for a taxi."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_a2_0006',
  'fr-FR',
  'A2',
  'On dÃ©cale la rÃ©union de cet aprÃ¨s-midi Ã  demain matin, Ã  9 h, parce que le client est malade. J''envoie tout de suite un e-mail avec la nouvelle heure et le lien visio. Garde ton aprÃ¨s-midi libre.',
  37,
  14.8,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "La rÃ©union est dÃ©placÃ©e Ã  demain matin, Ã  9 h.", "en": "The meeting is moved to tomorrow morning at 9."},
    {"id": "o2", "fr": "Le client est malade.", "en": "The client is sick."},
    {"id": "o3", "fr": "Un e-mail va confirmer la nouvelle heure.", "en": "An email will confirm the new time."},
    {"id": "o4", "fr": "Le lien visio est envoyÃ© par e-mail.", "en": "The video-call link is sent by email."},
    {"id": "o5", "fr": "La rÃ©union reste cet aprÃ¨s-midi.", "en": "The meeting stays this afternoon."},
    {"id": "o6", "fr": "La rÃ©union est annulÃ©e dÃ©finitivement.", "en": "The meeting is canceled forever."},
    {"id": "o7", "fr": "Le client est en vacances.", "en": "The client is on vacation."},
    {"id": "o8", "fr": "La rÃ©union est dÃ©placÃ©e Ã  ce soir.", "en": "The meeting is moved to tonight."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_b1_0007',
  'fr-FR',
  'B1',
  'Annonce en gare : le train pour Lyon de 17 h 12 est annulÃ© Ã  cause d''un problÃ¨me technique. Un bus de remplacement part du quai 5 dans vingt minutes. Pour un remboursement, allez au guichet avec votre billet. Les autres trains restent Ã  l''heure.',
  45,
  18.0,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Le train pour Lyon de 17 h 12 est annulÃ©.", "en": "The 5:12 pm train to Lyon is canceled."},
    {"id": "o2", "fr": "C''est Ã  cause d''un problÃ¨me technique.", "en": "It is due to a technical problem."},
    {"id": "o3", "fr": "Un bus de remplacement part du quai 5.", "en": "A replacement bus leaves from platform 5."},
    {"id": "o4", "fr": "On peut demander un remboursement au guichet.", "en": "You can request a refund at the ticket office."},
    {"id": "o5", "fr": "Le train a seulement dix minutes de retard.", "en": "The train is only ten minutes late."},
    {"id": "o6", "fr": "Le bus part du quai 2.", "en": "The bus leaves from platform 2."},
    {"id": "o7", "fr": "Le remboursement se fait uniquement en ligne.", "en": "Refunds are online only."},
    {"id": "o8", "fr": "Tous les trains sont annulÃ©s aujourd''hui.", "en": "All trains are canceled today."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_b1_0008',
  'fr-FR',
  'B1',
  'Dans la colocation, ils se disputent la facture d''Ã©lectricitÃ© : l''un dit qu''il ne cuisine jamais, l''autre laisse la lumiÃ¨re allumÃ©e. AprÃ¨s quelques minutes, ils se calment et dÃ©cident de suivre leur consommation avec une appli pendant un mois, Ã  partir d''aujourd''hui, puis de partager la facture selon l''usage rÃ©el.',
  50,
  20.0,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Ils se disputent la facture d''Ã©lectricitÃ©.", "en": "They argue about the electricity bill."},
    {"id": "o2", "fr": "Ils dÃ©cident de suivre leur consommation avec une appli.", "en": "They decide to track their usage with an app."},
    {"id": "o3", "fr": "Ils le font pendant un mois.", "en": "They do it for one month."},
    {"id": "o4", "fr": "Ils partageront la facture selon l''usage rÃ©el.", "en": "They will split the bill based on actual usage."},
    {"id": "o5", "fr": "Ils se disputent la facture d''eau.", "en": "They argue about the water bill."},
    {"id": "o6", "fr": "Ils dÃ©cident de ne plus payer la facture.", "en": "They decide to stop paying the bill."},
    {"id": "o7", "fr": "Ils partagent forcÃ©ment 50/50.", "en": "They will definitely split it 50/50."},
    {"id": "o8", "fr": "Ils achÃ¨tent un nouveau frigo.", "en": "They buy a new fridge."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_a2_0009',
  'fr-FR',
  'A2',
  'Au restaurant, elle prÃ©cise qu''elle est allergique aux noix. Le serveur part vÃ©rifier en cuisine si la sauce contient des amandes. Il revient : il y en a. Elle change de plat et prend une salade sans sauce.',
  38,
  15.2,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Elle est allergique aux noix.", "en": "She is allergic to nuts."},
    {"id": "o2", "fr": "Le serveur vÃ©rifie la sauce en cuisine.", "en": "The waiter checks the sauce in the kitchen."},
    {"id": "o3", "fr": "La sauce contient des amandes.", "en": "The sauce contains almonds."},
    {"id": "o4", "fr": "Elle choisit une salade sans sauce.", "en": "She chooses a salad with no sauce."},
    {"id": "o5", "fr": "Elle est allergique au gluten.", "en": "She is allergic to gluten."},
    {"id": "o6", "fr": "La sauce ne contient aucune amande.", "en": "The sauce contains no almonds."},
    {"id": "o7", "fr": "Elle garde le mÃªme plat.", "en": "She keeps the same dish."},
    {"id": "o8", "fr": "Elle commande un dessert aux noix.", "en": "She orders a dessert with nuts."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_b1_0010',
  'fr-FR',
  'B1',
  'Le recruteur propose un entretien lundi Ã  11 h pour un poste de chef de projet. Le candidat demande si c''est 100 % Ã  distance ; on lui rÃ©pond : hybride, trois jours au bureau. Il demande la fourchette de salaire. Ils fixent un second appel mercredi avec la RH.',
  50,
  20.0,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Un entretien est proposÃ© lundi Ã  11 h.", "en": "An interview is proposed for Monday at 11."},
    {"id": "o2", "fr": "On lui rÃ©pond : hybride, trois jours au bureau.", "en": "They answer: hybrid, three days in the office."},
    {"id": "o3", "fr": "Le candidat demande la fourchette de salaire.", "en": "The candidate asks for the salary range."},
    {"id": "o4", "fr": "Ils fixent un second appel mercredi avec la RH.", "en": "They schedule a second call on Wednesday with HR."},
    {"id": "o5", "fr": "On lui rÃ©pond : c''est totalement Ã  distance.", "en": "They answer: it is fully remote."},
    {"id": "o6", "fr": "L''entretien est prÃ©vu dimanche matin.", "en": "The interview is set for Sunday morning."},
    {"id": "o7", "fr": "Ils discutent d''un poste de serveur au restaurant.", "en": "They discuss a waiter job at a restaurant."},
    {"id": "o8", "fr": "Le recruteur annule et ne rappelle pas.", "en": "The recruiter cancels and never calls back."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_b2_0011',
  'fr-FR',
  'B2',
  'Au magasin, LÃ©a revient avec un casque audio qui grÃ©sille. Elle veut Ãªtre remboursÃ©e, mais elle a perdu le ticket de caisse. Le vendeur propose un Ã©change ou un avoir. Elle insiste pour un remboursement sur sa carte, alors il appelle la responsable.',
  43,
  17.2,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Le casque audio grÃ©sille.", "en": "The headphones crackle."},
    {"id": "o2", "fr": "LÃ©a a perdu le ticket de caisse.", "en": "LÃ©a lost the receipt."},
    {"id": "o3", "fr": "Le vendeur propose un Ã©change ou un avoir.", "en": "The seller offers an exchange or store credit."},
    {"id": "o4", "fr": "Le vendeur appelle la responsable.", "en": "The seller calls the manager."},
    {"id": "o5", "fr": "LÃ©a a le ticket de caisse.", "en": "LÃ©a has the receipt."},
    {"id": "o6", "fr": "Le casque fonctionne parfaitement.", "en": "The headphones work perfectly."},
    {"id": "o7", "fr": "Le vendeur lui rend l''argent tout de suite, sans question.", "en": "The seller refunds her immediately, no questions asked."},
    {"id": "o8", "fr": "Elle vient juste comparer des prix.", "en": "She only came to compare prices."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_b2_0012',
  'fr-FR',
  'B2',
  'Lors d''une rÃ©union de quartier, on propose de fermer la rue aux voitures le week-end. Certains commerÃ§ants sont pour, d''autres craignent de perdre des clients. La mairie propose un essai d''un mois et un vote ensuite. Un habitant rappelle qu''il faut garder un accÃ¨s pour les ambulances.',
  47,
  18.8,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "On propose de fermer la rue aux voitures le week-end.", "en": "They propose closing the street to cars on weekends."},
    {"id": "o2", "fr": "Certains commerÃ§ants sont pour, d''autres sont inquiets.", "en": "Some shop owners support it; others are worried."},
    {"id": "o3", "fr": "La mairie propose un essai d''un mois, puis un vote.", "en": "City hall proposes a one-month trial, then a vote."},
    {"id": "o4", "fr": "Il faut garder un accÃ¨s pour les ambulances.", "en": "They must keep access for ambulances."},
    {"id": "o5", "fr": "La rue sera fermÃ©e tous les jours, toute l''annÃ©e.", "en": "The street will be closed every day all year."},
    {"id": "o6", "fr": "Tout le monde est d''accord immÃ©diatement.", "en": "Everyone agrees immediately."},
    {"id": "o7", "fr": "La mairie abandonne l''idÃ©e dÃ¨s maintenant.", "en": "City hall drops the idea right away."},
    {"id": "o8", "fr": "On veut empÃªcher les ambulances de passer.", "en": "They want to block ambulances from passing."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  transcript_fr = EXCLUDED.transcript_fr,
  word_count = EXCLUDED.word_count,
  estimated_duration_s = EXCLUDED.estimated_duration_s,
  prompt_fr = EXCLUDED.prompt_fr,
  prompt_en = EXCLUDED.prompt_en,
  options = EXCLUDED.options,
  answer_key = EXCLUDED.answer_key,
  updated_at = now();


-- ============================================================================
-- FILE: 20260106062554_c347c1f9-ce59-4c85-8c99-4283c038d912.sql
-- ============================================================================

-- Allow public/anonymous uploads for comprehension-audio bucket (for script use)
CREATE POLICY "Allow uploads to comprehension-audio"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'comprehension-audio');


-- ============================================================================
-- FILE: 20260106122428_comprehension_items.sql
-- ============================================================================

-- Comprehension items table
CREATE TABLE IF NOT EXISTS public.comprehension_items (
  id TEXT PRIMARY KEY, -- e.g., "lc_fr_a1_0001"
  language TEXT NOT NULL DEFAULT 'fr-FR',
  cefr_level TEXT NOT NULL CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  transcript_fr TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  estimated_duration_s NUMERIC NOT NULL,
  prompt_fr TEXT NOT NULL,
  prompt_en TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of {id, fr, en}
  answer_key JSONB NOT NULL, -- {correct_option_ids: string[]}
  audio_url TEXT, -- Public URL to WAV file in storage
  audio_storage_path TEXT, -- Storage path for the audio file
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for filtering by audio availability
CREATE INDEX IF NOT EXISTS idx_comprehension_items_has_audio 
ON public.comprehension_items(audio_url) 
WHERE audio_url IS NOT NULL;

-- Index for CEFR level filtering
CREATE INDEX IF NOT EXISTS idx_comprehension_items_cefr 
ON public.comprehension_items(cefr_level);

-- Enable RLS
ALTER TABLE public.comprehension_items ENABLE ROW LEVEL SECURITY;

-- Public read access (items are not user-specific)
CREATE POLICY "Anyone can read comprehension items" 
ON public.comprehension_items 
FOR SELECT 
USING (true);


-- ============================================================================
-- FILE: 20260106122429_seed_comprehension_items.sql
-- ============================================================================

-- Seed comprehension items from TypeScript file
INSERT INTO public.comprehension_items (
  id, language, cefr_level, transcript_fr, word_count, estimated_duration_s,
  prompt_fr, prompt_en, options, answer_key
) VALUES
(
  'lc_fr_a1_0001',
  'fr-FR',
  'A1',
  'Il pleut fort. Marie cherche vite son parapluie, mais il est dans la voiture.',
  14,
  5.6,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Il pleut fort.", "en": "It is raining hard."},
    {"id": "o2", "fr": "Marie cherche son parapluie.", "en": "Marie is looking for her umbrella."},
    {"id": "o3", "fr": "Le parapluie est dans la voiture.", "en": "The umbrella is in the car."},
    {"id": "o4", "fr": "Marie a oubliÃ© son parapluie au travail.", "en": "Marie forgot her umbrella at work."},
    {"id": "o5", "fr": "Marie cherche ses clÃ©s.", "en": "Marie is looking for her keys."},
    {"id": "o6", "fr": "Il fait trÃ¨s beau aujourd''hui.", "en": "The weather is very sunny today."},
    {"id": "o7", "fr": "Le parapluie est cassÃ©.", "en": "The umbrella is broken."},
    {"id": "o8", "fr": "Marie va Ã  la plage.", "en": "Marie is going to the beach."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3"]}'::jsonb
),
(
  'lc_fr_a1_0002',
  'fr-FR',
  'A1',
  'Au cafÃ©, Paul commande un thÃ© sans sucre, attend deux minutes, puis demande l''addition et son ticket avant de partir.',
  20,
  8.0,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Paul commande un thÃ© sans sucre.", "en": "Paul orders a tea with no sugar."},
    {"id": "o2", "fr": "Il attend deux minutes.", "en": "He waits two minutes."},
    {"id": "o3", "fr": "Il demande l''addition et le ticket.", "en": "He asks for the bill and the receipt."},
    {"id": "o4", "fr": "Paul commande un cafÃ© au lait.", "en": "Paul orders a coffee with milk."},
    {"id": "o5", "fr": "Il demande la carte des desserts.", "en": "He asks for the dessert menu."},
    {"id": "o6", "fr": "Il reste au cafÃ© pendant une heure.", "en": "He stays at the cafe for an hour."},
    {"id": "o7", "fr": "Il part sans payer.", "en": "He leaves without paying."},
    {"id": "o8", "fr": "Il demande seulement un verre d''eau.", "en": "He only asks for a glass of water."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3"]}'::jsonb
),
(
  'lc_fr_a2_0003',
  'fr-FR',
  'A2',
  'Dans le bus, quelqu''un a oubliÃ© un sac bleu sous un siÃ¨ge. Le chauffeur l''annonce au micro, le met devant lui, et dit de le rÃ©cupÃ©rer au terminus.',
  28,
  11.2,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Quelqu''un a oubliÃ© un sac bleu.", "en": "Someone forgot a blue bag."},
    {"id": "o2", "fr": "Le chauffeur l''annonce au micro.", "en": "The driver announces it over the speaker."},
    {"id": "o3", "fr": "Le chauffeur garde le sac devant lui.", "en": "The driver keeps the bag at the front."},
    {"id": "o4", "fr": "On peut rÃ©cupÃ©rer le sac au terminus.", "en": "You can pick up the bag at the end of the line."},
    {"id": "o5", "fr": "Le sac est rouge.", "en": "The bag is red."},
    {"id": "o6", "fr": "Le chauffeur jette le sac.", "en": "The driver throws the bag away."},
    {"id": "o7", "fr": "Il faut aller au commissariat pour le rÃ©cupÃ©rer.", "en": "You must go to the police station to retrieve it."},
    {"id": "o8", "fr": "Le bus s''arrÃªte tout de suite pour chercher le propriÃ©taire.", "en": "The bus stops immediately to find the owner."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_a2_0004',
  'fr-FR',
  'A2',
  'On se retrouve Ã  la station RÃ©publique Ã  18 h, prÃ¨s de la sortie 3. DÃ©solÃ©, mon bus est bloquÃ© dans les embouteillages, je serai dix minutes en retard. Ne pars pas.',
  32,
  12.8,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Le rendez-vous est Ã  la station RÃ©publique.", "en": "The meeting point is RÃ©publique station."},
    {"id": "o2", "fr": "Le rendez-vous est Ã  18 h.", "en": "The meeting is at 6 pm."},
    {"id": "o3", "fr": "La personne aura environ dix minutes de retard.", "en": "The person will be about ten minutes late."},
    {"id": "o4", "fr": "Son bus est bloquÃ© dans les embouteillages.", "en": "Their bus is stuck in traffic."},
    {"id": "o5", "fr": "Le rendez-vous est Ã  8 h.", "en": "The meeting is at 8 am."},
    {"id": "o6", "fr": "Ils se retrouvent Ã  la station Bastille.", "en": "They are meeting at Bastille station."},
    {"id": "o7", "fr": "La personne est dÃ©jÃ  arrivÃ©e.", "en": "The person has already arrived."},
    {"id": "o8", "fr": "On lui dit de ne pas attendre.", "en": "They tell the other person not to wait."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_a2_0005',
  'fr-FR',
  'A2',
  'Une voisine crie dans la rue : son chat est coincÃ© dans un arbre depuis une heure. Elle veut appeler les pompiers, mais elle ne connaÃ®t pas le numÃ©ro et son tÃ©lÃ©phone est presque dÃ©chargÃ©. Elle demande Ã  un passant de l''aider.',
  42,
  16.8,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Un chat est coincÃ© dans un arbre.", "en": "A cat is stuck in a tree."},
    {"id": "o2", "fr": "Elle veut appeler les pompiers.", "en": "She wants to call the fire department."},
    {"id": "o3", "fr": "Elle ne connaÃ®t pas le numÃ©ro Ã  appeler.", "en": "She doesn''t know the number to call."},
    {"id": "o4", "fr": "Son tÃ©lÃ©phone est presque dÃ©chargÃ©.", "en": "Her phone is almost out of battery."},
    {"id": "o5", "fr": "Un chien est coincÃ© dans un arbre.", "en": "A dog is stuck in a tree."},
    {"id": "o6", "fr": "Les pompiers sont dÃ©jÃ  en route.", "en": "The fire department is already on the way."},
    {"id": "o7", "fr": "Elle veut appeler la police pour un vol.", "en": "She wants to call the police about a theft."},
    {"id": "o8", "fr": "Elle cherche un taxi.", "en": "She is looking for a taxi."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_a2_0006',
  'fr-FR',
  'A2',
  'On dÃ©cale la rÃ©union de cet aprÃ¨s-midi Ã  demain matin, Ã  9 h, parce que le client est malade. J''envoie tout de suite un e-mail avec la nouvelle heure et le lien visio. Garde ton aprÃ¨s-midi libre.',
  37,
  14.8,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "La rÃ©union est dÃ©placÃ©e Ã  demain matin, Ã  9 h.", "en": "The meeting is moved to tomorrow morning at 9."},
    {"id": "o2", "fr": "Le client est malade.", "en": "The client is sick."},
    {"id": "o3", "fr": "Un e-mail va confirmer la nouvelle heure.", "en": "An email will confirm the new time."},
    {"id": "o4", "fr": "Le lien visio est envoyÃ© par e-mail.", "en": "The video-call link is sent by email."},
    {"id": "o5", "fr": "La rÃ©union reste cet aprÃ¨s-midi.", "en": "The meeting stays this afternoon."},
    {"id": "o6", "fr": "La rÃ©union est annulÃ©e dÃ©finitivement.", "en": "The meeting is canceled forever."},
    {"id": "o7", "fr": "Le client est en vacances.", "en": "The client is on vacation."},
    {"id": "o8", "fr": "La rÃéunion est dÃ©placÃ©e Ã  ce soir.", "en": "The meeting is moved to tonight."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_b1_0007',
  'fr-FR',
  'B1',
  'Annonce en gare : le train pour Lyon de 17 h 12 est annulÃ© Ã  cause d''un problÃ¨me technique. Un bus de remplacement part du quai 5 dans vingt minutes. Pour un remboursement, allez au guichet avec votre billet. Les autres trains restent Ã  l''heure.',
  45,
  18.0,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Le train pour Lyon de 17 h 12 est annulÃ©.", "en": "The 5:12 pm train to Lyon is canceled."},
    {"id": "o2", "fr": "C''est Ã  cause d''un problÃ¨me technique.", "en": "It is due to a technical problem."},
    {"id": "o3", "fr": "Un bus de remplacement part du quai 5.", "en": "A replacement bus leaves from platform 5."},
    {"id": "o4", "fr": "On peut demander un remboursement au guichet.", "en": "You can request a refund at the ticket office."},
    {"id": "o5", "fr": "Le train a seulement dix minutes de retard.", "en": "The train is only ten minutes late."},
    {"id": "o6", "fr": "Le bus part du quai 2.", "en": "The bus leaves from platform 2."},
    {"id": "o7", "fr": "Le remboursement se fait uniquement en ligne.", "en": "Refunds are online only."},
    {"id": "o8", "fr": "Tous les trains sont annulÃ©s aujourd''hui.", "en": "All trains are canceled today."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_b1_0008',
  'fr-FR',
  'B1',
  'Dans la colocation, ils se disputent la facture d''Ã©lectricitÃ© : l''un dit qu''il ne cuisine jamais, l''autre laisse la lumiÃ¨re allumÃ©e. AprÃ¨s quelques minutes, ils se calment et dÃ©cident de suivre leur consommation avec une appli pendant un mois, Ã  partir d''aujourd''hui, puis de partager la facture selon l''usage rÃ©el.',
  50,
  20.0,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Ils se disputent la facture d''Ã©lectricitÃ©.", "en": "They argue about the electricity bill."},
    {"id": "o2", "fr": "Ils dÃ©cident de suivre leur consommation avec une appli.", "en": "They decide to track their usage with an app."},
    {"id": "o3", "fr": "Ils le font pendant un mois.", "en": "They do it for one month."},
    {"id": "o4", "fr": "Ils partageront la facture selon l''usage rÃ©el.", "en": "They will split the bill based on actual usage."},
    {"id": "o5", "fr": "Ils se disputent la facture d''eau.", "en": "They argue about the water bill."},
    {"id": "o6", "fr": "Ils dÃ©cident de ne plus payer la facture.", "en": "They decide to stop paying the bill."},
    {"id": "o7", "fr": "Ils partagent forcÃ©ment 50/50.", "en": "They will definitely split it 50/50."},
    {"id": "o8", "fr": "Ils achÃ¨tent un nouveau frigo.", "en": "They buy a new fridge."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_a2_0009',
  'fr-FR',
  'A2',
  'Au restaurant, elle prÃ©cise qu''elle est allergique aux noix. Le serveur part vÃ©rifier en cuisine si la sauce contient des amandes. Il revient : il y en a. Elle change de plat et prend une salade sans sauce.',
  38,
  15.2,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Elle est allergique aux noix.", "en": "She is allergic to nuts."},
    {"id": "o2", "fr": "Le serveur vÃ©rifie la sauce en cuisine.", "en": "The waiter checks the sauce in the kitchen."},
    {"id": "o3", "fr": "La sauce contient des amandes.", "en": "The sauce contains almonds."},
    {"id": "o4", "fr": "Elle choisit une salade sans sauce.", "en": "She chooses a salad with no sauce."},
    {"id": "o5", "fr": "Elle est allergique au gluten.", "en": "She is allergic to gluten."},
    {"id": "o6", "fr": "La sauce ne contient aucune amande.", "en": "The sauce contains no almonds."},
    {"id": "o7", "fr": "Elle garde le mÃªme plat.", "en": "She keeps the same dish."},
    {"id": "o8", "fr": "Elle commande un dessert aux noix.", "en": "She orders a dessert with nuts."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_b1_0010',
  'fr-FR',
  'B1',
  'Le recruteur propose un entretien lundi Ã  11 h pour un poste de chef de projet. Le candidat demande si c''est 100 % Ã  distance ; on lui rÃ©pond : hybride, trois jours au bureau. Il demande la fourchette de salaire. Ils fixent un second appel mercredi avec la RH.',
  50,
  20.0,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Un entretien est proposÃ© lundi Ã  11 h.", "en": "An interview is proposed for Monday at 11."},
    {"id": "o2", "fr": "On lui rÃ©pond : hybride, trois jours au bureau.", "en": "They answer: hybrid, three days in the office."},
    {"id": "o3", "fr": "Le candidat demande la fourchette de salaire.", "en": "The candidate asks for the salary range."},
    {"id": "o4", "fr": "Ils fixent un second appel mercredi avec la RH.", "en": "They schedule a second call on Wednesday with HR."},
    {"id": "o5", "fr": "On lui rÃ©pond : c''est totalement Ã  distance.", "en": "They answer: it is fully remote."},
    {"id": "o6", "fr": "L''entretien est prÃ©vu dimanche matin.", "en": "The interview is set for Sunday morning."},
    {"id": "o7", "fr": "Ils discutent d''un poste de serveur au restaurant.", "en": "They discuss a waiter job at a restaurant."},
    {"id": "o8", "fr": "Le recruteur annule et ne rappelle pas.", "en": "The recruiter cancels and never calls back."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_b2_0011',
  'fr-FR',
  'B2',
  'Au magasin, LÃ©a revient avec un casque audio qui grÃ©sille. Elle veut Ãªtre remboursÃ©e, mais elle a perdu le ticket de caisse. Le vendeur propose un Ã©change ou un avoir. Elle insiste pour un remboursement sur sa carte, alors il appelle la responsable.',
  43,
  17.2,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Le casque audio grÃ©sille.", "en": "The headphones crackle."},
    {"id": "o2", "fr": "LÃ©a a perdu le ticket de caisse.", "en": "LÃ©a lost the receipt."},
    {"id": "o3", "fr": "Le vendeur propose un Ã©change ou un avoir.", "en": "The seller offers an exchange or store credit."},
    {"id": "o4", "fr": "Le vendeur appelle la responsable.", "en": "The seller calls the manager."},
    {"id": "o5", "fr": "LÃ©a a le ticket de caisse.", "en": "LÃ©a has the receipt."},
    {"id": "o6", "fr": "Le casque fonctionne parfaitement.", "en": "The headphones work perfectly."},
    {"id": "o7", "fr": "Le vendeur lui rend l''argent tout de suite, sans question.", "en": "The seller refunds her immediately, no questions asked."},
    {"id": "o8", "fr": "Elle vient juste comparer des prix.", "en": "She only came to compare prices."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_b2_0012',
  'fr-FR',
  'B2',
  'Lors d''une rÃ©union de quartier, on propose de fermer la rue aux voitures le week-end. Certains commerÃ§ants sont pour, d''autres craignent de perdre des clients. La mairie propose un essai d''un mois et un vote ensuite. Un habitant rappelle qu''il faut garder un accÃ¨s pour les ambulances.',
  47,
  18.8,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "On propose de fermer la rue aux voitures le week-end.", "en": "They propose closing the street to cars on weekends."},
    {"id": "o2", "fr": "Certains commerÃ§ants sont pour, d''autres sont inquiets.", "en": "Some shop owners support it; others are worried."},
    {"id": "o3", "fr": "La mairie propose un essai d''un mois, puis un vote.", "en": "City hall proposes a one-month trial, then a vote."},
    {"id": "o4", "fr": "Il faut garder un accÃ¨s pour les ambulances.", "en": "They must keep access for ambulances."},
    {"id": "o5", "fr": "La rue sera fermÃ©e tous les jours, toute l''annÃ©e.", "en": "The street will be closed every day all year."},
    {"id": "o6", "fr": "Tout le monde est d''accord immÃ©diatement.", "en": "Everyone agrees immediately."},
    {"id": "o7", "fr": "La mairie abandonne l''idÃ©e dÃ¨s maintenant.", "en": "City hall drops the idea right away."},
    {"id": "o8", "fr": "On veut empÃªcher les ambulances de passer.", "en": "They want to block ambulances from passing."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  transcript_fr = EXCLUDED.transcript_fr,
  word_count = EXCLUDED.word_count,
  estimated_duration_s = EXCLUDED.estimated_duration_s,
  prompt_fr = EXCLUDED.prompt_fr,
  prompt_en = EXCLUDED.prompt_en,
  options = EXCLUDED.options,
  answer_key = EXCLUDED.answer_key,
  updated_at = now();


-- ============================================================================
-- FILE: 20260106062554_c347c1f9-ce59-4c85-8c99-4283c038d912.sql
-- ============================================================================

-- Allow public/anonymous uploads for comprehension-audio bucket (for script use)
CREATE POLICY "Allow uploads to comprehension-audio"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'comprehension-audio');


-- ============================================================================
-- FILE: 20260106122428_comprehension_items.sql
-- ============================================================================

-- Comprehension items table
CREATE TABLE IF NOT EXISTS public.comprehension_items (
  id TEXT PRIMARY KEY, -- e.g., "lc_fr_a1_0001"
  language TEXT NOT NULL DEFAULT 'fr-FR',
  cefr_level TEXT NOT NULL CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  transcript_fr TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  estimated_duration_s NUMERIC NOT NULL,
  prompt_fr TEXT NOT NULL,
  prompt_en TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of {id, fr, en}
  answer_key JSONB NOT NULL, -- {correct_option_ids: string[]}
  audio_url TEXT, -- Public URL to WAV file in storage
  audio_storage_path TEXT, -- Storage path for the audio file
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for filtering by audio availability
CREATE INDEX IF NOT EXISTS idx_comprehension_items_has_audio 
ON public.comprehension_items(audio_url) 
WHERE audio_url IS NOT NULL;

-- Index for CEFR level filtering
CREATE INDEX IF NOT EXISTS idx_comprehension_items_cefr 
ON public.comprehension_items(cefr_level);

-- Enable RLS
ALTER TABLE public.comprehension_items ENABLE ROW LEVEL SECURITY;

-- Public read access (items are not user-specific)
CREATE POLICY "Anyone can read comprehension items" 
ON public.comprehension_items 
FOR SELECT 
USING (true);


-- ============================================================================
-- FILE: 20260106122429_seed_comprehension_items.sql
-- ============================================================================

-- Seed comprehension items from TypeScript file
INSERT INTO public.comprehension_items (
  id, language, cefr_level, transcript_fr, word_count, estimated_duration_s,
  prompt_fr, prompt_en, options, answer_key
) VALUES
(
  'lc_fr_a1_0001',
  'fr-FR',
  'A1',
  'Il pleut fort. Marie cherche vite son parapluie, mais il est dans la voiture.',
  14,
  5.6,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Il pleut fort.", "en": "It is raining hard."},
    {"id": "o2", "fr": "Marie cherche son parapluie.", "en": "Marie is looking for her umbrella."},
    {"id": "o3", "fr": "Le parapluie est dans la voiture.", "en": "The umbrella is in the car."},
    {"id": "o4", "fr": "Marie a oubliÃ© son parapluie au travail.", "en": "Marie forgot her umbrella at work."},
    {"id": "o5", "fr": "Marie cherche ses clÃ©s.", "en": "Marie is looking for her keys."},
    {"id": "o6", "fr": "Il fait trÃ¨s beau aujourd''hui.", "en": "The weather is very sunny today."},
    {"id": "o7", "fr": "Le parapluie est cassÃ©.", "en": "The umbrella is broken."},
    {"id": "o8", "fr": "Marie va Ã  la plage.", "en": "Marie is going to the beach."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3"]}'::jsonb
),
(
  'lc_fr_a1_0002',
  'fr-FR',
  'A1',
  'Au cafÃ©, Paul commande un thÃ© sans sucre, attend deux minutes, puis demande l''addition et son ticket avant de partir.',
  20,
  8.0,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Paul commande un thÃ© sans sucre.", "en": "Paul orders a tea with no sugar."},
    {"id": "o2", "fr": "Il attend deux minutes.", "en": "He waits two minutes."},
    {"id": "o3", "fr": "Il demande l''addition et le ticket.", "en": "He asks for the bill and the receipt."},
    {"id": "o4", "fr": "Paul commande un cafÃ© au lait.", "en": "Paul orders a coffee with milk."},
    {"id": "o5", "fr": "Il demande la carte des desserts.", "en": "He asks for the dessert menu."},
    {"id": "o6", "fr": "Il reste au cafÃ© pendant une heure.", "en": "He stays at the cafe for an hour."},
    {"id": "o7", "fr": "Il part sans payer.", "en": "He leaves without paying."},
    {"id": "o8", "fr": "Il demande seulement un verre d''eau.", "en": "He only asks for a glass of water."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3"]}'::jsonb
),
(
  'lc_fr_a2_0003',
  'fr-FR',
  'A2',
  'Dans le bus, quelqu''un a oubliÃ© un sac bleu sous un siÃ¨ge. Le chauffeur l''annonce au micro, le met devant lui, et dit de le rÃ©cupÃ©rer au terminus.',
  28,
  11.2,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Quelqu''un a oubliÃ© un sac bleu.", "en": "Someone forgot a blue bag."},
    {"id": "o2", "fr": "Le chauffeur l''annonce au micro.", "en": "The driver announces it over the speaker."},
    {"id": "o3", "fr": "Le chauffeur garde le sac devant lui.", "en": "The driver keeps the bag at the front."},
    {"id": "o4", "fr": "On peut rÃ©cupÃ©rer le sac au terminus.", "en": "You can pick up the bag at the end of the line."},
    {"id": "o5", "fr": "Le sac est rouge.", "en": "The bag is red."},
    {"id": "o6", "fr": "Le chauffeur jette le sac.", "en": "The driver throws the bag away."},
    {"id": "o7", "fr": "Il faut aller au commissariat pour le rÃ©cupÃ©rer.", "en": "You must go to the police station to retrieve it."},
    {"id": "o8", "fr": "Le bus s''arrÃªte tout de suite pour chercher le propriÃ©taire.", "en": "The bus stops immediately to find the owner."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_a2_0004',
  'fr-FR',
  'A2',
  'On se retrouve Ã  la station RÃ©publique Ã  18 h, prÃ¨s de la sortie 3. DÃ©solÃ©, mon bus est bloquÃ© dans les embouteillages, je serai dix minutes en retard. Ne pars pas.',
  32,
  12.8,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Le rendez-vous est Ã  la station RÃ©publique.", "en": "The meeting point is RÃ©publique station."},
    {"id": "o2", "fr": "Le rendez-vous est Ã  18 h.", "en": "The meeting is at 6 pm."},
    {"id": "o3", "fr": "La personne aura environ dix minutes de retard.", "en": "The person will be about ten minutes late."},
    {"id": "o4", "fr": "Son bus est bloquÃ© dans les embouteillages.", "en": "Their bus is stuck in traffic."},
    {"id": "o5", "fr": "Le rendez-vous est Ã  8 h.", "en": "The meeting is at 8 am."},
    {"id": "o6", "fr": "Ils se retrouvent Ã  la station Bastille.", "en": "They are meeting at Bastille station."},
    {"id": "o7", "fr": "La personne est dÃ©jÃ  arrivÃ©e.", "en": "The person has already arrived."},
    {"id": "o8", "fr": "On lui dit de ne pas attendre.", "en": "They tell the other person not to wait."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_a2_0005',
  'fr-FR',
  'A2',
  'Une voisine crie dans la rue : son chat est coincÃ© dans un arbre depuis une heure. Elle veut appeler les pompiers, mais elle ne connaÃ®t pas le numÃ©ro et son tÃ©lÃ©phone est presque dÃ©chargÃ©. Elle demande Ã  un passant de l''aider.',
  42,
  16.8,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Un chat est coincÃ© dans un arbre.", "en": "A cat is stuck in a tree."},
    {"id": "o2", "fr": "Elle veut appeler les pompiers.", "en": "She wants to call the fire department."},
    {"id": "o3", "fr": "Elle ne connaÃ®t pas le numÃ©ro Ã  appeler.", "en": "She doesn''t know the number to call."},
    {"id": "o4", "fr": "Son tÃ©lÃ©phone est presque dÃ©chargÃ©.", "en": "Her phone is almost out of battery."},
    {"id": "o5", "fr": "Un chien est coincÃ© dans un arbre.", "en": "A dog is stuck in a tree."},
    {"id": "o6", "fr": "Les pompiers sont dÃ©jÃ  en route.", "en": "The fire department is already on the way."},
    {"id": "o7", "fr": "Elle veut appeler la police pour un vol.", "en": "She wants to call the police about a theft."},
    {"id": "o8", "fr": "Elle cherche un taxi.", "en": "She is looking for a taxi."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_a2_0006',
  'fr-FR',
  'A2',
  'On dÃ©cale la rÃ©union de cet aprÃ¨s-midi Ã  demain matin, Ã  9 h, parce que le client est malade. J''envoie tout de suite un e-mail avec la nouvelle heure et le lien visio. Garde ton aprÃ¨s-midi libre.',
  37,
  14.8,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "La rÃ©union est dÃ©placÃ©e Ã  demain matin, Ã  9 h.", "en": "The meeting is moved to tomorrow morning at 9."},
    {"id": "o2", "fr": "Le client est malade.", "en": "The client is sick."},
    {"id": "o3", "fr": "Un e-mail va confirmer la nouvelle heure.", "en": "An email will confirm the new time."},
    {"id": "o4", "fr": "Le lien visio est envoyÃ© par e-mail.", "en": "The video-call link is sent by email."},
    {"id": "o5", "fr": "La rÃ©union reste cet aprÃ¨s-midi.", "en": "The meeting stays this afternoon."},
    {"id": "o6", "fr": "La rÃ©union est annulÃ©e dÃ©finitivement.", "en": "The meeting is canceled forever."},
    {"id": "o7", "fr": "Le client est en vacances.", "en": "The client is on vacation."},
    {"id": "o8", "fr": "La rÃ©union est dÃ©placÃ©e Ã  ce soir.", "en": "The meeting is moved to tonight."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_b1_0007',
  'fr-FR',
  'B1',
  'Annonce en gare : le train pour Lyon de 17 h 12 est annulÃ© Ã  cause d''un problÃ¨me technique. Un bus de remplacement part du quai 5 dans vingt minutes. Pour un remboursement, allez au guichet avec votre billet. Les autres trains restent Ã  l''heure.',
  45,
  18.0,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Le train pour Lyon de 17 h 12 est annulÃ©.", "en": "The 5:12 pm train to Lyon is canceled."},
    {"id": "o2", "fr": "C''est Ã  cause d''un problÃ¨me technique.", "en": "It is due to a technical problem."},
    {"id": "o3", "fr": "Un bus de remplacement part du quai 5.", "en": "A replacement bus leaves from platform 5."},
    {"id": "o4", "fr": "On peut demander un remboursement au guichet.", "en": "You can request a refund at the ticket office."},
    {"id": "o5", "fr": "Le train a seulement dix minutes de retard.", "en": "The train is only ten minutes late."},
    {"id": "o6", "fr": "Le bus part du quai 2.", "en": "The bus leaves from platform 2."},
    {"id": "o7", "fr": "Le remboursement se fait uniquement en ligne.", "en": "Refunds are online only."},
    {"id": "o8", "fr": "Tous les trains sont annulÃ©s aujourd''hui.", "en": "All trains are canceled today."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_b1_0008',
  'fr-FR',
  'B1',
  'Dans la colocation, ils se disputent la facture d''Ã©lectricitÃ© : l''un dit qu''il ne cuisine jamais, l''autre laisse la lumiÃ¨re allumÃ©e. AprÃ¨s quelques minutes, ils se calment et dÃ©cident de suivre leur consommation avec une appli pendant un mois, Ã  partir d''aujourd''hui, puis de partager la facture selon l''usage rÃ©el.',
  50,
  20.0,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Ils se disputent la facture d''Ã©lectricitÃ©.", "en": "They argue about the electricity bill."},
    {"id": "o2", "fr": "Ils dÃ©cident de suivre leur consommation avec une appli.", "en": "They decide to track their usage with an app."},
    {"id": "o3", "fr": "Ils le font pendant un mois.", "en": "They do it for one month."},
    {"id": "o4", "fr": "Ils partageront la facture selon l''usage rÃ©el.", "en": "They will split the bill based on actual usage."},
    {"id": "o5", "fr": "Ils se disputent la facture d''eau.", "en": "They argue about the water bill."},
    {"id": "o6", "fr": "Ils dÃ©cident de ne plus payer la facture.", "en": "They decide to stop paying the bill."},
    {"id": "o7", "fr": "Ils partagent forcÃ©ment 50/50.", "en": "They will definitely split it 50/50."},
    {"id": "o8", "fr": "Ils achÃ¨tent un nouveau frigo.", "en": "They buy a new fridge."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_a2_0009',
  'fr-FR',
  'A2',
  'Au restaurant, elle prÃ©cise qu''elle est allergique aux noix. Le serveur part vÃ©rifier en cuisine si la sauce contient des amandes. Il revient : il y en a. Elle change de plat et prend une salade sans sauce.',
  38,
  15.2,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Elle est allergique aux noix.", "en": "She is allergic to nuts."},
    {"id": "o2", "fr": "Le serveur vÃ©rifie la sauce en cuisine.", "en": "The waiter checks the sauce in the kitchen."},
    {"id": "o3", "fr": "La sauce contient des amandes.", "en": "The sauce contains almonds."},
    {"id": "o4", "fr": "Elle choisit une salade sans sauce.", "en": "She chooses a salad with no sauce."},
    {"id": "o5", "fr": "Elle est allergique au gluten.", "en": "She is allergic to gluten."},
    {"id": "o6", "fr": "La sauce ne contient aucune amande.", "en": "The sauce contains no almonds."},
    {"id": "o7", "fr": "Elle garde le mÃªme plat.", "en": "She keeps the same dish."},
    {"id": "o8", "fr": "Elle commande un dessert aux noix.", "en": "She orders a dessert with nuts."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_b1_0010',
  'fr-FR',
  'B1',
  'Le recruteur propose un entretien lundi Ã  11 h pour un poste de chef de projet. Le candidat demande si c''est 100 % Ã  distance ; on lui rÃ©pond : hybride, trois jours au bureau. Il demande la fourchette de salaire. Ils fixent un second appel mercredi avec la RH.',
  50,
  20.0,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Un entretien est proposÃ© lundi Ã  11 h.", "en": "An interview is proposed for Monday at 11."},
    {"id": "o2", "fr": "On lui rÃ©pond : hybride, trois jours au bureau.", "en": "They answer: hybrid, three days in the office."},
    {"id": "o3", "fr": "Le candidat demande la fourchette de salaire.", "en": "The candidate asks for the salary range."},
    {"id": "o4", "fr": "Ils fixent un second appel mercredi avec la RH.", "en": "They schedule a second call on Wednesday with HR."},
    {"id": "o5", "fr": "On lui rÃ©pond : c''est totalement Ã  distance.", "en": "They answer: it is fully remote."},
    {"id": "o6", "fr": "L''entretien est prÃ©vu dimanche matin.", "en": "The interview is set for Sunday morning."},
    {"id": "o7", "fr": "Ils discutent d''un poste de serveur au restaurant.", "en": "They discuss a waiter job at a restaurant."},
    {"id": "o8", "fr": "Le recruteur annule et ne rappelle pas.", "en": "The recruiter cancels and never calls back."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_b2_0011',
  'fr-FR',
  'B2',
  'Au magasin, LÃ©a revient avec un casque audio qui grÃ©sille. Elle veut Ãªtre remboursÃ©e, mais elle a perdu le ticket de caisse. Le vendeur propose un Ã©change ou un avoir. Elle insiste pour un remboursement sur sa carte, alors il appelle la responsable.',
  43,
  17.2,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Le casque audio grÃ©sille.", "en": "The headphones crackle."},
    {"id": "o2", "fr": "LÃ©a a perdu le ticket de caisse.", "en": "LÃ©a lost the receipt."},
    {"id": "o3", "fr": "Le vendeur propose un Ã©change ou un avoir.", "en": "The seller offers an exchange or store credit."},
    {"id": "o4", "fr": "Le vendeur appelle la responsable.", "en": "The seller calls the manager."},
    {"id": "o5", "fr": "LÃ©a a le ticket de caisse.", "en": "LÃ©a has the receipt."},
    {"id": "o6", "fr": "Le casque fonctionne parfaitement.", "en": "The headphones work perfectly."},
    {"id": "o7", "fr": "Le vendeur lui rend l''argent tout de suite, sans question.", "en": "The seller refunds her immediately, no questions asked."},
    {"id": "o8", "fr": "Elle vient juste comparer des prix.", "en": "She only came to compare prices."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_b2_0012',
  'fr-FR',
  'B2',
  'Lors d''une rÃ©union de quartier, on propose de fermer la rue aux voitures le week-end. Certains commerÃ§ants sont pour, d''autres craignent de perdre des clients. La mairie propose un essai d''un mois et un vote ensuite. Un habitant rappelle qu''il faut garder un accÃ¨s pour les ambulances.',
  47,
  18.8,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "On propose de fermer la rue aux voitures le week-end.", "en": "They propose closing the street to cars on weekends."},
    {"id": "o2", "fr": "Certains commerÃ§ants sont pour, d''autres sont inquiets.", "en": "Some shop owners support it; others are worried."},
    {"id": "o3", "fr": "La mairie propose un essai d''un mois, puis un vote.", "en": "City hall proposes a one-month trial, then a vote."},
    {"id": "o4", "fr": "Il faut garder un accÃ¨s pour les ambulances.", "en": "They must keep access for ambulances."},
    {"id": "o5", "fr": "La rue sera fermÃ©e tous les jours, toute l''annÃ©e.", "en": "The street will be closed every day all year."},
    {"id": "o6", "fr": "Tout le monde est d''accord immÃ©diatement.", "en": "Everyone agrees immediately."},
    {"id": "o7", "fr": "La mairie abandonne l''idÃ©e dÃ¨s maintenant.", "en": "City hall drops the idea right away."},
    {"id": "o8", "fr": "On veut empÃªcher les ambulances de passer.", "en": "They want to block ambulances from passing."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  transcript_fr = EXCLUDED.transcript_fr,
  word_count = EXCLUDED.word_count,
  estimated_duration_s = EXCLUDED.estimated_duration_s,
  prompt_fr = EXCLUDED.prompt_fr,
  prompt_en = EXCLUDED.prompt_en,
  options = EXCLUDED.options,
  answer_key = EXCLUDED.answer_key,
  updated_at = now();


-- ============================================================================
-- FILE: 20260106062554_c347c1f9-ce59-4c85-8c99-4283c038d912.sql
-- ============================================================================

-- Allow public/anonymous uploads for comprehension-audio bucket (for script use)
CREATE POLICY "Allow uploads to comprehension-audio"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'comprehension-audio');


-- ============================================================================
-- FILE: 20260106122428_comprehension_items.sql
-- ============================================================================

-- Comprehension items table
CREATE TABLE IF NOT EXISTS public.comprehension_items (
  id TEXT PRIMARY KEY, -- e.g., "lc_fr_a1_0001"
  language TEXT NOT NULL DEFAULT 'fr-FR',
  cefr_level TEXT NOT NULL CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  transcript_fr TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  estimated_duration_s NUMERIC NOT NULL,
  prompt_fr TEXT NOT NULL,
  prompt_en TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of {id, fr, en}
  answer_key JSONB NOT NULL, -- {correct_option_ids: string[]}
  audio_url TEXT, -- Public URL to WAV file in storage
  audio_storage_path TEXT, -- Storage path for the audio file
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for filtering by audio availability
CREATE INDEX IF NOT EXISTS idx_comprehension_items_has_audio 
ON public.comprehension_items(audio_url) 
WHERE audio_url IS NOT NULL;

-- Index for CEFR level filtering
CREATE INDEX IF NOT EXISTS idx_comprehension_items_cefr 
ON public.comprehension_items(cefr_level);

-- Enable RLS
ALTER TABLE public.comprehension_items ENABLE ROW LEVEL SECURITY;

-- Public read access (items are not user-specific)
CREATE POLICY "Anyone can read comprehension items" 
ON public.comprehension_items 
FOR SELECT 
USING (true);


-- ============================================================================
-- FILE: 20260106122429_seed_comprehension_items.sql
-- ============================================================================

-- Seed comprehension items from TypeScript file
INSERT INTO public.comprehension_items (
  id, language, cefr_level, transcript_fr, word_count, estimated_duration_s,
  prompt_fr, prompt_en, options, answer_key
) VALUES
(
  'lc_fr_a1_0001',
  'fr-FR',
  'A1',
  'Il pleut fort. Marie cherche vite son parapluie, mais il est dans la voiture.',
  14,
  5.6,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Il pleut fort.", "en": "It is raining hard."},
    {"id": "o2", "fr": "Marie cherche son parapluie.", "en": "Marie is looking for her umbrella."},
    {"id": "o3", "fr": "Le parapluie est dans la voiture.", "en": "The umbrella is in the car."},
    {"id": "o4", "fr": "Marie a oubliÃ© son parapluie au travail.", "en": "Marie forgot her umbrella at work."},
    {"id": "o5", "fr": "Marie cherche ses clÃ©s.", "en": "Marie is looking for her keys."},
    {"id": "o6", "fr": "Il fait trÃ¨s beau aujourd''hui.", "en": "The weather is very sunny today."},
    {"id": "o7", "fr": "Le parapluie est cassÃ©.", "en": "The umbrella is broken."},
    {"id": "o8", "fr": "Marie va Ã  la plage.", "en": "Marie is going to the beach."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3"]}'::jsonb
),
(
  'lc_fr_a1_0002',
  'fr-FR',
  'A1',
  'Au cafÃ©, Paul commande un thÃ© sans sucre, attend deux minutes, puis demande l''addition et son ticket avant de partir.',
  20,
  8.0,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Paul commande un thÃ© sans sucre.", "en": "Paul orders a tea with no sugar."},
    {"id": "o2", "fr": "Il attend deux minutes.", "en": "He waits two minutes."},
    {"id": "o3", "fr": "Il demande l''addition et le ticket.", "en": "He asks for the bill and the receipt."},
    {"id": "o4", "fr": "Paul commande un cafÃ© au lait.", "en": "Paul orders a coffee with milk."},
    {"id": "o5", "fr": "Il demande la carte des desserts.", "en": "He asks for the dessert menu."},
    {"id": "o6", "fr": "Il reste au cafÃ© pendant une heure.", "en": "He stays at the cafe for an hour."},
    {"id": "o7", "fr": "Il part sans payer.", "en": "He leaves without paying."},
    {"id": "o8", "fr": "Il demande seulement un verre d''eau.", "en": "He only asks for a glass of water."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3"]}'::jsonb
),
(
  'lc_fr_a2_0003',
  'fr-FR',
  'A2',
  'Dans le bus, quelqu''un a oubliÃ© un sac bleu sous un siÃ¨ge. Le chauffeur l''annonce au micro, le met devant lui, et dit de le rÃ©cupÃ©rer au terminus.',
  28,
  11.2,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Quelqu''un a oubliÃ© un sac bleu.", "en": "Someone forgot a blue bag."},
    {"id": "o2", "fr": "Le chauffeur l''annonce au micro.", "en": "The driver announces it over the speaker."},
    {"id": "o3", "fr": "Le chauffeur garde le sac devant lui.", "en": "The driver keeps the bag at the front."},
    {"id": "o4", "fr": "On peut rÃ©cupÃ©rer le sac au terminus.", "en": "You can pick up the bag at the end of the line."},
    {"id": "o5", "fr": "Le sac est rouge.", "en": "The bag is red."},
    {"id": "o6", "fr": "Le chauffeur jette le sac.", "en": "The driver throws the bag away."},
    {"id": "o7", "fr": "Il faut aller au commissariat pour le rÃ©cupÃ©rer.", "en": "You must go to the police station to retrieve it."},
    {"id": "o8", "fr": "Le bus s''arrÃªte tout de suite pour chercher le propriÃ©taire.", "en": "The bus stops immediately to find the owner."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_a2_0004',
  'fr-FR',
  'A2',
  'On se retrouve Ã  la station RÃ©publique Ã  18 h, prÃ¨s de la sortie 3. DÃ©solÃ©, mon bus est bloquÃ© dans les embouteillages, je serai dix minutes en retard. Ne pars pas.',
  32,
  12.8,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Le rendez-vous est Ã  la station RÃ©publique.", "en": "The meeting point is RÃ©publique station."},
    {"id": "o2", "fr": "Le rendez-vous est Ã  18 h.", "en": "The meeting is at 6 pm."},
    {"id": "o3", "fr": "La personne aura environ dix minutes de retard.", "en": "The person will be about ten minutes late."},
    {"id": "o4", "fr": "Son bus est bloquÃ© dans les embouteillages.", "en": "Their bus is stuck in traffic."},
    {"id": "o5", "fr": "Le rendez-vous est Ã  8 h.", "en": "The meeting is at 8 am."},
    {"id": "o6", "fr": "Ils se retrouvent Ã  la station Bastille.", "en": "They are meeting at Bastille station."},
    {"id": "o7", "fr": "La personne est dÃ©jÃ  arrivÃ©e.", "en": "The person has already arrived."},
    {"id": "o8", "fr": "On lui dit de ne pas attendre.", "en": "They tell the other person not to wait."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_a2_0005',
  'fr-FR',
  'A2',
  'Une voisine crie dans la rue : son chat est coincÃ© dans un arbre depuis une heure. Elle veut appeler les pompiers, mais elle ne connaÃ®t pas le numÃ©ro et son tÃ©lÃ©phone est presque dÃ©chargÃ©. Elle demande Ã  un passant de l''aider.',
  42,
  16.8,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Un chat est coincÃ© dans un arbre.", "en": "A cat is stuck in a tree."},
    {"id": "o2", "fr": "Elle veut appeler les pompiers.", "en": "She wants to call the fire department."},
    {"id": "o3", "fr": "Elle ne connaÃ®t pas le numÃ©ro Ã  appeler.", "en": "She doesn''t know the number to call."},
    {"id": "o4", "fr": "Son tÃ©lÃ©phone est presque dÃ©chargÃ©.", "en": "Her phone is almost out of battery."},
    {"id": "o5", "fr": "Un chien est coincÃ© dans un arbre.", "en": "A dog is stuck in a tree."},
    {"id": "o6", "fr": "Les pompiers sont dÃ©jÃ  en route.", "en": "The fire department is already on the way."},
    {"id": "o7", "fr": "Elle veut appeler la police pour un vol.", "en": "She wants to call the police about a theft."},
    {"id": "o8", "fr": "Elle cherche un taxi.", "en": "She is looking for a taxi."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_a2_0006',
  'fr-FR',
  'A2',
  'On dÃ©cale la rÃ©union de cet aprÃ¨s-midi Ã  demain matin, Ã  9 h, parce que le client est malade. J''envoie tout de suite un e-mail avec la nouvelle heure et le lien visio. Garde ton aprÃ¨s-midi libre.',
  37,
  14.8,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "La rÃ©union est dÃ©placÃ©e Ã  demain matin, Ã  9 h.", "en": "The meeting is moved to tomorrow morning at 9."},
    {"id": "o2", "fr": "Le client est malade.", "en": "The client is sick."},
    {"id": "o3", "fr": "Un e-mail va confirmer la nouvelle heure.", "en": "An email will confirm the new time."},
    {"id": "o4", "fr": "Le lien visio est envoyÃ© par e-mail.", "en": "The video-call link is sent by email."},
    {"id": "o5", "fr": "La rÃ©union reste cet aprÃ¨s-midi.", "en": "The meeting stays this afternoon."},
    {"id": "o6", "fr": "La rÃ©union est annulÃ©e dÃ©finitivement.", "en": "The meeting is canceled forever."},
    {"id": "o7", "fr": "Le client est en vacances.", "en": "The client is on vacation."},
    {"id": "o8", "fr": "La rÃ©union est dÃ©placÃ©e Ã  ce soir.", "en": "The meeting is moved to tonight."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_b1_0007',
  'fr-FR',
  'B1',
  'Annonce en gare : le train pour Lyon de 17 h 12 est annulÃ© Ã  cause d''un problÃ¨me technique. Un bus de remplacement part du quai 5 dans vingt minutes. Pour un remboursement, allez au guichet avec votre billet. Les autres trains restent Ã  l''heure.',
  45,
  18.0,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Le train pour Lyon de 17 h 12 est annulÃ©.", "en": "The 5:12 pm train to Lyon is canceled."},
    {"id": "o2", "fr": "C''est Ã  cause d''un problÃ¨me technique.", "en": "It is due to a technical problem."},
    {"id": "o3", "fr": "Un bus de remplacement part du quai 5.", "en": "A replacement bus leaves from platform 5."},
    {"id": "o4", "fr": "On peut demander un remboursement au guichet.", "en": "You can request a refund at the ticket office."},
    {"id": "o5", "fr": "Le train a seulement dix minutes de retard.", "en": "The train is only ten minutes late."},
    {"id": "o6", "fr": "Le bus part du quai 2.", "en": "The bus leaves from platform 2."},
    {"id": "o7", "fr": "Le remboursement se fait uniquement en ligne.", "en": "Refunds are online only."},
    {"id": "o8", "fr": "Tous les trains sont annulÃ©s aujourd''hui.", "en": "All trains are canceled today."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_b1_0008',
  'fr-FR',
  'B1',
  'Dans la colocation, ils se disputent la facture d''Ã©lectricitÃ© : l''un dit qu''il ne cuisine jamais, l''autre laisse la lumiÃ¨re allumÃ©e. AprÃ¨s quelques minutes, ils se calment et dÃ©cident de suivre leur consommation avec une appli pendant un mois, Ã  partir d''aujourd''hui, puis de partager la facture selon l''usage rÃ©el.',
  50,
  20.0,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Ils se disputent la facture d''Ã©lectricitÃ©.", "en": "They argue about the electricity bill."},
    {"id": "o2", "fr": "Ils dÃ©cident de suivre leur consommation avec une appli.", "en": "They decide to track their usage with an app."},
    {"id": "o3", "fr": "Ils le font pendant un mois.", "en": "They do it for one month."},
    {"id": "o4", "fr": "Ils partageront la facture selon l''usage rÃ©el.", "en": "They will split the bill based on actual usage."},
    {"id": "o5", "fr": "Ils se disputent la facture d''eau.", "en": "They argue about the water bill."},
    {"id": "o6", "fr": "Ils dÃ©cident de ne plus payer la facture.", "en": "They decide to stop paying the bill."},
    {"id": "o7", "fr": "Ils partagent forcÃ©ment 50/50.", "en": "They will definitely split it 50/50."},
    {"id": "o8", "fr": "Ils achÃ¨tent un nouveau frigo.", "en": "They buy a new fridge."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_a2_0009',
  'fr-FR',
  'A2',
  'Au restaurant, elle prÃ©cise qu''elle est allergique aux noix. Le serveur part vÃ©rifier en cuisine si la sauce contient des amandes. Il revient : il y en a. Elle change de plat et prend une salade sans sauce.',
  38,
  15.2,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Elle est allergique aux noix.", "en": "She is allergic to nuts."},
    {"id": "o2", "fr": "Le serveur vÃ©rifie la sauce en cuisine.", "en": "The waiter checks the sauce in the kitchen."},
    {"id": "o3", "fr": "La sauce contient des amandes.", "en": "The sauce contains almonds."},
    {"id": "o4", "fr": "Elle choisit une salade sans sauce.", "en": "She chooses a salad with no sauce."},
    {"id": "o5", "fr": "Elle est allergique au gluten.", "en": "She is allergic to gluten."},
    {"id": "o6", "fr": "La sauce ne contient aucune amande.", "en": "The sauce contains no almonds."},
    {"id": "o7", "fr": "Elle garde le mÃªme plat.", "en": "She keeps the same dish."},
    {"id": "o8", "fr": "Elle commande un dessert aux noix.", "en": "She orders a dessert with nuts."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_b1_0010',
  'fr-FR',
  'B1',
  'Le recruteur propose un entretien lundi Ã  11 h pour un poste de chef de projet. Le candidat demande si c''est 100 % Ã  distance ; on lui rÃ©pond : hybride, trois jours au bureau. Il demande la fourchette de salaire. Ils fixent un second appel mercredi avec la RH.',
  50,
  20.0,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Un entretien est proposÃ© lundi Ã  11 h.", "en": "An interview is proposed for Monday at 11."},
    {"id": "o2", "fr": "On lui rÃ©pond : hybride, trois jours au bureau.", "en": "They answer: hybrid, three days in the office."},
    {"id": "o3", "fr": "Le candidat demande la fourchette de salaire.", "en": "The candidate asks for the salary range."},
    {"id": "o4", "fr": "Ils fixent un second appel mercredi avec la RH.", "en": "They schedule a second call on Wednesday with HR."},
    {"id": "o5", "fr": "On lui rÃ©pond : c''est totalement Ã  distance.", "en": "They answer: it is fully remote."},
    {"id": "o6", "fr": "L''entretien est prÃ©vu dimanche matin.", "en": "The interview is set for Sunday morning."},
    {"id": "o7", "fr": "Ils discutent d''un poste de serveur au restaurant.", "en": "They discuss a waiter job at a restaurant."},
    {"id": "o8", "fr": "Le recruteur annule et ne rappelle pas.", "en": "The recruiter cancels and never calls back."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_b2_0011',
  'fr-FR',
  'B2',
  'Au magasin, LÃ©a revient avec un casque audio qui grÃ©sille. Elle veut Ãªtre remboursÃ©e, mais elle a perdu le ticket de caisse. Le vendeur propose un Ã©change ou un avoir. Elle insiste pour un remboursement sur sa carte, alors il appelle la responsable.',
  43,
  17.2,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Le casque audio grÃ©sille.", "en": "The headphones crackle."},
    {"id": "o2", "fr": "LÃ©a a perdu le ticket de caisse.", "en": "LÃ©a lost the receipt."},
    {"id": "o3", "fr": "Le vendeur propose un Ã©change ou un avoir.", "en": "The seller offers an exchange or store credit."},
    {"id": "o4", "fr": "Le vendeur appelle la responsable.", "en": "The seller calls the manager."},
    {"id": "o5", "fr": "LÃ©a a le ticket de caisse.", "en": "LÃ©a has the receipt."},
    {"id": "o6", "fr": "Le casque fonctionne parfaitement.", "en": "The headphones work perfectly."},
    {"id": "o7", "fr": "Le vendeur lui rend l''argent tout de suite, sans question.", "en": "The seller refunds her immediately, no questions asked."},
    {"id": "o8", "fr": "Elle vient juste comparer des prix.", "en": "She only came to compare prices."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
),
(
  'lc_fr_b2_0012',
  'fr-FR',
  'B2',
  'Lors d''une rÃ©union de quartier, on propose de fermer la rue aux voitures le week-end. Certains commerÃ§ants sont pour, d''autres craignent de perdre des clients. La mairie propose un essai d''un mois et un vote ensuite. Un habitant rappelle qu''il faut garder un accÃ¨s pour les ambulances.',
  47,
  18.8,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "On propose de fermer la rue aux voitures le week-end.", "en": "They propose closing the street to cars on weekends."},
    {"id": "o2", "fr": "Certains commerÃ§ants sont pour, d''autres sont inquiets.", "en": "Some shop owners support it; others are worried."},
    {"id": "o3", "fr": "La mairie propose un essai d''un mois, puis un vote.", "en": "City hall proposes a one-month trial, then a vote."},
    {"id": "o4", "fr": "Il faut garder un accÃ¨s pour les ambulances.", "en": "They must keep access for ambulances."},
    {"id": "o5", "fr": "La rue sera fermÃ©e tous les jours, toute l''annÃ©e.", "en": "The street will be closed every day all year."},
    {"id": "o6", "fr": "Tout le monde est d''accord immÃ©diatement.", "en": "Everyone agrees immediately."},
    {"id": "o7", "fr": "La mairie abandonne l''idÃ©e dÃ¨s maintenant.", "en": "City hall drops the idea right away."},
    {"id": "o8", "fr": "On veut empÃªcher les ambulances de passer.", "en": "They want to block ambulances from passing."}
  ]'::jsonb,
  '{"correct_option_ids": ["o1", "o2", "o3", "o4"]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  transcript_fr = EXCLUDED.transcript_fr,
  word_count = EXCLUDED.word_count,
  estimated_duration_s = EXCLUDED.estimated_duration_s,
  prompt_fr = EXCLUDED.prompt_fr,
  prompt_en = EXCLUDED.prompt_en,
  options = EXCLUDED.options,
  answer_key = EXCLUDED.answer_key,
  updated_at = now();


-- ============================================================================
-- FILE: 20260106062554_c347c1f9-ce59-4c85-8c99-4283c038d912.sql
-- ============================================================================

-- Allow public/anonymous uploads for comprehension-audio bucket (for script use)
CREATE POLICY "Allow uploads to comprehension-audio"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'comprehension-audio');


-- ============================================================================
-- FILE: 20260106122428_comprehension_items.sql
-- ============================================================================

-- Comprehension items table
CREATE TABLE IF NOT EXISTS public.comprehension_items (
  id TEXT PRIMARY KEY, -- e.g., "lc_fr_a1_0001"
  language TEXT NOT NULL DEFAULT 'fr-FR',
  cefr_level TEXT NOT NULL CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  transcript_fr TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  estimated_duration_s NUMERIC NOT NULL,
  prompt_fr TEXT NOT NULL,
  prompt_en TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of {id, fr, en}
  answer_key JSONB NOT NULL, -- {correct_option_ids: string[]}
  audio_url TEXT, -- Public URL to WAV file in storage
  audio_storage_path TEXT, -- Storage path for the audio file
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for filtering by audio availability
CREATE INDEX IF NOT EXISTS idx_comprehension_items_has_audio 
ON public.comprehension_items(audio_url) 
WHERE audio_url IS NOT NULL;

-- Index for CEFR level filtering
CREATE INDEX IF NOT EXISTS idx_comprehension_items_cefr 
ON public.comprehension_items(cefr_level);

-- Enable RLS
ALTER TABLE public.comprehension_items ENABLE ROW LEVEL SECURITY;

-- Public read access (items are not user-specific)
CREATE POLICY "Anyone can read comprehension items" 
ON public.comprehension_items 
FOR SELECT 
USING (true);


-- ============================================================================
-- FILE: 20260106122429_seed_comprehension_items.sql
-- ============================================================================

-- Seed comprehension items from TypeScript file
INSERT INTO public.comprehension_items (
  id, language, cefr_level, transcript_fr, word_count, estimated_duration_s,
  prompt_fr, prompt_en, options, answer_key
) VALUES
(
  'lc_fr_a1_0001',
  'fr-FR',
  'A1',
  'Il pleut fort. Marie cherche vite son parapluie, mais il est dans la voiture.',
  14,
  5.6,
  'Que se passe-t-il ? SÃ©lectionne toutes les affirmations vraies. Il peut y en avoir plusieurs.',
  'What is going on? Select all statements that are true. There may be more than one.',
  '[
    {"id": "o1", "fr": "Il pleut fort.", "en": "It is raining hard."},
    {"id": "o2", "fr": "Marie cherche son parapluie.", "en": "Marie is looking for her umbrella."},
    {"id": "o3", "fr": "Le parapluie est dans la voiture.", "en": "The umbrella is in the car."},
    {"id": "o4", "fr": "Marie a oubliÃ© son parapluie au travail.", "en": "Marie forgot her umbrella at work."},
    {"id": "o5", "fr": "Marie cherche ses clÃ©s.", "en": "Marie is looking for her keys."},
    {"id": "o6", "fr": "Il fait trÃ¨s beau aujourd''hui.", "en": "The weather is very sunny today."},
    {"id": "o7", "fr": "Le parapluie est cassÃ©.", "en": "The umbrella is broken."},
    {"id": "o8", "fr": "Marie va Ã  la plage.", "en": "Marie is going to the beach."}
  ]'::