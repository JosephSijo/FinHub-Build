-- =====================================================
-- Personal IOUs v1 Migration
-- =====================================================
-- Description: Track personal IOUs (lent/borrowed) with payment history
-- Created: 2026-01-17
-- =====================================================

-- Enable UUID generation (if not already enabled)
create extension if not exists "pgcrypto";

-- =========================
-- 1) IOUS TABLE
-- =========================
create table if not exists public.ious (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  direction text not null check (direction in ('LENT','BORROWED')),
  person_name text not null,
  contact_phone text,
  contact_tag text,
  principal_amount numeric not null check (principal_amount > 0),
  outstanding_amount numeric not null check (outstanding_amount >= 0),
  due_date date not null,
  status text not null default 'OPEN' check (status in ('OPEN','PARTIAL','CLOSED','CANCELLED')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists ious_user_idx on public.ious(user_id);
create index if not exists ious_user_status_idx on public.ious(user_id, status);
create index if not exists ious_user_due_date_idx on public.ious(user_id, due_date);

-- RLS for ious
alter table public.ious enable row level security;

create policy "Users can view their own IOUs"
  on public.ious for select
  using (auth.uid() = user_id);

create policy "Users can insert their own IOUs"
  on public.ious for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own IOUs"
  on public.ious for update
  using (auth.uid() = user_id);

create policy "Users can delete their own IOUs"
  on public.ious for delete
  using (auth.uid() = user_id);


-- =========================
-- 2) IOU_PAYMENTS TABLE
-- =========================
create table if not exists public.iou_payments (
  id uuid primary key default gen_random_uuid(),
  iou_id uuid not null references public.ious(id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric not null check (amount > 0),
  paid_on date not null,
  method text not null default 'UPI' check (method in ('CASH','UPI','BANK','CARD','OTHER')),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists iou_payments_iou_idx on public.iou_payments(iou_id);
create index if not exists iou_payments_user_idx on public.iou_payments(user_id);

-- RLS for iou_payments
alter table public.iou_payments enable row level security;

create policy "Users can view their own IOU payments"
  on public.iou_payments for select
  using (auth.uid() = user_id);

create policy "Users can insert their own IOU payments"
  on public.iou_payments for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own IOU payments"
  on public.iou_payments for update
  using (auth.uid() = user_id);

create policy "Users can delete their own IOU payments"
  on public.iou_payments for delete
  using (auth.uid() = user_id);
