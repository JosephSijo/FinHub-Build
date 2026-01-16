-- =====================================================
-- Fee-incurring Card Transaction Detection v1
-- =====================================================
-- Description: Detect and alert about card transactions with extra fees
-- Created: 2026-01-17
-- =====================================================

-- =========================
-- 1) ALTER TRANSACTIONS TABLE
-- =========================
-- Add columns for payment method and merchant tracking
-- Note: Using DO block to check if columns exist before adding

DO $$ 
BEGIN
    -- Add payment_method column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transactions' 
        AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE public.transactions 
        ADD COLUMN payment_method text DEFAULT 'UPI';
    END IF;

    -- Add merchant_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transactions' 
        AND column_name = 'merchant_name'
    ) THEN
        ALTER TABLE public.transactions 
        ADD COLUMN merchant_name text;
    END IF;

    -- Add external_service column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transactions' 
        AND column_name = 'external_service'
    ) THEN
        ALTER TABLE public.transactions 
        ADD COLUMN external_service text;
    END IF;
END $$;

-- =========================
-- 2) FEE_RULES TABLE
-- =========================
create table if not exists public.fee_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  applies_payment_method text not null default 'CARD',
  category_id uuid,
  merchant_keywords text[],
  note_keywords text[],
  estimated_fee_percent numeric not null default 1.5,
  severity text not null default 'WARN' check (severity in ('INFO','WARN','CRITICAL')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Indexes for efficient queries
create index if not exists fee_rules_active_idx 
  on public.fee_rules(is_active) 
  where is_active = true;

create index if not exists fee_rules_user_idx 
  on public.fee_rules(user_id);

-- RLS for fee_rules
alter table public.fee_rules enable row level security;

create policy "Users can view global and their own fee rules"
  on public.fee_rules for select
  using (user_id is null OR auth.uid() = user_id);

create policy "Users can insert their own fee rules"
  on public.fee_rules for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own fee rules"
  on public.fee_rules for update
  using (auth.uid() = user_id);

create policy "Users can delete their own fee rules"
  on public.fee_rules for delete
  using (auth.uid() = user_id);

-- =========================
-- 3) SEED GLOBAL FEE RULES
-- =========================
-- Insert global rules (user_id = NULL) for common fee scenarios

insert into public.fee_rules (
  user_id,
  name,
  applies_payment_method,
  merchant_keywords,
  note_keywords,
  estimated_fee_percent,
  severity,
  is_active
) values
  (
    null,
    'Card rent payments via CRED/Housing apps',
    'CARD',
    ARRAY['cred', 'housing', 'nobroker', 'magicbricks'],
    ARRAY['convenience fee', 'service charge', 'processing fee'],
    1.5,
    'WARN',
    true
  ),
  (
    null,
    'Card payments for education fees',
    'CARD',
    ARRAY['school', 'college', 'university', 'tuition'],
    ARRAY['convenience fee', 'service charge'],
    1.8,
    'WARN',
    true
  ),
  (
    null,
    'Card payments for maintenance/society fees',
    'CARD',
    ARRAY['society', 'maintenance', 'apartment'],
    ARRAY['convenience fee', 'service charge'],
    1.5,
    'WARN',
    true
  )
on conflict do nothing;
