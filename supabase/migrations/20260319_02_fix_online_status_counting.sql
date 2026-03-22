-- [BUGFIX] Fix Zombie Online Sessions Counting (5-minute threshold)
-- Explanation: Users whose browsers fail to send 'beforeunload' events or lose network connection
-- leave their `is_online` status permanently stuck at `true` in the database.
-- This migration updates the dashboard and user list RPCs to enforce a 5-minute activity window.

-- 1. Update `get_admin_dashboard_stats` RPC to enforce 5-minute activity threshold
DROP FUNCTION IF EXISTS public.get_admin_dashboard_stats();

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_total_users BIGINT;
    v_online_users BIGINT;
    v_admin_count BIGINT;
    v_banned_count BIGINT;
    v_new_users_7d_current BIGINT;
    v_new_users_7d_prev BIGINT;
    v_pending_reports BIGINT;
    
    -- Revenue
    v_total_rev_current DECIMAL(15,2);
    v_sub_rev_current DECIMAL(15,2);
    v_shop_rev_current DECIMAL(15,2);

    -- Changes
    v_user_change_pct NUMERIC;

    v_daily_trends JSON;
    v_recent_users JSON;
    v_result JSON;
BEGIN
    -- [SECURITY] Re-verify Admin Permission
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.user_id = auth.uid() AND p.is_admin = true
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;

    -- 1. Basic User Stats (WITH 5-MINUTE ZOMBIE FIX)
    SELECT COUNT(*) INTO v_total_users FROM public.profiles;
    SELECT COUNT(*) INTO v_online_users FROM public.profiles WHERE is_online = true AND last_active_at >= now() - interval '5 minutes';
    SELECT COUNT(*) INTO v_admin_count FROM public.profiles WHERE is_admin = true;
    SELECT COUNT(*) INTO v_banned_count FROM public.profiles WHERE banned_until > now();
    
    -- 2. New Users Comparison
    SELECT COUNT(*) INTO v_new_users_7d_current 
    FROM auth.users 
    WHERE created_at >= (now() - interval '7 days');
    
    SELECT COUNT(*) INTO v_new_users_7d_prev 
    FROM auth.users 
    WHERE created_at < (now() - interval '7 days') 
      AND created_at >= (now() - interval '14 days');
    
    -- Growth Calculation (Safe division)
    IF v_new_users_7d_current = 0 THEN
        v_user_change_pct := 0;
    ELSIF v_new_users_7d_prev > 0 THEN
        v_user_change_pct := ((v_new_users_7d_current::decimal - v_new_users_7d_prev::decimal) / v_new_users_7d_prev::decimal) * 100.0;
    ELSE
        v_user_change_pct := 100.0;
    END IF;

    -- 3. Pending Reports
    SELECT COUNT(*) INTO v_pending_reports 
    FROM public.reports 
    WHERE status = 'pending' OR status IS NULL;

    -- 4. Revenue Stats (Safe aggregation)
    SELECT COALESCE(SUM(total_amount), 0) INTO v_total_rev_current FROM public.orders WHERE status = 'completed';
    SELECT COALESCE(SUM(total_amount), 0) INTO v_sub_rev_current FROM public.orders WHERE status = 'completed' AND type = 'subscription';
    SELECT COALESCE(SUM(total_amount), 0) INTO v_shop_rev_current FROM public.orders WHERE status = 'completed' AND type = 'one_time';

    -- 5. Daily Signup Trends (Robust series generation)
    SELECT json_agg(t) INTO v_daily_trends
    FROM (
        SELECT 
            d.series_date::date as date,
            (SELECT COUNT(*) FROM auth.users u WHERE u.created_at::date = d.series_date::date) as count
        FROM (
            SELECT generate_series(
                (current_date - interval '6 days')::date, 
                current_date::date, 
                '1 day'::interval
            )::date as series_date
        ) d
        ORDER BY d.series_date ASC
    ) t;

    -- 6. Recent Users (Complete Profile Info, fixing country lookup stability)
    SELECT json_agg(r) INTO v_recent_users
    FROM (
        SELECT 
            au.id,
            p.id as profile_id,
            p.nickname,
            p.avatar_url,
            p.banner_url,
            au.email,
            p.is_admin,
            p.is_online,
            p.last_active_at,
            au.last_sign_in_at,
            au.created_at,
            p.bio,
            p.location,
            p.gender,
            p.birthday,
            p.banned_until,
            COALESCE((SELECT COUNT(*) FROM public.user_follows f WHERE f.following_id = p.id AND f.ended_at IS NULL), 0)::int as followers_count,
            COALESCE((SELECT COUNT(*) FROM public.user_follows f WHERE f.follower_id = p.id AND f.ended_at IS NULL), 0)::int as following_count,
            p.country,
            COALESCE((SELECT c.name::text FROM public.countries c WHERE c.id::text = p.country::text OR c.iso_code = p.country::text LIMIT 1), 'Unknown') as country_name,
            COALESCE((SELECT c.flag_url::text FROM public.countries c WHERE c.id::text = p.country::text OR c.iso_code = p.country::text LIMIT 1), null) as country_flag_url
        FROM public.profiles p
        JOIN auth.users au ON p.user_id = au.id
        WHERE p.last_active_at IS NOT NULL
        ORDER BY p.last_active_at DESC
        LIMIT 5
    ) r;

    -- [FINAL] Build Result (Coalesce all JSON fields)
    v_result := json_build_object(
        'total_users', COALESCE(v_total_users, 0),
        'online_users', COALESCE(v_online_users, 0),
        'admin_count', COALESCE(v_admin_count, 0),
        'banned_count', COALESCE(v_banned_count, 0),
        'new_users_7d', COALESCE(v_new_users_7d_current, 0),
        'user_growth_pct', ROUND(COALESCE(v_user_change_pct, 0.0), 1),
        'pending_reports', COALESCE(v_pending_reports, 0),
        'total_revenue', COALESCE(v_total_rev_current, 0),
        'subscription_revenue', COALESCE(v_sub_rev_current, 0),
        'shop_revenue', COALESCE(v_shop_rev_current, 0),
        'daily_trends', COALESCE(v_daily_trends, '[]'::json),
        'recent_users', COALESCE(v_recent_users, '[]'::json)
    );

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO service_role;


