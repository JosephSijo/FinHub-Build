-- =====================================================
-- Fix Transactions Schema for Backdating
-- =====================================================
-- Description: Add missing 'entity_kind' column to transactions table
--              referenced by frontend during upsert operations.
-- Created: 2026-01-24
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'entity_kind') THEN
        ALTER TABLE public.transactions ADD COLUMN entity_kind text;
    END IF;
END $$;
