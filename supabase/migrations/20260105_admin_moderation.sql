-- ==========================================
-- Content Moderation RPCs
-- ==========================================

-- 0. Force drop existing function if signature changes
DROP FUNCTION IF EXISTS public.get_admin_moderation_content(text, text, int, int);

-- 1. get_admin_moderation_content
CREATE OR REPLACE FUNCTION public.get_admin_moderation_content(
    p_type TEXT,
    p_search TEXT DEFAULT '',
    p_page INT DEFAULT 1,
    p_per_page INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    parent_id UUID,
    content TEXT,
    image_urls TEXT,
    created_at TIMESTAMPTZ,
    author_id UUID,
    nickname TEXT,
    avatar_url TEXT,
    email TEXT,
    content_type TEXT, -- Added this column
    stats JSONB,
    total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_offset INT := (p_page - 1) * p_per_page;
    v_total_count BIGINT;
BEGIN
    IF NOT authorize_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    IF p_type = 'post' THEN
        -- Count total filtered
        SELECT count(*) INTO v_total_count
        FROM public.tweets t
        JOIN public.profiles p ON t.author_id = p.id
        JOIN auth.users au ON p.user_id = au.id
        WHERE (p_search = '' OR t.content ILIKE '%' || p_search || '%' OR p.nickname ILIKE '%' || p_search || '%');

        RETURN QUERY
        SELECT 
            t.id,
            t.id as parent_id,
            t.content,
            t.image_url as image_urls,
            t.created_at,
            p.id as author_id,
            p.nickname::TEXT,
            p.avatar_url::TEXT,
            au.email::TEXT,
            'post'::TEXT as content_type,
            jsonb_build_object(
                'likes', COALESCE(t.like_count, 0),
                'replies', COALESCE(t.reply_count, 0),
                'views', COALESCE(t.view_count, 0)
            ) as stats,
            v_total_count
        FROM public.tweets t
        JOIN public.profiles p ON t.author_id = p.id
        JOIN auth.users au ON p.user_id = au.id
        WHERE (p_search = '' OR t.content ILIKE '%' || p_search || '%' OR p.nickname ILIKE '%' || p_search || '%')
        ORDER BY t.created_at DESC
        LIMIT p_per_page OFFSET v_offset;

    ELSIF p_type = 'comment' THEN
        -- Count total filtered
        SELECT count(*) INTO v_total_count
        FROM public.tweet_replies tr
        JOIN public.profiles p ON tr.author_id = p.id
        JOIN auth.users au ON p.user_id = au.id
        WHERE (p_search = '' OR tr.content ILIKE '%' || p_search || '%' OR p.nickname ILIKE '%' || p_search || '%');

        RETURN QUERY
        SELECT 
            tr.id,
            tr.tweet_id as parent_id,
            tr.content,
            NULL::TEXT as image_urls,
            tr.created_at,
            p.id as author_id,
            p.nickname::TEXT,
            p.avatar_url::TEXT,
            au.email::TEXT,
            'comment'::TEXT as content_type,
            jsonb_build_object(
                'likes', COALESCE(tr.like_count, 0),
                'replies', 0, -- Replies don't typically have nested reply counts in this schema
                'views', 0
            ) as stats,
            v_total_count
        FROM public.tweet_replies tr
        JOIN public.profiles p ON tr.author_id = p.id
        JOIN auth.users au ON p.user_id = au.id
        WHERE (p_search = '' OR tr.content ILIKE '%' || p_search || '%' OR p.nickname ILIKE '%' || p_search || '%')
        ORDER BY tr.created_at DESC
        LIMIT p_per_page OFFSET v_offset;
    END IF;
END;
$$;

-- 2. delete_moderation_content
CREATE OR REPLACE FUNCTION public.delete_moderation_content(
    p_type TEXT,
    p_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT authorize_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    IF p_type = 'post' THEN
        DELETE FROM public.tweets WHERE id = p_id;
    ELSIF p_type = 'comment' THEN
        DELETE FROM public.tweet_replies WHERE id = p_id;
    END IF;
END;
$$;

-- GRANTS
GRANT EXECUTE ON FUNCTION public.get_admin_moderation_content TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_moderation_content TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_moderation_content TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_moderation_content TO service_role;
