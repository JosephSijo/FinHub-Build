-- Create a function to securely reset user data while preserving/globalizing metadata
-- Function: admin_reset_user_and_globalize(target_user_id)

CREATE OR REPLACE FUNCTION admin_reset_user_and_globalize(p_target_user_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (admin)
SET search_path = public
AS $$
DECLARE
    v_rows_deleted INT;
BEGIN
    RAISE NOTICE 'Starting factory reset for user: %', p_target_user_id;

    -- ========================================================================
    -- STEP 1: Globalize Metadata (Categories & Smart Suggestions)
    -- ========================================================================
    
    -- A. Globalize Categories
    -- Promote user categories to global if a global one with the same name doesn't exist
    UPDATE categories
    SET user_id = NULL
    WHERE user_id = p_target_user_id
      AND name NOT IN (SELECT name FROM categories WHERE user_id IS NULL);
      
    GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
    RAISE NOTICE 'Globalized % categories.', v_rows_deleted;
      
    -- Delete remaining user categories (duplicates of existing global ones)
    DELETE FROM categories WHERE user_id = p_target_user_id;

    -- B. Globalize Smart Suggestions
    -- Promote all user suggestions to global tips and reset their status to 'new'
    UPDATE smart_suggestions
    SET user_id = NULL,
        status = 'new',
        created_at = now() -- Refresh timestamp
    WHERE user_id = p_target_user_id;
    
    GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
    RAISE NOTICE 'Globalized % smart suggestions.', v_rows_deleted;

    -- ========================================================================
    -- STEP 2: Wipe Transactional & History Data
    -- ========================================================================

    -- 1. Clear Dependencies (Ledger, Links, Achievements)
    DELETE FROM ledger_entries WHERE user_id = p_target_user_id;
    DELETE FROM user_catalog_links WHERE user_id = p_target_user_id;
    DELETE FROM user_achievements WHERE user_id = p_target_user_id; -- Unlocked achievements
    
    -- 2. Clear Recurring & Installments (Child tables first)
    DELETE FROM iou_installments WHERE user_id = p_target_user_id;
    DELETE FROM iou_payments WHERE user_id = p_target_user_id;
    
    -- 3. Clear Entity Tables
    DELETE FROM transactions WHERE user_id = p_target_user_id;
    DELETE FROM subscriptions WHERE user_id = p_target_user_id;
    DELETE FROM loans WHERE user_id = p_target_user_id;
    DELETE FROM credit_cards WHERE user_id = p_target_user_id;
    DELETE FROM investments WHERE user_id = p_target_user_id;
    DELETE FROM goals WHERE user_id = p_target_user_id;
    DELETE FROM ious WHERE user_id = p_target_user_id;
    
    -- 4. Clear Configuration/Rules that are user-specific
    DELETE FROM categorization_rules WHERE user_id = p_target_user_id;
    DELETE FROM category_limits WHERE user_id = p_target_user_id;
    DELETE FROM fee_rules WHERE user_id = p_target_user_id;
    DELETE FROM kv_store WHERE user_id = p_target_user_id;
    
    -- 5. Finally, Delete Accounts (Root of financial data)
    DELETE FROM accounts WHERE user_id = p_target_user_id;
    
    RAISE NOTICE 'User transactional data fully wiped.';

    -- ========================================================================
    -- STEP 3: Validation
    -- ========================================================================
    -- We can perform a quick check here, but the transaction will rollback if anything failed above.
    
END;
$$;
