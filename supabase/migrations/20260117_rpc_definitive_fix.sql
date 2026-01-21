-- =========================================
-- DEFINITIVE FIX: UPSERT_CATALOG_ENTITY
-- =========================================
-- Description: Drops any old variants of the function and 
--              recreates it with the 9-parameter signature 
--              required by the current frontend.
-- =========================================

-- 1) Drop all possible old signatures to avoid overloads
DROP FUNCTION IF EXISTS public.upsert_catalog_entity(text, text, text);
DROP FUNCTION IF EXISTS public.upsert_catalog_entity(text, text, text, text, text, uuid, jsonb);
DROP FUNCTION IF EXISTS public.upsert_catalog_entity(text, text, text, text, text, uuid, jsonb, text, boolean);

-- 2) Create the current definitive signature
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
  -- Normalize the name for conflict detection
  -- Uses the existing normalize_entity_name or basic replacement if not found
  -- (Assuming normalize_entity_name exists from previous migrations)
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
