-- =====================================================
-- Validation Queries for Fresh FinHub Schema
-- =====================================================

-- 1) Verify legacy tables are gone (Should return 0)
SELECT count(*) as legacy_table_count
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'kv_store_6e7daf8e';

-- 2) Verify normalized schema tables exist (Should return 9)
SELECT count(*) as app_table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'currencies', 'user_profile', 'fx_rates', 'accounts', 
    'categories', 'credit_cards', 'subscriptions', 'loans', 'transactions'
  );

-- 3) Verify RLS is enabled on all app tables (Should all be 't')
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'user_profile', 'accounts', 'categories', 'credit_cards', 
    'subscriptions', 'loans', 'transactions'
  )
ORDER BY tablename;

-- 4) Verify Seed Data (Should be 6)
SELECT count(*) as currency_count FROM public.currencies;

-- 5) Detailed Transactions Check
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'transactions'
  AND column_name IN ('amount', 'base_amount', 'fx_rate', 'currency_code', 'base_currency_code')
ORDER BY column_name;

-- 6) RLS Test: Insert test data for CURRENT user
-- Note: Replace auth.uid() with a real UUID if running manually outside of Supabase UI
/*
-- 6.1 Setup Profile
INSERT INTO public.user_profile (user_id, base_currency_code, display_mode) 
VALUES (auth.uid(), 'INR', 'HISTORICAL')
ON CONFLICT (user_id) DO NOTHING;

-- 6.2 Setup Account
INSERT INTO public.accounts (user_id, name, type, currency_code, opening_balance)
VALUES (auth.uid(), 'Fresh Test Bank', 'bank', 'INR', 1000)
RETURNING id;

-- 6.3 Setup Transaction (Replace <ACCOUNT_ID> with id from above)
INSERT INTO public.transactions (
  user_id, txn_date, type, amount, currency_code, 
  base_currency_code, fx_rate, base_amount, fx_date, account_id
) VALUES (
  auth.uid(), now(), 'expense', 100, 'INR', 
  'INR', 1.0, 100, current_date, '<ACCOUNT_ID>'
);
*/
