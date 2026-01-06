-- [FIX] Unified Admin Fixes V15: Fix 404 and Ambiguity errors
-- 1. get_user_made_reports: Change parameter name to target_profile_id to match frontend
-- 2. get_user_sanction_history_v2: Fix ambiguous 'id' reference and qualify columns

-- IMPORTANT: MUST DROP to change parameter names
DROP FUNCTION IF EXISTS public.get_user_made_reports(uuid);

-- 1. Fix get_user_made_reports (Parameter Mismatch)
CREATE OR REPLACE FUNCTION public.get_user_made_reports(target_profile_id UUID)
RETURNS SETOF public.reports
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_profile_id UUID;
BEGIN
    SELECT p.id, p.user_id INTO v_profile_id, v_user_id
    FROM public.profiles p
    WHERE p.id = target_profile_id OR p.user_id = target_profile_id
    LIMIT 1;

    RETURN QUERY
    SELECT r.*
    FROM public.reports r
    WHERE r.reporter_id = v_profile_id OR r.reporter_id = v_user_id
    ORDER BY r.created_at DESC;
END;
$$;

-- 2. Fix get_user_sanction_history_v2 (Ambiguity Fix)
CREATE OR REPLACE FUNCTION public.get_user_sanction_history_v2(p_target_user_id uuid)
RETURNS TABLE (
  id uuid,
  sanction_type text,
  duration_days int,
  reason text,
  created_at timestamptz,
  admin_nickname text
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
    p.nickname::text as admin_nickname
  FROM public.sanction_history sh
  LEFT JOIN public.profiles p ON sh.admin_id = p.id
  WHERE sh.target_user_id = p_target_user_id
     OR sh.target_user_id IN (SELECT pp.user_id FROM public.profiles pp WHERE pp.id = p_target_user_id)
     OR sh.target_user_id IN (SELECT pp.id FROM public.profiles pp WHERE pp.user_id = p_target_user_id)
  ORDER BY sh.created_at DESC;
END;
$$;

-- Ensure permissions
GRANT EXECUTE ON FUNCTION public.get_user_made_reports(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_made_reports(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_sanction_history_v2(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_sanction_history_v2(UUID) TO service_role;