-- 2. Update `get_admin_users_list` RPC to also enforce 5-minute activity threshold
DROP FUNCTION IF EXISTS public.get_admin_users_list(int, int, text, text, text, text, text, text, text, text, text, text);

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

  -- Calculate Global Aggregate Stats (WITH 5-MINUTE ZOMBIE FIX)
  SELECT COUNT(*) INTO v_admin_count FROM public.profiles p WHERE p.is_admin = true;
  SELECT COUNT(*) INTO v_banned_count FROM public.profiles p WHERE p.banned_until > now();
  SELECT COUNT(*) INTO v_online_count FROM public.profiles p WHERE p.is_online = true AND p.last_active_at >= now() - interval '5 minutes';
  SELECT COUNT(*) INTO v_new_user_count FROM auth.users u WHERE u.created_at >= now() - interval '7 days';
  SELECT COUNT(*) INTO v_deleted_count FROM public.profiles p WHERE p.deleted_at >= now() - interval '7 days';
  
  -- Improved Global Reported User Count
  SELECT COUNT(DISTINCT reported_uid) INTO v_reported_count
  FROM (
      SELECT r.target_id as reported_uid FROM public.reports r WHERE r.target_type = 'user'
      UNION
      SELECT t.author_id as reported_uid FROM public.reports r JOIN public.tweets t ON r.target_id = t.id WHERE r.target_type = 'tweet'
      UNION
      SELECT tr.author_id as reported_uid FROM public.reports r JOIN public.tweet_replies tr ON r.target_id = tr.id WHERE r.target_type = 'reply'
      UNION
      SELECT 
        CASE 
          WHEN dc.user1_id = r.reporter_id OR dc.user1_id IN (SELECT p_rep.user_id FROM public.profiles p_rep WHERE p_rep.id = r.reporter_id) THEN dc.user2_id 
          ELSE dc.user1_id 
        END as reported_uid
      FROM public.reports r 
      JOIN public.direct_chats dc ON r.target_id = dc.id 
      WHERE r.target_type = 'chat'
  ) AS sub;

  -- Calculate Filtered Total (WITH 5-MINUTE ZOMBIE FIX in Online Filter)
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
    AND (filter_online = 'All' 
      OR (filter_online = 'Online' AND pp.is_online = true AND pp.last_active_at >= now() - interval '5 minutes') 
      OR (filter_online = 'Offline' AND (pp.is_online = false OR pp.last_active_at < now() - interval '5 minutes' OR pp.last_active_at IS NULL)))
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
          (report_inner.target_type = 'chat' AND report_inner.target_id IN (SELECT chat_inner.id FROM public.direct_chats chat_inner WHERE (chat_inner.user1_id = pp_inner.id OR chat_inner.user2_id = pp_inner.id) AND report_inner.reporter_id != pp_inner.id AND report_inner.reporter_id NOT IN (SELECT pp_reporter.user_id FROM public.profiles pp_reporter WHERE pp_reporter.id = pp_inner.id)))
      ) as r_count
    FROM auth.users au_inner
    JOIN public.profiles pp_inner ON au_inner.id = pp_inner.user_id
  )
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
    AND (filter_online = 'All' 
      OR (filter_online = 'Online' AND pp.is_online = true AND pp.last_active_at >= now() - interval '5 minutes') 
      OR (filter_online = 'Offline' AND (pp.is_online = false OR pp.last_active_at < now() - interval '5 minutes' OR pp.last_active_at IS NULL)))
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
    CASE WHEN sort_by = 'nickname_asc' THEN pp.nickname END ASC,
    CASE WHEN sort_by = 'reports_desc' THEN urc.r_count END DESC
  LIMIT per_page OFFSET offset_val;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_users_list(int, int, text, text, text, text, text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_users_list(int, int, text, text, text, text, text, text, text, text, text, text) TO service_role;

-- 3. Cleanup: For hygiene, gracefully mark obvious zombies as offline to keep DB clean
UPDATE public.profiles
SET is_online = false
WHERE is_online = true AND last_active_at < now() - interval '5 minutes';
