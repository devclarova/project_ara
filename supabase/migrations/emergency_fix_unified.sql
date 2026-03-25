-- [CRITICAL FIX] 20260325_unified_admin_fix.sql
-- Run this in Supabase SQL Editor to resolve all 404/400 errors.

-- 1. Add is_hidden columns & Initialize Data
ALTER TABLE public.tweets ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;
ALTER TABLE public.tweet_replies ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;
ALTER TABLE public.direct_messages ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;

-- Ensure existing rows have a value (prevents filtering issues)
UPDATE public.tweets SET is_hidden = FALSE WHERE is_hidden IS NULL;
UPDATE public.tweet_replies SET is_hidden = FALSE WHERE is_hidden IS NULL;
UPDATE public.direct_messages SET is_hidden = FALSE WHERE is_hidden IS NULL;

-- 2. Create get_admin_moderation_content RPC (Fixes 404 / Missing columns error)
DROP FUNCTION IF EXISTS public.get_admin_moderation_content(text,text,integer,integer);

CREATE OR REPLACE FUNCTION public.get_admin_moderation_content(
    p_type TEXT,
    p_search TEXT DEFAULT '',
    p_page INTEGER DEFAULT 1,
    p_per_page INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    parent_id UUID,
    content TEXT,
    image_urls JSONB,
    created_at TIMESTAMPTZ,
    author_id UUID,
    nickname TEXT,
    avatar_url TEXT,
    email TEXT,
    content_type TEXT,
    is_hidden BOOLEAN,
    stats JSONB,
    total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_offset INTEGER := (p_page - 1) * p_per_page;
    v_total_count BIGINT;
BEGIN
    -- Authorization check
    IF NOT (SELECT is_admin FROM public.profiles WHERE user_id = auth.uid()) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Calculate total count
    IF p_type = 'post' THEN
        SELECT count(*) INTO v_total_count FROM public.tweets tw WHERE tw.content ILIKE '%' || p_search || '%';
        RETURN QUERY
        SELECT 
            t.id,
            NULL::UUID as parent_id,
            t.content::TEXT,
            to_jsonb(t.image_url) as image_urls,
            t.created_at,
            t.author_id,
            p.nickname::TEXT,
            p.avatar_url::TEXT,
            p.user_id::TEXT as email,
            'post'::TEXT as content_type,
            COALESCE(t.is_hidden, false) as is_hidden,
            jsonb_build_object('likes', t.like_count, 'replies', t.reply_count, 'views', t.view_count) as stats,
            v_total_count
        FROM public.tweets t
        JOIN public.profiles p ON t.author_id = p.id
        WHERE t.content ILIKE '%' || p_search || '%'
        ORDER BY t.created_at DESC
        LIMIT p_per_page OFFSET v_offset;
    
    ELSIF p_type = 'comment' THEN
        SELECT count(*) INTO v_total_count FROM public.tweet_replies tr_count WHERE tr_count.content ILIKE '%' || p_search || '%';
        RETURN QUERY
        SELECT 
            tr.id,
            tr.tweet_id as parent_id,
            tr.content::TEXT,
            NULL::JSONB as image_urls,
            tr.created_at,
            tr.author_id,
            p.nickname::TEXT,
            p.avatar_url::TEXT,
            p.user_id::TEXT as email,
            'comment'::TEXT as content_type,
            COALESCE(tr.is_hidden, false) as is_hidden,
            jsonb_build_object('likes', 0, 'replies', 0, 'views', 0) as stats,
            v_total_count
        FROM public.tweet_replies tr
        JOIN public.profiles p ON tr.author_id = p.id
        WHERE tr.content ILIKE '%' || p_search || '%'
        ORDER BY tr.created_at DESC
        LIMIT p_per_page OFFSET v_offset;
    END IF;
END;
$$;

-- 3. Create toggle_content_hidden RPC (Supports 'post' and 'tweet' interchangeably)
DROP FUNCTION IF EXISTS public.toggle_content_hidden(text,uuid,boolean);

CREATE OR REPLACE FUNCTION public.toggle_content_hidden(
    p_type TEXT,
    p_id UUID,
    p_hidden BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    -- 1. Strict Admin Verification
    SELECT is_admin INTO v_is_admin FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
    
    IF NOT COALESCE(v_is_admin, false) THEN
        RAISE EXCEPTION 'Access denied: User is not an admin (%)', auth.uid();
    END IF;

    -- 2. Execute Update based on type
    IF p_type IN ('post', 'tweet') THEN
        UPDATE public.tweets SET is_hidden = p_hidden WHERE id = p_id;
    ELSIF p_type IN ('comment', 'reply') THEN
        UPDATE public.tweet_replies SET is_hidden = p_hidden WHERE id = p_id;
    ELSIF p_type = 'message' THEN
        UPDATE public.direct_messages SET is_hidden = p_hidden WHERE id = p_id;
    ELSE
        RAISE EXCEPTION 'Invalid type: %', p_type;
    END IF;

    -- 3. Automatic Report Resolution
    UPDATE public.reports SET status = 'reviewed' 
    WHERE target_id = p_id AND status = 'pending';
    
    RAISE NOTICE 'Success: Updated % (%) to hidden=%', p_type, p_id, p_hidden;
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_content_hidden TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_content_hidden TO service_role;

-- 3. Create site_settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Insert initial settings
INSERT INTO public.site_settings (key, value, description)
VALUES 
    ('maintenance_mode', 'false'::jsonb, '사이트 점검 모드 여부'),
    ('global_notice', '{"text": "", "active": false}'::jsonb, '전역 공지사항 설정'),
    ('site_metadata', '{"title": "Project ARA", "description": "AI Learning Platform"}'::jsonb, '사이트 기본 메타데이터')
ON CONFLICT (key) DO NOTHING;

-- 4. Create Shop Products infra
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT,
    price DECIMAL(15,2) DEFAULT 0,
    discount_percent INTEGER DEFAULT 0,
    sale_price DECIMAL(15,2) DEFAULT 0,
    summary TEXT,
    description TEXT,
    status TEXT DEFAULT 'draft',
    main_image_url TEXT,
    gallery_urls TEXT[] DEFAULT '{}',
    stock INTEGER DEFAULT 0,
    badge_new BOOLEAN DEFAULT false,
    badge_best BOOLEAN DEFAULT false,
    badge_sale BOOLEAN DEFAULT false,
    shipping_fee DECIMAL(15,2) DEFAULT 0,
    free_shipping_threshold DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Global RLS Overhaul (Ensure Filtering Works)
DO $$ 
DECLARE 
    tbl text;
    pol record;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY['tweets', 'tweet_replies', 'direct_messages', 'site_settings', 'products'])
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
        FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = tbl AND schemaname = 'public'
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
        END LOOP;
    END LOOP;
END $$;

-- A. Basic Standard Policies
CREATE POLICY "unified_select_tweets" ON public.tweets FOR SELECT 
    USING (COALESCE(is_hidden, false) = false OR (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)));

