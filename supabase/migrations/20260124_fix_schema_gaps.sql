-- Fix schema mismatches causing 400 Bad Request errors

-- 1. Add polymorphic relation columns to transactions
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS entity_id uuid NULL,
ADD COLUMN IF NOT EXISTS entity_kind text NULL;

-- 2. Add standard columns to user_profile
ALTER TABLE public.user_profile
ADD COLUMN IF NOT EXISTS name text NULL,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 3. Ensure updated_at is automatically managed (optional but good practice)
-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers
DROP TRIGGER IF EXISTS on_user_profile_updated ON public.user_profile;
CREATE TRIGGER on_user_profile_updated
    BEFORE UPDATE ON public.user_profile
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS on_transactions_updated ON public.transactions;
CREATE TRIGGER on_transactions_updated
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();
