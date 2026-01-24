-- =====================================================
-- Align Loans Schema with Advanced Tracking
-- =====================================================
-- Description:
-- 1. Add missing columns for advanced loan tracking.
-- 2. Ensure consistency between frontend labels and backend columns.
-- Created: 2026-01-24
-- =====================================================

DO $$
BEGIN
    -- Add interest_rate
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'loans' AND column_name = 'interest_rate') THEN
        ALTER TABLE public.loans ADD COLUMN interest_rate numeric DEFAULT 0;
    END IF;

    -- Add tenure
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'loans' AND column_name = 'tenure') THEN
        ALTER TABLE public.loans ADD COLUMN tenure integer DEFAULT 0;
    END IF;

    -- Add outstanding
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'loans' AND column_name = 'outstanding') THEN
        ALTER TABLE public.loans ADD COLUMN outstanding numeric DEFAULT 0;
    END IF;

    -- Ensure emi_amount exists (some older versions might miss it)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'loans' AND column_name = 'emi_amount') THEN
        ALTER TABLE public.loans ADD COLUMN emi_amount numeric DEFAULT 0;
    END IF;

    -- Add loan_name if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'loans' AND column_name = 'loan_name') THEN
        ALTER TABLE public.loans ADD COLUMN loan_name text;
    END IF;

    -- Add status (aliasing loan_status or adding new one)
    -- Given loan_status exists, we will keep it but ensure it's handled in API.
    -- However, for future proofing let's add a standardized 'status' column if it's better.
    -- Let's stick to mapping in API for now to avoid breaking existing data.
END $$;

-- Update RLS if needed (usually columns are covered by * policies, but good to be safe)
-- The existing policy is ALL, so it should be fine.
