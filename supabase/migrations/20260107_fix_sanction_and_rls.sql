-- [MIGRATION] Fix Sanction System & RLS Restoration
-- 1. Restore Admin Update Policy on Profiles
-- nuclear_profiles_rls_reset.sql에 의해 삭제된 관리자 권한을 복구합니다.
DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;

CREATE POLICY "profiles_admin_update" ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.is_admin = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- 2. Clean up sanction_history unique constraint
-- report_id에 불필요하게 걸린 UNIQUE 제약 조건을 제거하여 409 Conflict를 해결합니다.
DO $$
BEGIN
    -- Drop unique index if exists
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'sanction_history' AND indexname = 'sanction_history_report_id_key') THEN
        DROP INDEX public.sanction_history_report_id_key;
    END IF;

    -- Drop unique constraint if exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sanction_history_report_id_key') THEN
        ALTER TABLE public.sanction_history DROP CONSTRAINT sanction_history_report_id_key;
    END IF;
END $$;

-- 3. Ensure sanction types are fully supported
ALTER TABLE public.sanction_history DROP CONSTRAINT IF EXISTS sanction_type_check;
ALTER TABLE public.sanction_history ADD CONSTRAINT sanction_type_check CHECK (sanction_type IN ('ban', 'permanent_ban', 'warning', 'unban'));
