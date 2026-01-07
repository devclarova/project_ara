-- [FIX] Unified Admin Fixes V13: International Age Filter + Accurate Reported Count + Fixes
-- 1. get_admin_users_list: Added international age filtering (만 나이), improved reported count
-- 2. get_user_sanction_history_v2: Fix parameter name to match frontend

-- DROP EXISTING
DROP FUNCTION IF EXISTS public.get_admin_users_list(int, int, text, text, text, text, text, text, text, text, text);

-- 1. Enhanced User List with Full Global Stats & Age Filter
CREATE OR REPLACE FUNCTION public.get_admin_users_list(
  page int DEFAULT 1,
  per_page int DEFAULT 10,
  search_term text DEFAULT '',
  filter_role text DEFAULT 'All',
  filter_status text DEFAULT 'All',
  filter_gender text DEFAULT 'All',
  filter_online text DEFAULT 'All',
  filter_country text DEFAULT 'All',
  filter_birthday text DEFAULT 'All', -- International Age Groups
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
  global_deleted_count bigint
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

  -- Calculate Filtered Total with International Age Logic
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
      OR (pp.birthday IS NOT NULL AND (
        CASE 
          WHEN filter_birthday = '10s' THEN date_part('year', age(now(), (pp.birthday || '-01')::date)) >= 10 AND date_part('year', age(now(), (pp.birthday || '-01')::date)) < 20
          WHEN filter_birthday = '20s' THEN date_part('year', age(now(), (pp.birthday || '-01')::date)) >= 20 AND date_part('year', age(now(), (pp.birthday || '-01')::date)) < 30
          WHEN filter_birthday = '30s' THEN date_part('year', age(now(), (pp.birthday || '-01')::date)) >= 30 AND date_part('year', age(now(), (pp.birthday || '-01')::date)) < 40
          WHEN filter_birthday = '40s' THEN date_part('year', age(now(), (pp.birthday || '-01')::date)) >= 40 AND date_part('year', age(now(), (pp.birthday || '-01')::date)) < 50
          WHEN filter_birthday = '50s' THEN date_part('year', age(now(), (pp.birthday || '-01')::date)) >= 50
          ELSE false
        END
      ))
    )
    AND (
      filter_created_at = 'All'
      OR (filter_created_at = 'Today' AND au.created_at >= now() - interval '1 day')
      OR (filter_created_at = 'Week' AND au.created_at >= now() - interval '7 days')
      OR (filter_created_at = 'Month' AND au.created_at >= now() - interval '30 days')
      OR (filter_created_at = 'Year' AND au.created_at >= now() - interval '1 year')
    );

  -- Calculate Global Aggregate Stats
  SELECT COUNT(*) INTO v_admin_count FROM public.profiles p WHERE p.is_admin = true;
  SELECT COUNT(*) INTO v_banned_count FROM public.profiles p WHERE p.banned_until > now();
  SELECT COUNT(*) INTO v_online_count FROM public.profiles p WHERE p.is_online = true;
  SELECT COUNT(*) INTO v_new_user_count FROM auth.users u WHERE u.created_at >= now() - interval '7 days';
  SELECT COUNT(*) INTO v_deleted_count FROM public.profiles p WHERE p.deleted_at >= now() - interval '7 days';
  
  -- Improved Reported User Count: Count users who have any content (user, tweet, reply, chat) reported
  SELECT COUNT(DISTINCT u_id) INTO v_reported_count
  FROM (
    -- Direct User reports
    SELECT p.id as u_id FROM public.reports r JOIN public.profiles p ON (r.target_id = p.id OR r.target_id = p.user_id) WHERE r.target_type = 'user'
    UNION
    -- Tweet reports
    SELECT t.author_id as u_id FROM public.reports r JOIN public.tweets t ON r.target_id = t.id WHERE r.target_type = 'tweet'
    UNION
    -- Reply reports
    SELECT tr.author_id as u_id FROM public.reports r JOIN public.tweet_replies tr ON r.target_id = tr.id WHERE r.target_type = 'reply'
  ) AS reported_content_authors;

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
      OR (pp.birthday IS NOT NULL AND (
        CASE 
          WHEN filter_birthday = '10s' THEN date_part('year', age(now(), (pp.birthday || '-01')::date)) >= 10 AND date_part('year', age(now(), (pp.birthday || '-01')::date)) < 20
          WHEN filter_birthday = '20s' THEN date_part('year', age(now(), (pp.birthday || '-01')::date)) >= 20 AND date_part('year', age(now(), (pp.birthday || '-01')::date)) < 30
          WHEN filter_birthday = '30s' THEN date_part('year', age(now(), (pp.birthday || '-01')::date)) >= 30 AND date_part('year', age(now(), (pp.birthday || '-01')::date)) < 40
          WHEN filter_birthday = '40s' THEN date_part('year', age(now(), (pp.birthday || '-01')::date)) >= 40 AND date_part('year', age(now(), (pp.birthday || '-01')::date)) < 50
          WHEN filter_birthday = '50s' THEN date_part('year', age(now(), (pp.birthday || '-01')::date)) >= 50
          ELSE false
        END
      ))
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

-- 2. get_user_sanction_history_v2 (Fix parameter name)
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
     OR sh.target_user_id IN (SELECT user_id FROM public.profiles WHERE id = p_target_user_id)
     OR sh.target_user_id IN (SELECT id FROM public.profiles WHERE user_id = p_target_user_id)
  ORDER BY sh.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_users_list TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_users_list TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_sanction_history_v2(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_sanction_history_v2(uuid) TO service_role;
