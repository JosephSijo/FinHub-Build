-- =====================================================
-- Fix Security Lints: Missing RLS Policies
-- =====================================================
-- Description: Apply standard RLS policies to tables that have RLS enabled
--              but no policies, resolving 'rls_enabled_no_policy' lints.
--              Includes casts to ::text for user_id to match legacy schema types.
-- Created: 2026-01-24
-- =====================================================

-- 1. Shared / Reference Data Tables (Read-Only Public)

-- currencies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.currencies;
CREATE POLICY "Enable read access for all users" ON public.currencies FOR SELECT USING (true);

-- fx_rates
DROP POLICY IF EXISTS "Enable read access for all users" ON public.fx_rates;
CREATE POLICY "Enable read access for all users" ON public.fx_rates FOR SELECT USING (true);

-- 2. User-Specific Data Tables (Owner Access Only)
-- Note: user_id columns in this schema are TEXT, so we cast auth.uid()::text

-- accounts
DROP POLICY IF EXISTS "Users can manage their own accounts" ON public.accounts;
CREATE POLICY "Users can manage their own accounts" ON public.accounts
    FOR ALL
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

-- credit_cards
DROP POLICY IF EXISTS "Users can manage their own credit_cards" ON public.credit_cards;
CREATE POLICY "Users can manage their own credit_cards" ON public.credit_cards
    FOR ALL
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

-- investments
DROP POLICY IF EXISTS "Users can manage their own investments" ON public.investments;
CREATE POLICY "Users can manage their own investments" ON public.investments
    FOR ALL
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

-- ledger_entries
DROP POLICY IF EXISTS "Users can manage their own ledger_entries" ON public.ledger_entries;
CREATE POLICY "Users can manage their own ledger_entries" ON public.ledger_entries
    FOR ALL
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

-- loans
DROP POLICY IF EXISTS "Users can manage their own loans" ON public.loans;
CREATE POLICY "Users can manage their own loans" ON public.loans
    FOR ALL
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

-- subscriptions
DROP POLICY IF EXISTS "Users can manage their own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can manage their own subscriptions" ON public.subscriptions
    FOR ALL
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

-- transactions
DROP POLICY IF EXISTS "Users can manage their own transactions" ON public.transactions;
CREATE POLICY "Users can manage their own transactions" ON public.transactions
    FOR ALL
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

-- user_profile
DROP POLICY IF EXISTS "Users can manage their own user_profile" ON public.user_profile;
CREATE POLICY "Users can manage their own user_profile" ON public.user_profile
    FOR ALL
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);
