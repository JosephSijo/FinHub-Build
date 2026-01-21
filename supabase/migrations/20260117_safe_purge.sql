-- =========================================
-- SAFE DATA CLEARING SCRIPT (VERIFIED)
-- =========================================
-- Description: Safely clears data for user 'tin2mon-prod-001'.
--              Updated to zero out opening balances.
-- =========================================

DO $$
DECLARE
    v_user_id TEXT := 'tin2mon-prod-001'; -- CORRECTED USER ID
BEGIN
    -- 1) CLEAR TRANSACTIONAL HISTORY
    DELETE FROM public.transactions WHERE user_id = v_user_id;
    
    -- 2) CLEAR IOU & DEBT DATA
    DELETE FROM public.iou_payments WHERE user_id = v_user_id;
    DELETE FROM public.iou_installments WHERE user_id = v_user_id;
    DELETE FROM public.ious WHERE user_id = v_user_id;
    DELETE FROM public.loans WHERE user_id = v_user_id;

    -- 3) CLEAR COMMITMENTS & RULES
    DELETE FROM public.subscriptions WHERE user_id = v_user_id;
    DELETE FROM public.credit_cards WHERE user_id = v_user_id;
    
    -- 4) ZERO OUT ACCOUNT BALANCES (Keeps the account definition but resets money)
    UPDATE public.accounts 
    SET opening_balance = 0 
    WHERE user_id = v_user_id;

    -- 5) CLEAR DERIVED METADATA
    DELETE FROM public.category_limits WHERE user_id = v_user_id;
    DELETE FROM public.user_catalog_links WHERE user_id = v_user_id;
    DELETE FROM public.smart_suggestions WHERE user_id = v_user_id;
    DELETE FROM public.fee_rules WHERE user_id = v_user_id;
    DELETE FROM public.kv_store WHERE user_id = v_user_id;

    -- 6) RESET PROFILE (Keep the record to avoid login handshake issues)
    UPDATE public.user_profile 
    SET base_currency_code = 'INR', 
        display_mode = 'HISTORICAL',
        updated_at = now()
    WHERE user_id = v_user_id;

    RAISE NOTICE 'Safe purge completed for user %', v_user_id;
END $$;
