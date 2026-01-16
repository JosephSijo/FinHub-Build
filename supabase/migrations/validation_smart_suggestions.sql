-- =========================================
-- Validation for Smart Suggestions & Catalog
-- =========================================

-- 1) Verify table existence
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('catalog_entities', 'user_catalog_links', 'smart_suggestions');

-- 2) Check for the normalization function
SELECT public.normalize_entity_name('  ICICI  Bank  '); -- Should return 'icici bank'

-- 3) Test Catalog Upsert (India-first)
SELECT public.upsert_catalog_entity(
  'IN', 'bank', 'HDFC Bank', 'bank-icon', null, null, '{"tier": "premium"}'::jsonb
);

-- 4) Verify Categorization Reference (Check if categories allows NULL user_id)
SELECT is_nullable 
FROM information_schema.columns 
WHERE table_name = 'categories' AND column_name = 'user_id';

-- 5) Check RLS Status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('catalog_entities', 'user_catalog_links', 'smart_suggestions');

-- 6) Sample Smart Suggestion (Mental Model)
/*
INSERT INTO public.smart_suggestions (
  user_id, type, title, message, severity, action, source
) VALUES (
  auth.uid(), 
  'bill_risk', 
  'Upcoming Credit Card Bill', 
  'Your HDFC bill of ₹45,000 is due in 3 days. Available buffer is low.',
  'high',
  '{"type": "VIEW_ACCOUNT", "payload": {"accountId": "..."}}'::jsonb,
  'hybrid'
);
*/
