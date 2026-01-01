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

