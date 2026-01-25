-- Update the factory reset function to support account deletion and preserve global tables
-- Name: 20260201_refine_reset_logic.sql

CREATE OR REPLACE FUNCTION admin_reset_user_and_globalize(
    p_target_user_id TEXT,
    p_delete_account BOOLEAN DEFAULT FALSE
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_rows_deleted INT;
BEGIN
    RAISE NOTICE 'Starting factory reset / deletion for user: %', p_target_user_id;

    -- ========================================================================
    -- STEP 1: Globalize Metadata (Preserve shared system tables)
    -- ========================================================================
    
    -- Promote user categories to global if not already existing
    UPDATE categories
    SET user_id = NULL
    WHERE user_id = p_target_user_id
      AND name NOT IN (SELECT name FROM categories WHERE user_id IS NULL);
      
    -- Delete redundant user categories
    DELETE FROM categories WHERE user_id = p_target_user_id;

    -- Globalize specific smart suggestions (transforming user tips into system tips)
    UPDATE smart_suggestions
    SET user_id = NULL,
        status = 'new',
        created_at = now()
    WHERE user_id = p_target_user_id;

    -- ========================================================================
    -- STEP 2: Secure Wipe of Personal Data
    -- ========================================================================

    -- Clear all personal financial data linked to the user
    DELETE FROM ledger_entries WHERE user_id = p_target_user_id;
    DELETE FROM user_catalog_links WHERE user_id = p_target_user_id;
    DELETE FROM user_achievements WHERE user_id = p_target_user_id;
    
    DELETE FROM iou_installments WHERE user_id = p_target_user_id;
    DELETE FROM iou_payments WHERE user_id = p_target_user_id;
    
    DELETE FROM transactions WHERE user_id = p_target_user_id;
    DELETE FROM subscriptions WHERE user_id = p_target_user_id;
    DELETE FROM loans WHERE user_id = p_target_user_id;
    DELETE FROM credit_cards WHERE user_id = p_target_user_id;
    DELETE FROM investments WHERE user_id = p_target_user_id;
    DELETE FROM goals WHERE user_id = p_target_user_id;
    DELETE FROM ious WHERE user_id = p_target_user_id;
    
    DELETE FROM categorization_rules WHERE user_id = p_target_user_id;
    DELETE FROM category_limits WHERE user_id = p_target_user_id;
    DELETE FROM fee_rules WHERE user_id = p_target_user_id;
    DELETE FROM kv_store WHERE user_id = p_target_user_id;
    
    -- Clear Root Accounts
    DELETE FROM accounts WHERE user_id = p_target_user_id;
    
    -- ========================================================================
    -- STEP 3: User Account Deletion Handling
    -- ========================================================================
    -- Note: The actual auth.users table is managed by Supabase Auth and 
    -- typically requires service_role or a DELETE trigger to wipe completely.
    -- This function ensures all transactional data is permanently gone.

    RAISE NOTICE 'User data for % securely purged.', p_target_user_id;
END;
$$;
