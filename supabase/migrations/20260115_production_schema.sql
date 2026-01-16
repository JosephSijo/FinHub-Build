-- =====================================================
-- FinHub Production Schema Migration
-- =====================================================
-- Description: Production-ready schema with multi-currency support,
--              unified transaction ledger, and comprehensive RLS policies
-- Created: 2026-01-15
-- =====================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- =========================
-- 1) CURRENCIES
-- =========================
create table if not exists public.currencies (
  code text primary key,           -- e.g., INR, USD
  name text not null,
  symbol text not null,
  minor_units int not null default 2
);

-- Seed common currencies (extend later)
insert into public.currencies (code, name, symbol, minor_units)
values
  ('INR', 'Indian Rupee', '₹', 2),
  ('USD', 'US Dollar', '$', 2),
  ('EUR', 'Euro', '€', 2),
  ('GBP', 'British Pound', '£', 2),
  ('AED', 'UAE Dirham', 'د.إ', 2),
  ('SAR', 'Saudi Riyal', '﷼', 2)
on conflict (code) do nothing;


-- =========================
-- 2) USER PROFILE (base currency)
-- =========================
create table if not exists public.user_profile (
  user_id uuid primary key references auth.users (id) on delete cascade,
  base_currency_code text not null references public.currencies(code),
  display_mode text not null default 'HISTORICAL'
    check (display_mode in ('HISTORICAL','TODAY')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_profile_base_currency_idx
  on public.user_profile(base_currency_code);


-- =========================
-- 3) FX RATES (historical + latest)
-- =========================
create table if not exists public.fx_rates (
  base_currency_code text not null references public.currencies(code),
  quote_currency_code text not null references public.currencies(code),
  rate numeric not null check (rate > 0),
  rate_date date not null,
  created_at timestamptz not null default now(),
  primary key (base_currency_code, quote_currency_code, rate_date)
);

create index if not exists fx_rates_lookup_idx
  on public.fx_rates(base_currency_code, quote_currency_code, rate_date desc);


-- =========================
-- 4) ACCOUNTS
-- =========================
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('cash','bank','wallet')),
  currency_code text not null references public.currencies(code),
  opening_balance numeric not null default 0,
  min_buffer numeric not null default 500,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists accounts_user_idx on public.accounts(user_id);
create index if not exists accounts_user_active_idx on public.accounts(user_id, is_active);


-- =========================
-- 5) CATEGORIES
-- =========================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('income','expense')),
  created_at timestamptz not null default now()
);

create index if not exists categories_user_idx on public.categories(user_id);


-- =========================
-- 6) CREDIT CARDS
-- =========================
create table if not exists public.credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  issuer text null,
  currency_code text not null references public.currencies(code),
  limit_amount numeric not null check (limit_amount >= 0),
  statement_day smallint not null default 1 check (statement_day between 1 and 31),
  due_day smallint not null check (due_day between 1 and 31),
  safety_cap_percent smallint not null default 20 check (safety_cap_percent between 0 and 100),
  status text not null default 'active' check (status in ('active','closed')),
  created_at timestamptz not null default now()
);

create index if not exists credit_cards_user_idx on public.credit_cards(user_id);


-- =========================
-- 7) SUBSCRIPTIONS (metadata)
-- =========================
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  amount numeric not null check (amount >= 0),
  currency_code text not null references public.currencies(code),
  account_id uuid not null references public.accounts(id) on delete restrict,
  due_day smallint not null check (due_day between 1 and 31),
  frequency text not null check (frequency in ('weekly','monthly','yearly','custom')),
  interval smallint not null default 1 check (interval >= 1),
  start_date date not null,
  end_date date null,
  status text not null default 'active' check (status in ('active','paused','cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists subscriptions_user_idx on public.subscriptions(user_id);
create index if not exists subscriptions_due_idx on public.subscriptions(user_id, status, due_day);


-- =========================
-- 8) LOANS (metadata)
-- =========================
create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('lent','borrowed')),
  person_name text not null,
  principal numeric not null check (principal >= 0),
  currency_code text not null references public.currencies(code),
  start_date date not null,
  status text not null default 'active' check (status in ('active','closed')),
  note text null,
  created_at timestamptz not null default now()
);

create index if not exists loans_user_idx on public.loans(user_id);


-- =========================
-- 9) TRANSACTIONS (unified ledger)
-- - Stores original + base converted amount
-- - base_currency_code = user base currency at time of txn
-- =========================
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  txn_date timestamptz not null,
  type text not null check (type in ('income','expense','transfer')),

  -- subtype examples:
  -- subscription_payment, loan_disbursal, loan_repayment,
  -- credit_spend, credit_bill_payment, iou_lend, iou_borrow, insurance_premium
  subtype text null,

  amount numeric not null check (amount >= 0),
  currency_code text not null references public.currencies(code),

  -- Base conversion snapshot at time of txn
  base_currency_code text not null references public.currencies(code),
  fx_rate numeric not null check (fx_rate > 0),
  base_amount numeric not null,
  fx_date date not null,

  -- Ledger links
  account_id uuid not null references public.accounts(id) on delete restrict,
  to_account_id uuid null references public.accounts(id) on delete restrict,

  category_id uuid null references public.categories(id) on delete set null,
  note text null,
  tags text[] not null default '{}'::text[],

  -- metadata links (for system-wide reflection)
  entity_kind text null check (entity_kind in ('subscription','loan','credit_card','insurance','iou','investment','goal')),
  entity_id uuid null,

  created_at timestamptz not null default now()
);

create index if not exists transactions_user_date_idx on public.transactions(user_id, txn_date desc);
create index if not exists transactions_user_type_idx on public.transactions(user_id, type);
create index if not exists transactions_entity_idx on public.transactions(user_id, entity_kind, entity_id);

-- Optional helpful constraint: transfer must have to_account_id
alter table public.transactions
  drop constraint if exists transfer_requires_to_account;
alter table public.transactions
  add constraint transfer_requires_to_account
  check (
    (type <> 'transfer') OR (to_account_id is not null)
  );


-- =========================
-- 10) DISPLAY MODE SUPPORT (TODAY FX)
-- Create helper function to fetch latest FX rate
-- =========================
create or replace function public.get_latest_fx_rate(
  base_code text,
  quote_code text
)
returns numeric
language sql
stable
as $$
  select r.rate
  from public.fx_rates r
  where r.base_currency_code = base_code
    and r.quote_currency_code = quote_code
  order by r.rate_date desc
  limit 1;
$$;


-- =========================
-- RLS (Row Level Security)
-- =========================
alter table public.user_profile enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.credit_cards enable row level security;
alter table public.subscriptions enable row level security;
alter table public.loans enable row level security;
alter table public.transactions enable row level security;

-- currencies + fx_rates can be public readable
alter table public.currencies enable row level security;
alter table public.fx_rates enable row level security;

-- Policies: user-specific tables
create policy "user_profile_own_rows" on public.user_profile
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "accounts_own_rows" on public.accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "categories_own_rows" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "credit_cards_own_rows" on public.credit_cards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "subscriptions_own_rows" on public.subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "loans_own_rows" on public.loans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "transactions_own_rows" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Public readable: currencies + fx_rates
create policy "currencies_read_all" on public.currencies
  for select using (true);

create policy "fx_rates_read_all" on public.fx_rates
  for select using (true);

-- Optional: only allow admin to insert fx rates later; for now allow authenticated insert
create policy "fx_rates_insert_auth" on public.fx_rates
  for insert to authenticated with check (true);
