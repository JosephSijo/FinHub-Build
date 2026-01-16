-- =========================================
-- FINHUB: INDIA-FIRST CATALOG + SUGGESTIONS
-- =========================================
-- Description: Global catalog for merchants/banks and 
--              smart suggestion engine for user insights.
-- Created: 2026-01-16
-- =========================================

-- -----------------------------------------
-- 0) Adjust existing Categories (Make user_id nullable for System Categories)
-- -----------------------------------------
alter table public.categories alter column user_id drop not null;

-- -----------------------------------------
-- 1) Catalog Entities (Global Reference Data)
-- -----------------------------------------
create table if not exists public.catalog_entities (
  id uuid primary key default gen_random_uuid(),

  -- India-first
  country_code text not null default 'IN',

  -- bank | subscription | credit_card | merchant | category
  kind text not null check (kind in ('bank','subscription','credit_card','merchant','category')),

  name text not null,
  normalized_name text not null,

  icon_key text null,      -- used by frontend icon mapping
  logo_url text null,      -- optional if you want hosted logos

  -- optional category mapping for auto-categorization use-cases
  default_category_id uuid null references public.categories(id) on delete set null,

  -- additional attributes by kind
  metadata jsonb not null default '{}'::jsonb,

  popularity_score numeric not null default 0,
  usage_count int not null default 0,

  -- basic catalog quality control
  status text not null default 'pending' check (status in ('active','pending','blocked')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Uniqueness: prevent duplicates like ICICI / icici bank / Icici
create unique index if not exists catalog_entities_unique_idx
  on public.catalog_entities (country_code, kind, normalized_name);

create index if not exists catalog_entities_kind_idx
  on public.catalog_entities (country_code, kind);

create index if not exists catalog_entities_popularity_idx
  on public.catalog_entities (country_code, kind, popularity_score desc);

-- -----------------------------------------
-- 2) User Catalog Links (connect user objects to catalog)
-- -----------------------------------------
create table if not exists public.user_catalog_links (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users (id) on delete cascade,
  catalog_id uuid not null references public.catalog_entities(id) on delete cascade,

  -- entity in user space:
  -- account | subscription | credit_card | transaction
  entity_type text not null check (entity_type in ('account','subscription','credit_card','transaction')),

  entity_id uuid not null,

  confidence numeric not null default 1.0 check (confidence >= 0 and confidence <= 1),

  created_at timestamptz not null default now(),

  -- prevent duplicate link rows
  unique (user_id, catalog_id, entity_type, entity_id)
);

create index if not exists user_catalog_links_user_idx
  on public.user_catalog_links (user_id);

create index if not exists user_catalog_links_catalog_idx
  on public.user_catalog_links (catalog_id);

-- -----------------------------------------
-- 3) Smart Suggestions (rule/ai/hybrid output)
-- -----------------------------------------
create table if not exists public.smart_suggestions (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users (id) on delete cascade,

  -- category_guess, subscription_detected, bill_risk, overspend_warning, optimize_transfer, goal_recommendation
  type text not null,

  title text not null,
  message text not null,

  severity text not null default 'low' check (severity in ('low','medium','high','critical')),

  -- JSON action payload (CTA)
  -- ex: { "type": "CREATE_SUBSCRIPTION", "payload": { ... } }
  action jsonb not null default '{}'::jsonb,

  -- rule | ai | hybrid
  source text not null default 'rule' check (source in ('rule','ai','hybrid')),

  -- new | seen | dismissed | accepted
  status text not null default 'new' check (status in ('new','seen','dismissed','accepted')),

  created_at timestamptz not null default now(),
  expires_at timestamptz null
);

create index if not exists smart_suggestions_user_idx
  on public.smart_suggestions (user_id, status, created_at desc);

create index if not exists smart_suggestions_type_idx
  on public.smart_suggestions (user_id, type);

-- -----------------------------------------
-- 4) Helper: normalization function
-- -----------------------------------------
create or replace function public.normalize_entity_name(input text)
returns text
language sql
immutable
as $$
  select regexp_replace(lower(trim(input)), '\s+', ' ', 'g');
$$;

-- -----------------------------------------
-- 5) Helper: upsert catalog entity (increments usage)
-- -----------------------------------------
create or replace function public.upsert_catalog_entity(
  p_country_code text,
  p_kind text,
  p_name text,
  p_icon_key text default null,
  p_logo_url text default null,
  p_default_category_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
as $$
declare
  v_norm text;
  v_id uuid;
begin
  v_norm := public.normalize_entity_name(p_name);

  insert into public.catalog_entities (
    country_code, kind, name, normalized_name, icon_key, logo_url,
    default_category_id, metadata, usage_count, popularity_score, status
  )
  values (
    coalesce(p_country_code,'IN'), p_kind, p_name, v_norm, p_icon_key, p_logo_url,
    p_default_category_id, p_metadata, 1, 1, 'pending'
  )
  on conflict (country_code, kind, normalized_name)
  do update set
    usage_count = public.catalog_entities.usage_count + 1,
    popularity_score = public.catalog_entities.popularity_score + 1,
    updated_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

-- -----------------------------------------
-- 6) RLS
-- -----------------------------------------
alter table public.catalog_entities enable row level security;
alter table public.user_catalog_links enable row level security;
alter table public.smart_suggestions enable row level security;

-- catalog: public read only
create policy "catalog_read_all" on public.catalog_entities
  for select using (true);

-- restrict direct write to catalog
create policy "catalog_no_direct_write" on public.catalog_entities
  for insert to authenticated with check (false);

create policy "catalog_no_direct_update" on public.catalog_entities
  for update to authenticated using (false);

-- user_catalog_links: user scoped
create policy "user_catalog_links_own_rows" on public.user_catalog_links
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- smart_suggestions: user scoped
create policy "smart_suggestions_own_rows" on public.smart_suggestions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
