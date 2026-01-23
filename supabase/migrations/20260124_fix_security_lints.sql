-- =====================================================
-- Fix Security Lints: Function Search Paths
-- =====================================================
-- Description: Explicitly set search_path = public for all functions
--              flagged by Supabase linter to prevent search_path hijacking.
-- Created: 2026-01-24
-- =====================================================

-- 1. Known Triggers / No-Arg Functions
-- (If unique, args can be omitted, but we specify where known or unique)

-- handle_updated_at (Trigger function)
ALTER FUNCTION public.handle_updated_at() SET search_path = public;

-- admin_reset_user_and_globalize (Explicit fix)
ALTER FUNCTION public.admin_reset_user_and_globalize(text) SET search_path = public;

-- 2. Known Functions with Args

-- get_latest_fx_rate
ALTER FUNCTION public.get_latest_fx_rate(text, text) SET search_path = public;

-- normalize_entity_name
ALTER FUNCTION public.normalize_entity_name(text) SET search_path = public;

-- upsert_catalog_entity (9-arg version from definitive fix)
ALTER FUNCTION public.upsert_catalog_entity(text, text, text, text, text, uuid, jsonb, text, boolean) SET search_path = public;


-- 3. Inferred Functions (Using DO blocks to handle potential missing functions safely in dev)
-- For production consistency, we should just run ALTER, but since we couldn't find source code
-- for some of these, we use dynamic SQL to attempt the fix on the name.

DO $$
BEGIN
    -- sync_account_balance_cols
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'sync_account_balance_cols') THEN
        EXECUTE 'ALTER FUNCTION public.sync_account_balance_cols() SET search_path = public';
    END IF;

    -- update_account_balance_from_ledger
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_account_balance_from_ledger') THEN
        EXECUTE 'ALTER FUNCTION public.update_account_balance_from_ledger() SET search_path = public';
    END IF;

    -- on_investment_to_ledger
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'on_investment_to_ledger') THEN
        EXECUTE 'ALTER FUNCTION public.on_investment_to_ledger() SET search_path = public';
    END IF;

    -- on_iou_to_ledger
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'on_iou_to_ledger') THEN
        EXECUTE 'ALTER FUNCTION public.on_iou_to_ledger() SET search_path = public';
    END IF;

    -- on_iou_payment_to_ledger
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'on_iou_payment_to_ledger') THEN
        EXECUTE 'ALTER FUNCTION public.on_iou_payment_to_ledger() SET search_path = public';
    END IF;

    -- on_loan_to_ledger
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'on_loan_to_ledger') THEN
        EXECUTE 'ALTER FUNCTION public.on_loan_to_ledger() SET search_path = public';
    END IF;

    -- on_ledger_entry_change
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'on_ledger_entry_change') THEN
        EXECUTE 'ALTER FUNCTION public.on_ledger_entry_change() SET search_path = public';
    END IF;

    -- auto_categorize_transaction
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'auto_categorize_transaction') THEN
        -- Attempt with no args first (trigger?)
        -- If it's not a trigger, this might fail if it has args, but 'ALTER FUNCTION name' works for uniques
        -- We'll rely on uniqueness if possible, but syntax requires args if we don't know it's unique.
        -- Let's try omitting args in the ALTER string if we suspect uniqueness? 
        -- Postgres allows 'ALTER FUNCTION public.name SET ...' if unique.
        EXECUTE 'ALTER FUNCTION public.auto_categorize_transaction SET search_path = public';
    END IF;

END $$;
