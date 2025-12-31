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