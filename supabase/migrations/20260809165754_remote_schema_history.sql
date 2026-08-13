-- This migration version already exists in the production migration history.
-- Keep a local no-op record so `supabase db push` can reconcile the repository
-- with production and apply later migrations safely.
SELECT 1;
