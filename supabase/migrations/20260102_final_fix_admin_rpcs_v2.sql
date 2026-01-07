-- [FINAL FIX V2] Fix column reference error in get_admin_users_list
-- reports 테이블에 target_user_id가 없으므로 관련 쿼리를 수정합니다.

DROP FUNCTION IF EXISTS public.get_admin_users_list(int, int, text, text, text);

CREATE OR REPLACE FUNCTION public.get_admin_users_list(
  page int DEFAULT 1,
  per_page int DEFAULT 10,
  search_term text DEFAULT '',
  filter_role text DEFAULT 'All',
  filter_status text DEFAULT 'All'
)
RETURNS TABLE (
  id uuid,
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

-- Ensure execute permissions
GRANT EXECUTE ON FUNCTION public.get_admin_users_list(int, int, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_users_list(int, int, text, text, text) TO service_role;
