-- [최종 보정] RPC 오버로딩 해결 및 콘텐츠 숨김 정책 완벽 적용
-- 이 스크립트는 기존의 중복된 함수 시그니처를 모두 제거하고 깨끗하게 재등록합니다.

-- 1. 기존 함수 삭제 (오버로딩 충돌 해결)
-- 매개변수가 있는 버전과 없는 버전 모두 명시적으로 삭제합니다.
DROP FUNCTION IF EXISTS public.get_trending_tweets();
DROP FUNCTION IF EXISTS public.get_trending_tweets(integer);
DROP FUNCTION IF EXISTS public.get_trending_tweets(p_limit integer);

DROP FUNCTION IF EXISTS public.search_tweets(text, integer, integer);
DROP FUNCTION IF EXISTS public.search_tweets(p_search text, p_page integer, p_per_page integer);

DROP FUNCTION IF EXISTS public.get_admin_moderation_content(text, text, integer, integer);
DROP FUNCTION IF EXISTS public.get_admin_moderation_content(p_type text, p_search text, p_page integer, p_per_page integer);

-- 2. 필터링 강화된 인기 트윗 RPC 재등록
CREATE OR REPLACE FUNCTION public.get_trending_tweets(p_limit INTEGER DEFAULT 5)
RETURNS SETOF public.tweets 
LANGUAGE sql 
SECURITY DEFINER 
AS $$
    SELECT *
    FROM public.tweets
    WHERE is_hidden = false 
      AND (deleted_at IS NULL)
    ORDER BY (like_count + reply_count + view_count/10) DESC
    LIMIT p_limit;
$$;

-- 3. 필터링 강화된 검색 RPC 재등록
CREATE OR REPLACE FUNCTION public.search_tweets(
    p_search TEXT,
    p_page INTEGER DEFAULT 0,
    p_per_page INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    author_id UUID,
    content TEXT,
    image_url TEXT[],
    created_at TIMESTAMPTZ,
    reply_count INTEGER,
    like_count INTEGER,
    view_count INTEGER,
    repost_count INTEGER,
    is_hidden BOOLEAN,
    nickname TEXT,
    avatar_url TEXT,
    user_id UUID,
    total_count INTEGER
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
BEGIN
    RETURN QUERY
    WITH filtered_tweets AS (
        SELECT 
            t.id, t.author_id, t.content, t.image_url, t.created_at,
            t.reply_count, t.like_count, t.view_count, t.repost_count, t.is_hidden,
            p.nickname::TEXT, p.avatar_url::TEXT, p.user_id
        FROM public.tweets t
        JOIN public.profiles p ON t.author_id = p.id
        WHERE (t.content ILIKE '%' || p_search || '%' OR p.nickname ILIKE '%' || p_search || '%')
          AND t.is_hidden = false
          AND t.deleted_at IS NULL
    )
    SELECT *, (SELECT COUNT(*)::INTEGER FROM filtered_tweets)
    FROM filtered_tweets
    ORDER BY created_at DESC
    LIMIT p_per_page
    OFFSET p_page * p_per_page;
END;
$$;

-- 4. 관리자용 모더레이션 데이터 조회 RPC (숨김 콘텐츠 포함)
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
    stats JSONB,
    is_hidden BOOLEAN,
    total_count INTEGER
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
DECLARE
    v_offset INTEGER := (p_page - 1) * p_per_page;
BEGIN
    IF p_type = 'post' THEN
        RETURN QUERY
        WITH base AS (
            SELECT 
                t.id, 
                NULL::UUID as parent_id,
                t.content, 
                to_jsonb(t.image_url) as image_urls,
                t.created_at, 
                t.author_id,
                p.nickname::TEXT as nickname,  -- Column 7 (TEXT 강제 캐스팅)
                p.avatar_url::TEXT as avatar_url, -- Column 8 (TEXT 강제 캐스팅)
                au.email::TEXT as email,
                'post'::TEXT as content_type,
                jsonb_build_object(
                    'likes', t.like_count,
                    'replies', t.reply_count,
                    'views', t.view_count
                ) as stats,
                t.is_hidden
            FROM public.tweets t
            JOIN public.profiles p ON t.author_id = p.id
            JOIN auth.users au ON p.user_id = au.id
            WHERE t.deleted_at IS NULL
              AND (p_search = '' OR t.content ILIKE '%' || p_search || '%' OR p.nickname ILIKE '%' || p_search || '%')
        )
        SELECT *, (SELECT COUNT(*)::INTEGER FROM base) FROM base
        ORDER BY created_at DESC LIMIT p_per_page OFFSET v_offset;

    ELSIF p_type = 'comment' THEN
        RETURN QUERY
        WITH base AS (
            SELECT 
                r.id, 
                r.tweet_id as parent_id,
                r.content, 
                '[]'::JSONB as image_urls,
                r.created_at, 
                r.author_id,
                p.nickname::TEXT as nickname,
                p.avatar_url::TEXT as avatar_url,
                au.email::TEXT as email,
                'comment'::TEXT as content_type,
                jsonb_build_object(
                    'likes', r.like_count,
                    'replies', 0,
                    'views', 0
                ) as stats,
                r.is_hidden
            FROM public.tweet_replies r
            JOIN public.profiles p ON r.author_id = p.id
            JOIN auth.users au ON p.user_id = au.id
            WHERE r.deleted_at IS NULL
              AND (p_search = '' OR r.content ILIKE '%' || p_search || '%' OR p.nickname ILIKE '%' || p_search || '%')
        )
        SELECT *, (SELECT COUNT(*)::INTEGER FROM base) FROM base
        ORDER BY created_at DESC LIMIT p_per_page OFFSET v_offset;
    
    ELSE
        RETURN QUERY
        WITH base AS (
            SELECT 
                m.id, 
                m.chat_id as parent_id,
                m.content, 
                '[]'::JSONB as image_urls,
                m.created_at, 
                m.sender_id as author_id,
                p.nickname::TEXT as nickname,
                p.avatar_url::TEXT as avatar_url,
                au.email::TEXT as email,
                'message'::TEXT as content_type,
                '{"likes":0, "replies":0, "views":0}'::JSONB as stats,
                false as is_hidden
            FROM public.direct_messages m
            JOIN public.profiles p ON m.sender_id = p.id
            JOIN auth.users au ON p.user_id = au.id
            WHERE (p_search = '' OR m.content ILIKE '%' || p_search || '%' OR p.nickname ILIKE '%' || p_search || '%')
        )
        SELECT *, (SELECT COUNT(*)::INTEGER FROM base) FROM base
        ORDER BY created_at DESC LIMIT p_per_page OFFSET v_offset;
    END IF;
END;
$$;
