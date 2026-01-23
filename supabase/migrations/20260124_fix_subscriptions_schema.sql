-- =====================================================
-- Fix Subscriptions Schema Mismatch
-- =====================================================
-- Description: Add missing columns to subscriptions table to match frontend expectations.
--              Fixes PGRST204 errors for 'tags', 'type', etc.
-- Created: 2026-01-24
-- =====================================================

DO $$
BEGIN
    -- 1. tags
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'tags') THEN
        ALTER TABLE public.subscriptions ADD COLUMN tags text[] DEFAULT '{}'::text[];
    END IF;

    -- 2. category_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'category_id') THEN
        ALTER TABLE public.subscriptions ADD COLUMN category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
    END IF;

    -- 3. type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'type') THEN
        ALTER TABLE public.subscriptions ADD COLUMN type text DEFAULT 'expense';
    END IF;

    -- 4. kind
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'kind') THEN
        ALTER TABLE public.subscriptions ADD COLUMN kind text DEFAULT 'subscription';
    END IF;

    -- 5. last_generated_date
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'last_generated_date') THEN
        ALTER TABLE public.subscriptions ADD COLUMN last_generated_date date;
    END IF;

    -- 6. reminder_enabled
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'reminder_enabled') THEN
        ALTER TABLE public.subscriptions ADD COLUMN reminder_enabled boolean DEFAULT true;
    END IF;

    -- 7. is_mandate_suggested
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'is_mandate_suggested') THEN
        ALTER TABLE public.subscriptions ADD COLUMN is_mandate_suggested boolean DEFAULT false;
    END IF;

    -- 8. mandate_status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'mandate_status') THEN
        ALTER TABLE public.subscriptions ADD COLUMN mandate_status text;
    END IF;

END $$;
