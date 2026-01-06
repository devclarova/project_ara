-- [FINAL FIX V3] Fix ambiguity and ID mismatch for Activity Audit
-- 1. get_admin_users_list: Return both Auth ID and Profile ID
-- 2. get_user_sanction_history_v2: Fix ambiguous column reference

DROP FUNCTION IF EXISTS public.get_admin_users_list(int, int, text, text, text);
DROP FUNCTION IF EXISTS public.get_user_sanction_history_v2(uuid);

-- 1. get_admin_users_list (received_reports_count + profile_id 포함)
CREATE OR REPLACE FUNCTION public.get_admin_users_list(
  page int DEFAULT 1,
  per_page int DEFAULT 10,
  search_term text DEFAULT '',
  filter_role text DEFAULT 'All',
  filter_status text DEFAULT 'All'
)
RETURNS TABLE (
  id uuid,            -- Auth ID
  profile_id uuid,    -- Profile ID (for content matching)
  email text,
  nickname text,
  avatar_url text,
  is_admin boolean,
  banned_until timestamptz,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  total_count bigint,
  received_reports_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  offset_val int;
  total_rows bigint;
BEGIN
  IF NOT authorize_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  offset_val := (page - 1) * per_page;

  SELECT COUNT(*) INTO total_rows
  FROM auth.users au
  JOIN public.profiles pp ON au.id = pp.user_id
  WHERE 
    (search_term = '' OR au.email ILIKE '%' || search_term || '%' OR pp.nickname ILIKE '%' || search_term || '%')
    AND
    (filter_role = 'All' OR (filter_role = 'Admin' AND pp.is_admin = true) OR (filter_role = 'User' AND pp.is_admin = false))
    AND
    (filter_status = 'All' 
      OR (filter_status = 'Active' AND (pp.banned_until IS NULL OR pp.banned_until < now()))
      OR (filter_status = 'Banned' AND pp.banned_until > now())
    );

  RETURN QUERY
  SELECT 
    au.id,
    pp.id as profile_id,
    au.email::text,
    pp.nickname::text,
    pp.avatar_url::text,
    pp.is_admin,
    pp.banned_until,
    au.created_at,
    au.last_sign_in_at,
    total_rows,
    (
      SELECT count(DISTINCT r.id)
      FROM public.reports r
      WHERE 
        (r.target_type = 'user' AND (r.target_id = au.id OR r.target_id = pp.id))
        OR
        (r.target_type = 'tweet' AND r.target_id IN (SELECT t.id FROM public.tweets t WHERE t.author_id = pp.id OR t.author_id = au.id))
        OR
        (r.target_type = 'reply' AND r.target_id IN (SELECT tr.id FROM public.tweet_replies tr WHERE tr.author_id = pp.id OR tr.author_id = au.id))
        OR
        (r.target_type = 'chat' AND r.target_id IN (SELECT c.id FROM public.direct_chats c WHERE (c.user1_id = pp.id OR c.user2_id = pp.id) AND r.reporter_id != pp.id))
    ) as received_reports_count
  FROM auth.users au
  JOIN public.profiles pp ON au.id = pp.user_id
  WHERE 
    (search_term = '' OR au.email ILIKE '%' || search_term || '%' OR pp.nickname ILIKE '%' || search_term || '%')
    AND
    (filter_role = 'All' OR (filter_role = 'Admin' AND pp.is_admin = true) OR (filter_role = 'User' AND pp.is_admin = false))
    AND
    (filter_status = 'All' 
      OR (filter_status = 'Active' AND (pp.banned_until IS NULL OR pp.banned_until < now()))
      OR (filter_status = 'Banned' AND pp.banned_until > now())
    )
  ORDER BY au.created_at DESC
  LIMIT per_page OFFSET offset_val;
END;
$$;

-- 2. get_user_sanction_history_v2 (Fix ambiguous target_user_id)
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
     OR sh.target_user_id IN (SELECT user_id FROM public.profiles WHERE public.profiles.id = p_target_user_id)
     OR sh.target_user_id IN (SELECT public.profiles.id FROM public.profiles WHERE user_id = p_target_user_id)
  ORDER BY sh.created_at DESC;
END;
$$;

-- Ensure execute permissions
GRANT EXECUTE ON FUNCTION public.get_admin_users_list(int, int, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_users_list(int, int, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_sanction_history_v2(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_sanction_history_v2(uuid) TO service_role;
