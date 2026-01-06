-- [NEW] Admin Dashboard Analytics & Shop Schema (v2 with Growth Rates)
-- 1. Create Tables (if not exists)
-- 2. Create get_admin_dashboard_stats RPC with Comparison Logic

-- 1. Create Tables
CREATE TABLE IF NOT EXISTS public.goods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT,
    price DECIMAL(12,2) NOT NULL DEFAULT 0,
    sale_price DECIMAL(12,2) DEFAULT 0,
    stock INT DEFAULT 0,
    status TEXT DEFAULT 'active',
    type TEXT DEFAULT 'one_time',
    image_url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'completed',
    type TEXT DEFAULT 'one_time',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.goods(id),
    quantity INT NOT NULL DEFAULT 1,
    price_at_purchase DECIMAL(12,2) NOT NULL
);

-- Enable RLS
ALTER TABLE public.goods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Policies (Consolidated)
DROP POLICY IF EXISTS "Anyone can view active goods" ON public.goods;
DROP POLICY IF EXISTS "Admins can manage goods" ON public.goods;
CREATE POLICY "Anyone can view active goods" ON public.goods FOR SELECT USING (status = 'active');
CREATE POLICY "Admins can manage goods" ON public.goods FOR ALL USING (authorize_admin());

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (authorize_admin());

-- 2. get_admin_dashboard_stats RPC
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_total_users BIGINT;
    v_online_users BIGINT;
    v_new_users_7d_current BIGINT;
    v_new_users_7d_prev BIGINT;
    v_pending_reports BIGINT;
    
    -- Revenue
    v_total_rev_current DECIMAL(15,2);
    v_total_rev_prev_7d DECIMAL(15,2);
    v_sub_rev_current DECIMAL(15,2);
    v_sub_rev_prev_7d DECIMAL(15,2);
    v_shop_rev_current DECIMAL(15,2);
    v_shop_rev_prev_7d DECIMAL(15,2);

    -- Changes
    v_user_change_pct DECIMAL(5,2);
    v_rev_change_pct JSON; -- { total, sub, shop }

    v_daily_trends JSON;
    v_recent_users JSON;
    v_result JSON;
BEGIN
    IF NOT authorize_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- User Stats
    SELECT COUNT(*) INTO v_total_users FROM public.profiles;
    SELECT COUNT(*) INTO v_online_users FROM public.profiles WHERE is_online = true;
    
    -- New Users Comparison (Last 7d vs Period before that)
    SELECT COUNT(*) INTO v_new_users_7d_current FROM auth.users WHERE created_at >= now() - interval '7 days';
    SELECT COUNT(*) INTO v_new_users_7d_prev FROM auth.users WHERE created_at < now() - interval '7 days' AND created_at >= now() - interval '14 days';
    
    -- Improved growth logic: 0% if no current signups, otherwise calculate vs previous
    IF v_new_users_7d_current = 0 THEN
        v_user_change_pct := 0;
    ELSIF v_new_users_7d_prev > 0 THEN
        v_user_change_pct := ((v_new_users_7d_current::decimal - v_new_users_7d_prev) / v_new_users_7d_prev) * 100;
    ELSE
        v_user_change_pct := 100.0;
    END IF;

    -- Pending Reports
    SELECT COUNT(*) INTO v_pending_reports FROM public.reports WHERE status = 'pending' OR status IS NULL;

    -- Revenue Stats
    SELECT COALESCE(SUM(total_amount), 0) INTO v_total_rev_current FROM public.orders WHERE status = 'completed';
    SELECT COALESCE(SUM(total_amount), 0) INTO v_sub_rev_current FROM public.orders WHERE status = 'completed' AND type = 'subscription';
    SELECT COALESCE(SUM(total_amount), 0) INTO v_shop_rev_current FROM public.orders WHERE status = 'completed' AND type = 'one_time';

    -- Daily Signup Trends (Last 7 days)
    SELECT json_agg(t) INTO v_daily_trends
    FROM (
        SELECT 
            d::date as date,
            (SELECT COUNT(*) FROM auth.users u WHERE u.created_at::date = d::date) as count
        FROM generate_series(now()::date - interval '6 days', now()::date, '1 day'::interval) d
        ORDER BY d ASC
    ) t;

    -- Recent Users (Complete Profile Info for Modal)
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
            (SELECT COUNT(*) FROM public.user_follows f WHERE f.following_id = p.id AND f.ended_at IS NULL)::int as followers_count,
            (SELECT COUNT(*) FROM public.user_follows f WHERE f.follower_id = p.id AND f.ended_at IS NULL)::int as following_count,
            p.country,
            (SELECT c.name::text FROM public.countries c WHERE c.id::text = p.country OR c.iso_code = p.country LIMIT 1) as country_name,
            (SELECT c.flag_url::text FROM public.countries c WHERE c.id::text = p.country OR c.iso_code = p.country LIMIT 1) as country_flag_url
        FROM public.profiles p
        JOIN auth.users au ON p.user_id = au.id
        WHERE p.last_active_at IS NOT NULL
        ORDER BY p.last_active_at DESC
        LIMIT 5
    ) r;

    -- Final Result
    v_result := json_build_object(
        'total_users', v_total_users,
        'online_users', v_online_users,
        'new_users_7d', v_new_users_7d_current,
        'user_growth_pct', v_user_change_pct,
        'pending_reports', v_pending_reports,
        'total_revenue', v_total_rev_current,
        'subscription_revenue', v_sub_rev_current,
        'shop_revenue', v_shop_rev_current,
        'daily_trends', v_daily_trends,
        'recent_users', v_recent_users
    );

    RETURN v_result;
END;
$$;
