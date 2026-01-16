-- =====================================================
-- Validation Queries for FinHub Production Schema
-- =====================================================
-- Description: Sample queries to validate the schema migration
-- =====================================================

-- 1. Verify currencies are loaded
SELECT code, name, symbol FROM public.currencies ORDER BY code;

-- 2. Check user_profile table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'user_profile'
ORDER BY ordinal_position;

-- 3. Validate all tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name IN (
    'currencies', 'user_profile', 'fx_rates', 'accounts', 
    'categories', 'credit_cards', 'subscriptions', 'loans', 'transactions'
  )
ORDER BY table_name;

-- 4. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 5. Verify indexes were created
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public'
  AND tablename IN (
    'user_profile', 'fx_rates', 'accounts', 'categories',
    'credit_cards', 'subscriptions', 'loans', 'transactions'
  )
ORDER BY tablename, indexname;

-- 6. Test FX rate helper function (will return NULL if no rates exist)
SELECT public.get_latest_fx_rate('USD', 'INR') as usd_to_inr_rate;

-- 7. Check constraints on transactions table
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public' AND table_name = 'transactions'
ORDER BY constraint_type, constraint_name;

-- 8. Verify foreign key relationships
SELECT
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;
