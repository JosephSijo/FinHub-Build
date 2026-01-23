-- =====================================================
-- Fix Schema Mismatches & Permissions
-- =====================================================
-- Description: 
-- 1. Add missing optional columns to user_profile (name, theme) requested by frontend.
-- 2. Update upsert_catalog_entity to SECURITY DEFINER to fix RLS 403 errors.
-- 3. Ensure transactions.entity_id and subscriptions.status exist.
-- Created: 2026-01-24
-- =====================================================

-- 1. user_profile
-- Add 'name' if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profile' AND column_name = 'name') THEN
        ALTER TABLE public.user_profile ADD COLUMN name text;
    END IF;
END $$;

-- Add 'theme' if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profile' AND column_name = 'theme') THEN
        ALTER TABLE public.user_profile ADD COLUMN theme text DEFAULT 'system';
    END IF;
END $$;


-- 2. catalog_entities Permissions
-- Recreate upsert_catalog_entity as SECURITY DEFINER
-- We use the exact signature from 20260117_rpc_definitive_fix.sql
CREATE OR REPLACE FUNCTION public.upsert_catalog_entity(
  p_country_code text,
  p_kind text,
  p_name text,
  p_icon_key text default null,
  p_logo_url text default null,
  p_default_category_id uuid default null,
  p_metadata jsonb default '{}'::jsonb,
  p_region_code text default null,
  p_is_global boolean default false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER -- Fix: Bypass RLS for inserts
SET search_path = public -- Fix: Security Lint
AS $$
DECLARE
  v_norm text;
  v_id uuid;
BEGIN
  -- Normalize the name for conflict detection
  BEGIN
    v_norm := public.normalize_entity_name(p_name);
  EXCEPTION WHEN undefined_function THEN
    v_norm := regexp_replace(lower(trim(p_name)), '\s+', ' ', 'g');
  END;

  INSERT INTO public.catalog_entities (
    country_code, 
    kind, 
    name, 
    normalized_name, 
    icon_key, 
    logo_url,
    default_category_id, 
    metadata, 
    usage_count, 
    popularity_score, 
    status,
    region_code, 
    is_global
  )
  VALUES (
    COALESCE(p_country_code, 'IN'), 
    p_kind, 
    p_name, 
    v_norm, 
    p_icon_key, 
    p_logo_url,
    p_default_category_id, 
    p_metadata, 
    1, 
    1, 
    'pending',
    p_region_code, 
    p_is_global
  )
  ON CONFLICT (country_code, kind, normalized_name)
  DO UPDATE SET
    usage_count = public.catalog_entities.usage_count + 1,
    popularity_score = public.catalog_entities.popularity_score + 1,
    updated_at = now(),
    -- Preserve existing values if they are NOT NULL, otherwise take the new ones
    region_code = COALESCE(public.catalog_entities.region_code, EXCLUDED.region_code),
    is_global = COALESCE(public.catalog_entities.is_global, EXCLUDED.is_global)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;


-- 3. transactions.entity_id check
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'entity_id') THEN
        ALTER TABLE public.transactions ADD COLUMN entity_id uuid;
    END IF;
END $$;

-- 4. subscriptions.status check
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'status') THEN
        ALTER TABLE public.subscriptions ADD COLUMN status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','cancelled'));
    END IF;
END $$;
