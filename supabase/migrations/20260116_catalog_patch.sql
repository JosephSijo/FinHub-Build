-- =========================================
-- FINHUB: CATALOG REGIONAL FALLBACK PATCH
-- =========================================
-- Description: Adds region_code and is_global to catalog,
--              and user location tracking to user_profile.
-- Created: 2026-01-16
-- =========================================

-- 1) Update Catalog Entities
ALTER TABLE public.catalog_entities 
  ADD COLUMN IF NOT EXISTS region_code text,
  ADD COLUMN IF NOT EXISTS is_global boolean DEFAULT false;

-- Create index for fallback priority
CREATE INDEX IF NOT EXISTS catalog_entities_fallback_idx 
  ON public.catalog_entities (is_global, country_code, region_code);

-- 2) Update User Profile
ALTER TABLE public.user_profile 
  ADD COLUMN IF NOT EXISTS user_country_code text DEFAULT 'IN',
  ADD COLUMN IF NOT EXISTS region_code text;

-- 3) Update upsert_catalog_entity RPC to support new columns
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
AS $$
DECLARE
  v_norm text;
  v_id uuid;
BEGIN
  v_norm := public.normalize_entity_name(p_name);

  INSERT INTO public.catalog_entities (
    country_code, kind, name, normalized_name, icon_key, logo_url,
    default_category_id, metadata, usage_count, popularity_score, status,
    region_code, is_global
  )
  VALUES (
    COALESCE(p_country_code,'IN'), p_kind, p_name, v_norm, p_icon_key, p_logo_url,
    p_default_category_id, p_metadata, 1, 1, 'pending',
    p_region_code, p_is_global
  )
  ON CONFLICT (country_code, kind, normalized_name)
  DO UPDATE SET
    usage_count = public.catalog_entities.usage_count + 1,
    popularity_score = public.catalog_entities.popularity_score + 1,
    updated_at = now(),
    -- Update metadata/region if provided and currently null
    region_code = COALESCE(public.catalog_entities.region_code, EXCLUDED.region_code),
    is_global = COALESCE(public.catalog_entities.is_global, EXCLUDED.is_global)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
