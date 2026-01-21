-- Migration: Category Safe Limits & Budget Snapshots
-- Path: supabase/migrations/20260117_category_limits.sql

-- 1. Category Limits Table
CREATE TABLE IF NOT EXISTS public.category_limits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    period text NOT NULL DEFAULT 'monthly' CHECK (period IN ('monthly', 'weekly')),
    limit_amount numeric NOT NULL DEFAULT 0,
    warn_at_percent integer DEFAULT 80,
    critical_at_percent integer DEFAULT 100,
    auto_calculated boolean DEFAULT true,
    calculation_version text DEFAULT 'v1.1',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE (user_id, category_id, period)
);

-- RLS for category_limits
ALTER TABLE public.category_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own category limits"
    ON public.category_limits
    FOR ALL
    USING (auth.uid() = user_id);

-- 2. Budgets Monthly Snapshot (Caching/Historical Analysis)
CREATE TABLE IF NOT EXISTS public.budgets_monthly_snapshot (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month text NOT NULL, -- YYYY-MM
    mi numeric NOT NULL DEFAULT 0, -- Monthly Income
    fo numeric NOT NULL DEFAULT 0, -- Fixed Obligations
    sr numeric NOT NULL DEFAULT 0, -- Savings Reserve
    nsp numeric NOT NULL DEFAULT 0, -- Net Safe Pool
    obligation_ratio numeric DEFAULT 0,
    stress_factor numeric DEFAULT 1.0,
    ssr numeric DEFAULT 1.0, -- Safe-to-Spend Ratio
    created_at timestamptz DEFAULT now(),
    UNIQUE (user_id, month)
);

-- RLS for budgets_monthly_snapshot
ALTER TABLE public.budgets_monthly_snapshot ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own budget snapshots"
    ON public.budgets_monthly_snapshot
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own budget snapshots"
    ON public.budgets_monthly_snapshot
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 3. Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_category_limits_updated ON public.category_limits;
CREATE TRIGGER on_category_limits_updated
    BEFORE UPDATE ON public.category_limits
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
