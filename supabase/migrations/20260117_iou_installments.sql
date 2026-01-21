-- =====================================================
-- IOU Installments Extension Migration
-- =====================================================
-- Description: Add installment/EMI tracking to existing IOUs
-- Created: 2026-01-17
-- =====================================================

-- =========================
-- IOU_INSTALLMENTS TABLE
-- =========================
create table if not exists public.iou_installments (
  id uuid primary key default gen_random_uuid(),
  iou_id uuid not null references public.ious(id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  sequence_no int not null check (sequence_no > 0),
  due_date date not null,
  amount numeric not null check (amount > 0),
  status text not null default 'PENDING' check (status in ('PENDING','PAID','CANCELLED')),
  paid_on date,
  created_at timestamptz not null default now(),
  
  -- Ensure unique sequence per IOU
  unique(iou_id, sequence_no)
);

-- Indexes for efficient queries
create index if not exists iou_installments_user_due_status_idx 
  on public.iou_installments(user_id, due_date, status);

create index if not exists iou_installments_iou_sequence_idx 
  on public.iou_installments(iou_id, sequence_no);

create index if not exists iou_installments_status_due_idx 
  on public.iou_installments(status, due_date) 
  where status = 'PENDING';

-- RLS for iou_installments
alter table public.iou_installments enable row level security;

create policy "Users can view their own IOU installments"
  on public.iou_installments for select
  using (auth.uid() = user_id);

create policy "Users can insert their own IOU installments"
  on public.iou_installments for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own IOU installments"
  on public.iou_installments for update
  using (auth.uid() = user_id);

create policy "Users can delete their own IOU installments"
  on public.iou_installments for delete
  using (auth.uid() = user_id);
