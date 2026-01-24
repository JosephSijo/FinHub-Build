-- =====================================================
-- Link Recurring Transactions to Entities
-- =====================================================
-- Description: Add entity_id and entity_kind to subscriptions table
--              to allow linking recurring rules to loans, goals, etc.
-- Created: 2026-01-24
-- =====================================================

DO $$
BEGIN
    -- Add entity_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'entity_id') THEN
        ALTER TABLE public.subscriptions ADD COLUMN entity_id uuid;
    END IF;

    -- Add entity_kind
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'entity_kind') THEN
        ALTER TABLE public.subscriptions ADD COLUMN entity_kind text;
    END IF;

END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS subscriptions_entity_idx ON public.subscriptions (user_id, entity_kind, entity_id);
