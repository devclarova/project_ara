-- Enhancement for Admin Meta Data & Audit
-- V2: Includes received_reports_count and expanded history

-- 1. Update get_admin_users_list to include report count
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
  -- Check Admin Permission
  IF NOT authorize_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  offset_val := (page - 1) * per_page;

  -- Get Total Count efficiently
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
    (SELECT COUNT(*) FROM public.reports r WHERE r.target_user_id = au.id OR r.target_id = pp.id OR r.target_id = au.id) as received_reports_count
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

-- 2. get_user_sanction_history_v2
CREATE OR REPLACE FUNCTION public.get_user_sanction_history_v2(target_user_id uuid)
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
AS $$
BEGIN
  IF NOT authorize_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
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
  WHERE sh.target_user_id = target_user_id
     OR sh.target_user_id IN (SELECT user_id FROM public.profiles WHERE id = target_user_id)
     OR sh.target_user_id IN (SELECT id FROM public.profiles WHERE user_id = target_user_id)
  ORDER BY sh.created_at DESC;
END;
$$;

-- 3. get_user_activity_summary (Tweets and Replies count + list)
-- Note: Simplified version for modal. Detailed list can be fetched via standard Supabase queries if needed,
-- but we'll provide a count helper.
CREATE OR REPLACE FUNCTION public.get_user_activity_counts(target_uid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    res json;
    p_id uuid;
BEGIN
    SELECT id INTO p_id FROM public.profiles WHERE user_id = target_uid OR id = target_uid LIMIT 1;

    SELECT json_build_object(
        'tweets_count', (SELECT count(*) FROM public.tweets WHERE author_id = p_id),
        'replies_count', (SELECT count(*) FROM public.tweet_replies WHERE author_id = p_id),
        'chats_count', (SELECT count(*) FROM public.direct_chats WHERE user1_id = p_id OR user2_id = p_id)
    ) INTO res;

    RETURN res;
END;
$$;

-- 4. Secure RPC to fetch chat messages for Admin audit
CREATE OR REPLACE FUNCTION public.get_admin_chat_messages(p_chat_id uuid)
RETURNS SETOF public.direct_messages
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT authorize_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT * FROM public.direct_messages
  WHERE chat_id = p_chat_id
  ORDER BY created_at ASC;
END;
$$;
