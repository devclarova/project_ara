-- [MIGRATION] V17: Link Sanction History to Reports
-- 1. Add report_id to sanction_history
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sanction_history' AND column_name = 'report_id') THEN
        ALTER TABLE public.sanction_history ADD COLUMN report_id UUID REFERENCES public.reports(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Update get_user_sanction_history_v2 to return report_id
DROP FUNCTION IF EXISTS public.get_user_sanction_history_v2(uuid);

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
     OR sh.target_user_id IN (SELECT pp.user_id FROM public.profiles pp WHERE pp.id = p_target_user_id)
     OR sh.target_user_id IN (SELECT pp.id FROM public.profiles pp WHERE pp.user_id = p_target_user_id)
  ORDER BY sh.created_at DESC;
END;
$$;

-- GRANTS
GRANT EXECUTE ON FUNCTION public.get_user_sanction_history_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_sanction_history_v2 TO service_role;
