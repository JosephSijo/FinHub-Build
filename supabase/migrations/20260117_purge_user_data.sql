-- =========================================
-- PURGE USER DATA: tin2mon-prod-001
-- =========================================
-- Description: Deletes all data associated with the user 
--              linked to mobile 9447147230.
-- =========================================

DO $$
DECLARE
    v_user_id TEXT := 'tin2mon-prod-001'; -- Using TEXT to match the existing ID format
BEGIN
    -- 1) Delete from tables with foreign key dependencies first
    DELETE FROM public.transactions WHERE user_id = v_user_id;
    DELETE FROM public.iou_payments WHERE user_id = v_user_id;
    DELETE FROM public.iou_installments WHERE user_id = v_user_id;
    DELETE FROM public.ious WHERE user_id = v_user_id;
    DELETE FROM public.subscriptions WHERE user_id = v_user_id;
    DELETE FROM public.credit_cards WHERE user_id = v_user_id;
    DELETE FROM public.loans WHERE user_id = v_user_id;
    DELETE FROM public.accounts WHERE user_id = v_user_id;
    DELETE FROM public.category_limits WHERE user_id = v_user_id;
    DELETE FROM public.categories WHERE user_id = v_user_id;
    DELETE FROM public.user_catalog_links WHERE user_id = v_user_id;
    DELETE FROM public.smart_suggestions WHERE user_id = v_user_id;
    DELETE FROM public.fee_rules WHERE user_id = v_user_id;
    DELETE FROM public.kv_store WHERE user_id = v_user_id;
    
    -- 2) Delete high level profile last
    DELETE FROM public.user_profile WHERE user_id = v_user_id;

    RAISE NOTICE 'Purge completed for user %', v_user_id;
END $$;
