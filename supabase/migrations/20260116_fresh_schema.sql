-- =====================================================
-- FinHub Fresh Schema Migration (Production Normalized)
-- =====================================================
-- Description: Complete cleanup of legacy KV store and old tables,
--              rebuilding a fresh normalized schema with RLS and multi-currency.
-- Created: 2026-01-16
-- =====================================================

-- =========================
-- 1) CLEANUP (Idempotent)
-- =========================

-- Drop legacy KV store and its many indexes
drop table if exists public.kv_store_6e7daf8e cascade;
drop index if exists public.kv_store_6e7daf8e_key_idx;
drop index if exists public.kv_store_6e7daf8e_key_idx1;
drop index if exists public.kv_store_6e7daf8e_key_idx2;
drop index if exists public.kv_store_6e7daf8e_key_idx3;
drop index if exists public.kv_store_6e7daf8e_key_idx4;
drop index if exists public.kv_store_6e7daf8e_key_idx5;
drop index if exists public.kv_store_6e7daf8e_key_idx6;
drop index if exists public.kv_store_6e7daf8e_key_idx7;

-- Drop any other old public app tables if they exist
drop table if exists public.accounts_old cascade;
drop table if exists public.transactions_old cascade;
drop table if exists public.debts_old cascade;

-- Drop current production-ready tables for a clean slate
drop table if exists public.transactions cascade;
drop table if exists public.subscriptions cascade;
drop table if exists public.loans cascade;
drop table if exists public.credit_cards cascade;
drop table if exists public.categories cascade;
drop table if exists public.accounts cascade;
drop table if exists public.fx_rates cascade;
drop table if exists public.user_profile cascade;
drop table if exists public.currencies cascade;

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- =========================
-- 2) CURRENCIES
-- =========================
create table public.currencies (
  code text primary key,           -- ISO 4217 code (e.g., INR, USD)
  name text not null,
  symbol text not null,
  minor_units int not null default 2
);

-- Seed common currencies
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
-- 3) USER PROFILE (Base Configuration)
-- =========================
create table public.user_profile (
  user_id uuid primary key references auth.users (id) on delete cascade,
  base_currency_code text not null references public.currencies(code),
  display_mode text not null default 'HISTORICAL'
    check (display_mode in ('HISTORICAL','TODAY')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index user_profile_base_currency_idx on public.user_profile(base_currency_code);


-- =========================
-- 4) FX RATES (Historical Lookup)
-- =========================
create table public.fx_rates (
  base_currency_code text not null references public.currencies(code),
  quote_currency_code text not null references public.currencies(code),
  rate numeric not null check (rate > 0),
  rate_date date not null,
  created_at timestamptz not null default now(),
  primary key (base_currency_code, quote_currency_code, rate_date)
);

create index fx_rates_lookup_idx on public.fx_rates(base_currency_code, quote_currency_code, rate_date desc);


-- =========================
-- 5) ACCOUNTS (Wallets/Banks)
-- =========================
create table public.accounts (
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

create index accounts_user_idx on public.accounts(user_id);


-- =========================
-- 6) CATEGORIES (Custom Taxonomy)
-- =========================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('income','expense')),
  created_at timestamptz not null default now()
);

create index categories_user_idx on public.categories(user_id);


-- =========================
-- 7) CREDIT CARDS (Debt Logic)
-- =========================
create table public.credit_cards (
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

create index credit_cards_user_idx on public.credit_cards(user_id);


-- =========================
-- 8) SUBSCRIPTIONS (Recurring)
-- =========================
create table public.subscriptions (
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

create index subscriptions_user_idx on public.subscriptions(user_id);


-- =========================
-- 9) LOANS (P2P / Institutional)
-- =========================
create table public.loans (
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

create index loans_user_idx on public.loans(user_id);


-- =========================
-- 10) TRANSACTIONS (Unified Ledger)
-- =========================
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  txn_date timestamptz not null,
  type text not null check (type in ('income','expense','transfer')),
  subtype text null,

  -- Original amount
  amount numeric not null check (amount >= 0),
  currency_code text not null references public.currencies(code),

  -- Base conversion snapshot (for HISTORICAL display)
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

  -- Metadata links (for system-wide reflection)
  entity_kind text null check (entity_kind in ('subscription','loan','credit_card','insurance','iou','investment','goal')),
  entity_id uuid null,

  created_at timestamptz not null default now()
);

create index transactions_user_date_idx on public.transactions(user_id, txn_date desc);
create index transactions_entity_idx on public.transactions(user_id, entity_kind, entity_id);

-- Constraint: transfer must have to_account_id
alter table public.transactions add constraint transfer_requires_to_account
  check ((type <> 'transfer') OR (to_account_id is not null));


-- =========================
-- 11) RLS & POLICIES
-- =========================

-- Enable RLS
alter table public.currencies enable row level security;
alter table public.user_profile enable row level security;
alter table public.fx_rates enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.credit_cards enable row level security;
alter table public.subscriptions enable row level security;
alter table public.loans enable row level security;
alter table public.transactions enable row level security;

-- Policies for public data
create policy "currencies_read_all" on public.currencies for select using (true);
create policy "fx_rates_read_all" on public.fx_rates for select using (true);
create policy "fx_rates_insert_auth" on public.fx_rates for insert to authenticated with check (true);

-- Policies for user-specific data
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


-- =========================
-- 12) HELPERS
-- =========================
create or replace function public.get_latest_fx_rate(base_code text, quote_code text)
returns numeric language sql stable as $$
  -- Fetches the latest known rate for display purposes (e.g., TODAY mode)
  select r.rate from public.fx_rates r
  where r.base_currency_code = base_code and r.quote_currency_code = quote_code
  order by r.rate_date desc limit 1;
$$;
