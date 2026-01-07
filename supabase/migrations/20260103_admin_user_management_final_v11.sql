-- [FIX] Unified Admin Fixes V11: Deleted Stats + Ambiguity Fix + Aggregate Stats
-- 1. get_admin_users_list: Added global_deleted_count, fixed is_admin ambiguity

-- DROP EXISTING
DROP FUNCTION IF EXISTS public.get_admin_users_list(int, int, text, text, text, text, text, text, text, text, text);

-- 1. Enhanced User List with Full Global Stats
CREATE OR REPLACE FUNCTION public.get_admin_users_list(
  page int DEFAULT 1,
  per_page int DEFAULT 10,
  search_term text DEFAULT '',
  filter_role text DEFAULT 'All',
  filter_status text DEFAULT 'All',
  filter_gender text DEFAULT 'All',
  filter_online text DEFAULT 'All',
  filter_country text DEFAULT 'All',
  filter_birthday text DEFAULT 'All',
  filter_created_at text DEFAULT 'All',
  sort_by text DEFAULT 'last_active_desc'
)
RETURNS TABLE (
  id uuid,
  profile_id uuid,
  email text,
  nickname text,
  avatar_url text,
  is_admin boolean,
  banned_until timestamptz,
  country text,
  gender text,
  birthday text,
  is_online boolean,
  last_active_at timestamptz,
  bio text,
  location text,
  followers_count int,
  following_count int,
  banner_url text,
  country_name text,
  country_flag_url text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  total_count bigint,
  received_reports_count bigint,
  -- Global Stats
  global_admin_count bigint,
  global_banned_count bigint,
  global_online_count bigint,
  global_reported_user_count bigint,
  global_new_user_count bigint,
  global_deleted_count bigint -- Added for Recently Deleted (Last 1 Week)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  offset_val int := (page - 1) * per_page;
  total_rows bigint;
  v_admin_count bigint;
  v_banned_count bigint;
  v_online_count bigint;
  v_reported_count bigint;
  v_new_user_count bigint;
  v_deleted_count bigint;
BEGIN
  IF NOT authorize_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Calculate Filtered Total
  SELECT COUNT(*) INTO total_rows
  FROM auth.users au
  JOIN public.profiles pp ON au.id = pp.user_id
  WHERE 
    (search_term = '' OR au.email ILIKE '%' || search_term || '%' OR pp.nickname ILIKE '%' || search_term || '%')
    AND (filter_role = 'All' OR (filter_role = 'Admin' AND pp.is_admin = true) OR (filter_role = 'User' AND pp.is_admin = false))
    AND (filter_status = 'All' 
      OR (filter_status = 'Active' AND (pp.banned_until IS NULL OR pp.banned_until < now()))
      OR (filter_status = 'Banned' AND pp.banned_until > now()))
    AND (filter_gender = 'All' OR pp.gender::text = filter_gender)
    AND (filter_online = 'All' OR (filter_online = 'Online' AND pp.is_online = true) OR (filter_online = 'Offline' AND pp.is_online = false))
    AND (filter_country = 'All' OR pp.country::text = filter_country)
    AND (
      filter_birthday = 'All' 
      OR (filter_birthday = '2000s' AND pp.birthday >= '2000-01-01')
      OR (filter_birthday = '1990s' AND pp.birthday >= '1990-01-01' AND pp.birthday < '2000-01-01')
      OR (filter_birthday = '1980s' AND pp.birthday >= '1980-01-01' AND pp.birthday < '1990-01-01')
      OR (filter_birthday = '1970s' AND pp.birthday < '1980-01-01')
    )
    AND (
      filter_created_at = 'All'
      OR (filter_created_at = 'Today' AND au.created_at >= now() - interval '1 day')
      OR (filter_created_at = 'Week' AND au.created_at >= now() - interval '7 days')
      OR (filter_created_at = 'Month' AND au.created_at >= now() - interval '30 days')
      OR (filter_created_at = 'Year' AND au.created_at >= now() - interval '1 year')
    );

  -- Calculate Global Aggregate Stats (Qualify columns to avoid ambiguity with RETURN TABLE columns)
  SELECT COUNT(*) INTO v_admin_count FROM public.profiles p WHERE p.is_admin = true;
  SELECT COUNT(*) INTO v_banned_count FROM public.profiles p WHERE p.banned_until > now();
  SELECT COUNT(*) INTO v_online_count FROM public.profiles p WHERE p.is_online = true;
  SELECT COUNT(*) INTO v_new_user_count FROM auth.users u WHERE u.created_at >= now() - interval '7 days';
  SELECT COUNT(*) INTO v_deleted_count FROM public.profiles p WHERE p.deleted_at >= now() - interval '7 days';
  
  -- Reported User Count
  SELECT COUNT(DISTINCT r.target_id) INTO v_reported_count 
  FROM public.reports r 
  WHERE r.target_type = 'user';

  RETURN QUERY
  WITH user_report_counts AS (
    SELECT 
      pp_inner.id as pid,
      (
        SELECT count(DISTINCT report_inner.id)
        FROM public.reports report_inner
        WHERE 
          (report_inner.target_type = 'user' AND (report_inner.target_id = au_inner.id OR report_inner.target_id = pp_inner.id))
          OR
          (report_inner.target_type = 'tweet' AND report_inner.target_id IN (SELECT tweet_inner.id FROM public.tweets tweet_inner WHERE tweet_inner.author_id = pp_inner.id))
          OR
          (report_inner.target_type = 'reply' AND report_inner.target_id IN (SELECT reply_inner.id FROM public.tweet_replies reply_inner WHERE reply_inner.author_id = pp_inner.id))
          OR
          (report_inner.target_type = 'chat' AND report_inner.target_id IN (SELECT chat_inner.id FROM public.direct_chats chat_inner WHERE (chat_inner.user1_id = pp_inner.id OR chat_inner.user2_id = pp_inner.id) AND report_inner.reporter_id != pp_inner.id))
      ) as r_count
    FROM auth.users au_inner
    JOIN public.profiles pp_inner ON au_inner.id = pp_inner.user_id
  )
  SELECT 
    au.id, pp.id as profile_id, au.email::text, pp.nickname::text, pp.avatar_url::text,
    pp.is_admin, pp.banned_until, pp.country::text, pp.gender::text, pp.birthday::text,
    pp.is_online, pp.last_active_at, pp.bio::text, pp.location::text,
    pp.followers_count::int, pp.following_count::int, pp.banner_url::text,
    (SELECT c.name::text FROM public.countries c WHERE c.id::text = pp.country OR c.iso_code = pp.country LIMIT 1),
    (SELECT c.flag_url::text FROM public.countries c WHERE c.id::text = pp.country OR c.iso_code = pp.country LIMIT 1),
    au.created_at, pp.last_sign_in_at, total_rows,
    urc.r_count,
    v_admin_count, v_banned_count, v_online_count, v_reported_count, v_new_user_count, v_deleted_count
  FROM auth.users au
  JOIN public.profiles pp ON au.id = pp.user_id
  JOIN user_report_counts urc ON urc.pid = pp.id
  WHERE 
    (search_term = '' OR au.email ILIKE '%' || search_term || '%' OR pp.nickname ILIKE '%' || search_term || '%')
    AND (filter_role = 'All' OR (filter_role = 'Admin' AND pp.is_admin = true) OR (filter_role = 'User' AND pp.is_admin = false))
    AND (filter_status = 'All' 
      OR (filter_status = 'Active' AND (pp.banned_until IS NULL OR pp.banned_until < now()))
      OR (filter_status = 'Banned' AND pp.banned_until > now()))
    AND (filter_gender = 'All' OR pp.gender::text = filter_gender)
    AND (filter_online = 'All' OR (filter_online = 'Online' AND pp.is_online = true) OR (filter_online = 'Offline' AND pp.is_online = false))
    AND (filter_country = 'All' OR pp.country::text = filter_country)
    AND (
      filter_birthday = 'All' 
      OR (filter_birthday = '2000s' AND pp.birthday >= '2000-01-01')
      OR (filter_birthday = '1990s' AND pp.birthday >= '1990-01-01' AND pp.birthday < '2000-01-01')
      OR (filter_birthday = '1980s' AND pp.birthday >= '1980-01-01' AND pp.birthday < '1990-01-01')
      OR (filter_birthday = '1970s' AND pp.birthday < '1980-01-01')
    )
    AND (
      filter_created_at = 'All'
      OR (filter_created_at = 'Today' AND au.created_at >= now() - interval '1 day')
      OR (filter_created_at = 'Week' AND au.created_at >= now() - interval '7 days')
      OR (filter_created_at = 'Month' AND au.created_at >= now() - interval '30 days')
      OR (filter_created_at = 'Year' AND au.created_at >= now() - interval '1 year')
    )
  ORDER BY 
    CASE WHEN sort_by = 'last_active_desc' THEN pp.last_active_at END DESC NULLS LAST,
    CASE WHEN sort_by = 'created_at_desc' THEN au.created_at END DESC,
    CASE WHEN sort_by = 'nickname_asc' THEN pp.nickname END ASC,
    CASE WHEN sort_by = 'reports_desc' THEN urc.r_count END DESC
  LIMIT per_page OFFSET offset_val;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_users_list TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_users_list TO service_role;
