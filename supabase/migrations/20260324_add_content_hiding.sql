-- Add is_hidden column to content tables
ALTER TABLE public.tweets ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;
ALTER TABLE public.tweet_replies ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;
ALTER TABLE public.direct_messages ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;

-- Update get_admin_moderation_content to return is_hidden
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
    content_type TEXT,
    stats JSONB,
    is_hidden BOOLEAN, -- Added
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
        SELECT count(*) INTO v_total_count
        FROM public.tweets t
        JOIN public.profiles p ON t.author_id = p.id
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
            t.is_hidden,
            v_total_count
        FROM public.tweets t
        JOIN public.profiles p ON t.author_id = p.id
        JOIN auth.users au ON p.user_id = au.id
        WHERE (p_search = '' OR t.content ILIKE '%' || p_search || '%' OR p.nickname ILIKE '%' || p_search || '%')
        ORDER BY t.created_at DESC
        LIMIT p_per_page OFFSET v_offset;

    ELSIF p_type = 'comment' THEN
        SELECT count(*) INTO v_total_count
        FROM public.tweet_replies tr
        JOIN public.profiles p ON tr.author_id = p.id
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
                'replies', 0,
                'views', 0
            ) as stats,
            tr.is_hidden,
            v_total_count
        FROM public.tweet_replies tr
        JOIN public.profiles p ON tr.author_id = p.id
        JOIN auth.users au ON p.user_id = au.id
        WHERE (p_search = '' OR tr.content ILIKE '%' || p_search || '%' OR p.nickname ILIKE '%' || p_search || '%')
        ORDER BY tr.created_at DESC
        LIMIT p_per_page OFFSET v_offset;

    ELSIF p_type = 'message' THEN
        -- Count total filtered
        SELECT count(*) INTO v_total_count
        FROM public.direct_messages dm
        JOIN public.profiles p ON dm.sender_id = p.id
        WHERE (p_search = '' OR dm.content ILIKE '%' || p_search || '%' OR p.nickname ILIKE '%' || p_search || '%');

        RETURN QUERY
        SELECT 
            dm.id,
            dm.chat_id as parent_id,
            dm.content,
            NULL::TEXT as image_urls, -- DM images might be different, keeping simple for now
            dm.created_at,
            p.id as author_id,
            p.nickname::TEXT,
            p.avatar_url::TEXT,
            au.email::TEXT,
            'message'::TEXT as content_type,
            jsonb_build_object(
                'likes', 0,
                'replies', 0,
                'views', 0
            ) as stats,
            dm.is_hidden,
            v_total_count
        FROM public.direct_messages dm
        JOIN public.profiles p ON dm.sender_id = p.id
        JOIN auth.users au ON p.user_id = au.id
        WHERE (p_search = '' OR dm.content ILIKE '%' || p_search || '%' OR p.nickname ILIKE '%' || p_search || '%')
        ORDER BY dm.created_at DESC
        LIMIT p_per_page OFFSET v_offset;
    END IF;
END;
$$;

-- New function to toggle hidden status
CREATE OR REPLACE FUNCTION public.toggle_content_hidden(
    p_type TEXT,
    p_id UUID,
    p_hidden BOOLEAN
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
        UPDATE public.tweets SET is_hidden = p_hidden WHERE id = p_id;
    ELSIF p_type = 'comment' THEN
        UPDATE public.tweet_replies SET is_hidden = p_hidden WHERE id = p_id;
    ELSIF p_type = 'message' THEN
        UPDATE public.direct_messages SET is_hidden = p_hidden WHERE id = p_id;
    END IF;
END;
$$;

-- GRANTS
GRANT EXECUTE ON FUNCTION public.toggle_content_hidden TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_content_hidden TO service_role;
