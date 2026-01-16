-- =====================================================
-- Rollback Script for FinHub Production Schema
-- =====================================================
-- Description: Safely removes all tables and functions created by the
--              production schema migration
-- WARNING: This will delete all data in these tables!
-- =====================================================

-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.loans CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.credit_cards CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.accounts CASCADE;
DROP TABLE IF EXISTS public.fx_rates CASCADE;
DROP TABLE IF EXISTS public.user_profile CASCADE;
DROP TABLE IF EXISTS public.currencies CASCADE;

-- Drop helper function
DROP FUNCTION IF EXISTS public.get_latest_fx_rate(text, text);

-- Note: pgcrypto extension is left enabled as it may be used by other parts of the system
