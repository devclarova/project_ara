-- [MIGRATION] V18: Fix Sanction History Constraints
-- This migration fixes the 409 Conflict error by allowing 'unban' type and ensuring no unintended unique constraints exist.

DO $$
BEGIN
    -- 1. Update sanction_type_check to include 'unban'
    -- Check if constraint exists before dropping/re-adding
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sanction_type_check') THEN
        ALTER TABLE public.sanction_history DROP CONSTRAINT sanction_type_check;
    END IF;
    
    ALTER TABLE public.sanction_history 
    ADD CONSTRAINT sanction_type_check 
    CHECK (sanction_type IN ('ban', 'permanent_ban', 'warning', 'unban'));

    -- 2. Drop any unintended unique constraints on report_id if they exist
    -- In some versions of the schema, report_id might have been created with UNIQUE by mistake (mapped from some logic)
    -- This ensures a report can have multiple history entries (e.g. Warning then Ban)
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'sanction_history' 
        AND indexname = 'sanction_history_report_id_key'
    ) THEN
        DROP INDEX IF EXISTS public.sanction_history_report_id_key;
    END IF;

    -- Also check for unique constraint explicitly
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'sanction_history_report_id_key'
    ) THEN
        ALTER TABLE public.sanction_history DROP CONSTRAINT sanction_history_report_id_key;
    END IF;

END $$;

-- 3. Update get_user_sanction_history_v2 to ensure unban/permanent_ban are handled
-- (Already updated in V17, but ensuring consistency)
CREATE OR REPLACE FUNCTION public.get_user_sanction_history_v2(p_target_user_id uuid)
RETURNS TABLE (
  sanction_id uuid,
  sanction_type text,
  duration_days int,
  reason text,
  created_at timestamptz,
  admin_nickname text,
  report_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT authorize_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    sh.id,
    sh.sanction_type::text,
    sh.duration_days,
    sh.reason,
    sh.created_at,
    p.nickname::text as admin_nickname,
    sh.report_id
  FROM public.sanction_history sh
  LEFT JOIN public.profiles p ON sh.admin_id = p.id
  WHERE sh.target_user_id = p_target_user_id
     -- Also find by associated auth.uid if p_target_user_id is a profile ID, and vice-versa
     OR sh.target_user_id IN (SELECT pp.user_id FROM public.profiles pp WHERE pp.id = p_target_user_id)
     OR sh.target_user_id IN (SELECT pp.id FROM public.profiles pp WHERE pp.user_id = p_target_user_id)
  ORDER BY sh.created_at DESC;
END;
$$;
