-- [NEW] 20260216 Admin Analytics v2 RPC
-- Provides comprehensive statistics for the Admin Analytics page in one call.

CREATE OR REPLACE FUNCTION public.get_admin_analytics_v2(p_days int DEFAULT 30)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_total_users BIGINT;
    v_new_users_7d BIGINT;
    v_active_users_5m BIGINT;
    v_post_count BIGINT;
    v_comment_count BIGINT;
    v_total_revenue DECIMAL(15,2);
    v_conversion_rate DECIMAL(5,2);
    
    v_daily_activity JSON;
    v_geo_data JSON;
    v_acquisition_funnel JSON;
    v_retention_cohorts JSON;
    v_system_health JSON;
    
    v_result JSON;
BEGIN
    -- 1. Authorization check
    IF NOT authorize_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- 2. Basic Counters
    SELECT COUNT(*) INTO v_total_users FROM public.profiles;
    SELECT COUNT(*) INTO v_new_users_7d FROM auth.users WHERE created_at >= now() - interval '7 days';
    SELECT COUNT(*) INTO v_active_users_5m FROM public.profiles WHERE is_online = true OR last_active_at >= now() - interval '5 minutes';
    SELECT COUNT(*) INTO v_post_count FROM public.tweets;
    SELECT COUNT(*) INTO v_comment_count FROM public.tweet_replies;
    
    -- 3. Revenue & Conversion
    SELECT COALESCE(SUM(total_amount), 0) INTO v_total_revenue FROM public.orders WHERE status = 'completed';
    
    WITH buyers AS (
        SELECT COUNT(DISTINCT user_id) as buyer_count FROM public.orders WHERE status = 'completed'
    )
    SELECT 
        CASE WHEN v_total_users > 0 
             THEN (buyer_count::decimal / v_total_users) * 100 
             ELSE 0 
        END INTO v_conversion_rate
    FROM buyers;

    -- 4. Daily Trends (Signups, Posts, Comments)
    SELECT json_agg(t) INTO v_daily_activity
    FROM (
        SELECT 
            d::date as date,
            (SELECT COUNT(*) FROM auth.users u WHERE u.created_at::date = d::date) as signups,
            (SELECT COUNT(*) FROM public.tweets tw WHERE tw.created_at::date = d::date) as posts,
            (SELECT COUNT(*) FROM public.tweet_replies tr WHERE tr.created_at::date = d::date) as comments
        FROM generate_series(now()::date - (p_days - 1) * interval '1 day', now()::date, '1 day'::interval) d
        ORDER BY d ASC
    ) t;

    -- 5. Geo Distribution (All users by country)
    SELECT json_agg(g) INTO v_geo_data
    FROM (
        SELECT 
            COALESCE(c.iso_code, p.last_known_country, p.country) as country,
            COALESCE(
              (SELECT cc.name FROM public.countries cc WHERE cc.id::text = p.last_known_country OR cc.iso_code = p.last_known_country LIMIT 1),
              (SELECT cc.name FROM public.countries cc WHERE cc.id::text = p.country OR cc.iso_code = p.country LIMIT 1),
              CASE 
                WHEN p.last_known_country = 'Unknown' OR p.country = 'Unknown' THEN '알 수 없음' 
                ELSE COALESCE(p.last_known_country, p.country) 
              END
            ) as country_name,
            COUNT(*) as count,
            COUNT(*) FILTER (WHERE p.is_online = true OR p.last_active_at >= now() - interval '5 minutes') as online_count
        FROM public.profiles p
        LEFT JOIN public.countries c ON (c.id::text = COALESCE(p.last_known_country, p.country) OR c.iso_code = COALESCE(p.last_known_country, p.country))
        WHERE (p.country IS NOT NULL AND p.country != '') OR (p.last_known_country IS NOT NULL AND p.last_known_country != '')
        GROUP BY COALESCE(c.iso_code, p.last_known_country, p.country), p.last_known_country, p.country
        ORDER BY count DESC
        LIMIT 50
    ) g;

    -- 6. Acquisition Funnel (Simplified)
    -- Steps: Total Profiles -> Completed Profile (has nickname) -> Created Content
    SELECT json_build_object(
        'visitors', v_total_users,
        'onboarded', (SELECT COUNT(*) FROM public.profiles WHERE nickname IS NOT NULL),
        'active_creators', (SELECT COUNT(DISTINCT author_id) FROM public.tweets)
    ) INTO v_acquisition_funnel;

    -- 7. Retention Cohorts (Monthly)
    -- This is a simplified cohort analysis based on signup month and current activity status
    SELECT json_agg(c) INTO v_retention_cohorts
    FROM (
        SELECT 
            to_char(created_at, 'YYYY-MM') as cohort,
            COUNT(*) as size,
            COUNT(*) FILTER (WHERE last_active_at >= created_at + interval '1 day') as d1,
            COUNT(*) FILTER (WHERE last_active_at >= created_at + interval '7 days') as d7,
            COUNT(*) FILTER (WHERE last_active_at >= created_at + interval '30 days') as d30
        FROM public.profiles
        GROUP BY 1
        ORDER BY 1 DESC
        LIMIT 6
    ) c;

    -- 8. System Health (Dummy for now, can be expanded with logs)
    v_system_health := json_build_object(
        'api_latency', 142,
        'db_status', 'stable',
        'cache_hit_rate', 88.4
    );

    -- 9. Assemble Final Result
    v_result := json_build_object(
        'summary', json_build_object(
            'total_users', v_total_users,
            'new_users_7d', v_new_users_7d,
            'active_users_5m', v_active_users_5m,
            'post_count', v_post_count,
            'comment_count', v_comment_count,
            'total_revenue', v_total_revenue,
            'conversion_rate', v_conversion_rate
        ),
        'daily_activity', v_daily_activity,
        'geo_data', v_geo_data,
        'funnel', v_acquisition_funnel,
        'cohorts', v_retention_cohorts,
        'health', v_system_health
    );

    RETURN v_result;
END;
$$;
