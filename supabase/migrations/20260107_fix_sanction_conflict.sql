-- [MIGRATION] Fix Sanction History 409 Conflict & ID Mapping
-- 1. Drop the unique constraint on report_id if it exists
DO $$
BEGIN
    -- Drop unique index
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'sanction_history' AND indexname = 'sanction_history_report_id_key') THEN
        DROP INDEX public.sanction_history_report_id_key;
    END IF;

    -- Drop unique constraint
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sanction_history_report_id_key') THEN
        ALTER TABLE public.sanction_history DROP CONSTRAINT sanction_history_report_id_key;
    END IF;
END $$;

-- 2. Modify target_user_id to refer to profiles.user_id (Auth ID) for consistency across system
-- Current table might be referencing profiles.id. Let's make it work with both or standardize it.
-- However, since many existing components might be using Auth ID, we'll ensure it works.
-- Actually, the safest way is to just allow insertion without strict FK if it's causing issues,
-- or ensure we always pass the correct Profile ID.
-- I'll keep the FK but ensure we use Profile ID in the frontend.

-- 3. Ensure unban is an allowed type
ALTER TABLE public.sanction_history DROP CONSTRAINT IF EXISTS sanction_type_check;
ALTER TABLE public.sanction_history ADD CONSTRAINT sanction_type_check CHECK (sanction_type IN ('ban', 'permanent_ban', 'warning', 'unban'));
