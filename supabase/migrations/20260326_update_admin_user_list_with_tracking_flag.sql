-- [OPTIMIZED] 20260326_update_admin_user_list_with_tracking_flag.sql
-- Adds is_tracked flag to get_admin_users_list to avoid client-side heavy fetching.

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
  sort_by text DEFAULT 'last_active_desc',
  filter_tracking text DEFAULT 'All'
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
  is_tracked boolean,  -- [NEW] Added is_tracked flag
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

  -- Global Aggregate Stats
  SELECT COUNT(*) INTO v_admin_count FROM public.profiles p WHERE p.is_admin = true;
  SELECT COUNT(*) INTO v_banned_count FROM public.profiles p WHERE p.banned_until > now();
  SELECT COUNT(*) INTO v_online_count FROM public.profiles p WHERE p.is_online = true;
  SELECT COUNT(*) INTO v_new_user_count FROM auth.users u WHERE u.created_at >= now() - interval '7 days';
  SELECT COUNT(*) INTO v_deleted_count FROM public.profiles p WHERE p.deleted_at >= now() - interval '7 days';
  
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
    AND (
      filter_tracking = 'All'
      OR (filter_tracking = 'Tracked' AND EXISTS (SELECT 1 FROM public.traffic_logs tl WHERE tl.user_id = au.id OR tl.user_id = pp.id LIMIT 1))
      OR (filter_tracking = 'Untracked' AND NOT EXISTS (SELECT 1 FROM public.traffic_logs tl WHERE tl.user_id = au.id OR tl.user_id = pp.id LIMIT 1))
    );

  RETURN QUERY
  SELECT 
    au.id, pp.id as profile_id, au.email::text, pp.nickname::text, pp.avatar_url::text,
    pp.is_admin, pp.banned_until, pp.country::text, pp.gender::text, pp.birthday::text,
    pp.is_online, pp.last_active_at, pp.bio::text, pp.location::text,
    (SELECT COUNT(*) FROM public.user_follows f WHERE f.following_id = pp.id AND f.ended_at IS NULL)::int as followers_count,
    (SELECT COUNT(*) FROM public.user_follows f WHERE f.follower_id = pp.id AND f.ended_at IS NULL)::int as following_count,
    pp.banner_url::text,
    (SELECT c.name::text FROM public.countries c WHERE c.id::text = pp.country OR c.iso_code = pp.country LIMIT 1),
    (SELECT c.flag_url::text FROM public.countries c WHERE c.id::text = pp.country OR c.iso_code = pp.country LIMIT 1),
    au.created_at, pp.last_sign_in_at, total_rows,
    (SELECT COUNT(*) FROM public.reports r WHERE r.target_id = pp.id OR r.target_id = au.id OR (r.target_type = 'tweet' AND r.target_id IN (SELECT t.id FROM public.tweets t WHERE t.author_id = pp.id))),
    -- [OPTIMIZED] Check if user is tracked efficiently
    EXISTS (SELECT 1 FROM public.traffic_logs tl WHERE tl.user_id = au.id OR tl.user_id = pp.id LIMIT 1),
    v_admin_count, v_banned_count, v_online_count, 0::bigint, v_new_user_count, v_deleted_count
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
    )
    AND (
      filter_tracking = 'All'
      OR (filter_tracking = 'Tracked' AND EXISTS (SELECT 1 FROM public.traffic_logs tl WHERE tl.user_id = au.id OR tl.user_id = pp.id LIMIT 1))
      OR (filter_tracking = 'Untracked' AND NOT EXISTS (SELECT 1 FROM public.traffic_logs tl WHERE tl.user_id = au.id OR tl.user_id = pp.id LIMIT 1))
    )
  ORDER BY 
    CASE WHEN sort_by = 'last_active_desc' THEN pp.last_active_at END DESC NULLS LAST,
    CASE WHEN sort_by = 'created_at_desc' THEN au.created_at END DESC,
    CASE WHEN sort_by = 'nickname_asc' THEN pp.nickname END ASC
  LIMIT per_page OFFSET offset_val;
END;
$$;
