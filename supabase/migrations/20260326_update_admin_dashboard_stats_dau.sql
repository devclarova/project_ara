-- [ENHANCEMENT] 20260326 Update Admin Dashboard Stats with DAU (Daily Active Users)
-- Updates get_admin_dashboard_stats() to include both signup_count and active_user_count in daily_trends.

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
    v_bounce_rate NUMERIC;
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

    -- 5. Bounce Rate (Realistic: Users who leave within 30s without any action)
    -- Engagement = (Stayed > 30s) OR (created tweet/reply/order) in last 24h
    SELECT 
        CASE 
            WHEN COUNT(*) = 0 THEN 0
            ELSE ROUND((COUNT(*) FILTER (WHERE is_engaged = false)::decimal / COUNT(*)::decimal) * 100, 1)
        END INTO v_bounce_rate
    FROM (
        SELECT 
            u.user_id,
            (
                EXISTS (SELECT 1 FROM public.tweets tw WHERE tw.author_id = u.user_id AND tw.created_at >= now() - interval '24 hours')
                OR EXISTS (SELECT 1 FROM public.tweet_replies tr WHERE tr.author_id = u.user_id AND tr.created_at >= now() - interval '24 hours')
                OR EXISTS (SELECT 1 FROM public.orders o WHERE o.user_id = u.user_id AND o.created_at >= now() - interval '24 hours')
                OR (
                    -- Stayed for more than 30 seconds (Last activity - First landing today)
                    COALESCE(
                        (SELECT p.last_active_at FROM public.profiles p WHERE p.user_id = u.user_id),
                        u.min_created_at
                    ) - u.min_created_at > interval '3 minutes'
                )
            ) as is_engaged
        FROM (
            SELECT user_id, MIN(created_at) as min_created_at
            FROM public.traffic_logs 
            WHERE created_at >= now() - interval '24 hours'
            AND user_id IS NOT NULL
            GROUP BY user_id
        ) u
    ) AS session_analysis;

    -- 6. Daily Activity Trends (Combines Signups + DAU)
    -- DAU = Users who have traffic_logs OR created a tweet/reply OR made an order that day
    SELECT json_agg(t) INTO v_daily_trends
    FROM (
        SELECT 
            d.series_date::date as date,
            (SELECT COUNT(*) FROM auth.users u WHERE u.created_at::date = d.series_date::date) as signup_count,
            (
                SELECT COUNT(DISTINCT uid) FROM (
                    SELECT user_id as uid FROM public.traffic_logs tl WHERE tl.created_at::date = d.series_date::date
                    UNION
                    SELECT user_id as uid FROM public.profiles p WHERE p.created_at::date = d.series_date::date -- Include newly signed up users as active
                    UNION
                    SELECT author_id as uid FROM public.tweets tw WHERE tw.created_at::date = d.series_date::date
                    UNION
                    SELECT author_id as uid FROM public.tweet_replies tr WHERE tr.created_at::date = d.series_date::date
                    UNION
                    SELECT user_id as uid FROM public.orders o WHERE o.created_at::date = d.series_date::date
                ) AS activity
                WHERE uid IS NOT NULL
            ) as active_user_count
        FROM (
            SELECT generate_series(
                (current_date - interval '6 days')::date, 
                current_date::date, 
                '1 day'::interval
            )::date as series_date
        ) d
        ORDER BY d.series_date ASC
    ) t;

    -- 6. Recent Users
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
            COALESCE((SELECT c.name::text FROM public.countries c WHERE c.id::text = p.country OR c.iso_code = p.country LIMIT 1), 'Unknown') as country_name,
            COALESCE((SELECT c.flag_url::text FROM public.countries c WHERE c.id::text = p.country OR c.iso_code = p.country LIMIT 1), null) as country_flag_url
        FROM public.profiles p
        JOIN auth.users au ON p.user_id = au.id
        WHERE p.last_active_at IS NOT NULL
        ORDER BY p.last_active_at DESC
        LIMIT 5
    ) r;

    -- [FINAL] Build Result
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
        'recent_users', COALESCE(v_recent_users, '[]'::json),
        'bounce_rate', COALESCE(v_bounce_rate, 0)
    );

    RETURN v_result;
END;
$$;