CREATE POLICY "unified_select_replies" ON public.tweet_replies FOR SELECT 
    USING (COALESCE(is_hidden, false) = false OR (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)));

CREATE POLICY "unified_select_messages" ON public.direct_messages FOR SELECT 
    USING (COALESCE(is_hidden, false) = false OR (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)));

CREATE POLICY "unified_select_site_settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "unified_select_products" ON public.products FOR SELECT USING (true);

-- B. Ownership/Admin policies
CREATE POLICY "unified_all_tweets_owner_admin" ON public.tweets FOR ALL TO authenticated
    USING (author_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)));

CREATE POLICY "unified_all_replies_owner_admin" ON public.tweet_replies FOR ALL TO authenticated
    USING (author_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)));

CREATE POLICY "unified_all_settings_admin" ON public.site_settings FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true));

-- 6. Update Trending & Search RPCs to filter hidden content
DROP FUNCTION IF EXISTS public.get_trending_tweets();
CREATE OR REPLACE FUNCTION public.get_trending_tweets()
RETURNS TABLE (
    id UUID,
    content TEXT,
    image_url TEXT,
    like_count INTEGER,
    reply_count INTEGER,
    view_count INTEGER,
    created_at TIMESTAMPTZ,
    profiles JSONB
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.content,
        t.image_url,
        t.like_count,
        t.reply_count,
        t.view_count,
        t.created_at,
        jsonb_build_object('nickname', p.nickname, 'avatar_url', p.avatar_url)
    FROM public.tweets t
    JOIN public.profiles p ON t.author_id = p.id
    WHERE COALESCE(t.is_hidden, false) = false
    ORDER BY (t.like_count + t.reply_count + (t.view_count / 10)) DESC
    LIMIT 10;
END;
$$;

DROP FUNCTION IF EXISTS public.search_tweets(text);
CREATE OR REPLACE FUNCTION public.search_tweets(keyword TEXT)
RETURNS SETOF public.tweets LANGUAGE sql SECURITY DEFINER AS $$
    SELECT *
    FROM public.tweets
    WHERE (content ILIKE '%' || keyword || '%')
    AND COALESCE(is_hidden, false) = false
    ORDER BY created_at DESC
    LIMIT 100;
$$;
