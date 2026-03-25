-- [강력 권장] 모든 콘텐츠 숨김 정책 및 데이터 정합성 NUCLEAR RESET
-- 이 스크립트를 실행하면 기존의 모든 RLS 충돌을 제거하고 깨끗한 상태로 필터링이 적용됩니다.

-- 1. 기본 데이터 정합성 확보 (NULL 방지)
UPDATE public.tweets SET is_hidden = FALSE WHERE is_hidden IS NULL;
ALTER TABLE public.tweets ALTER COLUMN is_hidden SET DEFAULT FALSE;
ALTER TABLE public.tweets ALTER COLUMN is_hidden SET NOT NULL;

UPDATE public.tweet_replies SET is_hidden = FALSE WHERE is_hidden IS NULL;
ALTER TABLE public.tweet_replies ALTER COLUMN is_hidden SET DEFAULT FALSE;
ALTER TABLE public.tweet_replies ALTER COLUMN is_hidden SET NOT NULL;

-- 2. 기존 RLS 정책 완전 초기화 (충돌 방지)
-- 만약 다른 이름의 정책이 있다면 여기서 추가로 DROP 하세요.
DROP POLICY IF EXISTS "unified_select_tweets" ON public.tweets;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.tweets;
DROP POLICY IF EXISTS "Allow public select" ON public.tweets;
DROP POLICY IF EXISTS "Tweets are viewable by everyone" ON public.tweets;

DROP POLICY IF EXISTS "unified_select_replies" ON public.tweet_replies;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.tweet_replies;

-- 3. 새로운 통합 RLS 정책 적용 (관리자 예외 처리 포함)
-- 일반 사용자: is_hidden = false 인 것만 보임
-- 관리자: 모두 보임 (profiles 테이블의 is_admin 필드 기준)

CREATE POLICY "unified_select_tweets" ON public.tweets
FOR SELECT USING (
    is_hidden = false 
    OR (SELECT is_admin FROM public.profiles WHERE user_id = auth.uid()) = true
);

CREATE POLICY "unified_select_replies" ON public.tweet_replies
FOR SELECT USING (
    is_hidden = false 
    OR (SELECT is_admin FROM public.profiles WHERE user_id = auth.uid()) = true
);

-- 4. RPC 함수 보정 (search_tweets)
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
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    WITH filtered_tweets AS (
        SELECT 
            t.id, t.author_id, t.content, t.image_url, t.created_at,
            t.reply_count, t.like_count, t.view_count, t.repost_count, t.is_hidden,
            p.nickname, p.avatar_url, p.user_id
        FROM public.tweets t
        JOIN public.profiles p ON t.author_id = p.id
        WHERE (t.content ILIKE '%' || p_search || '%' OR p.nickname ILIKE '%' || p_search || '%')
          AND t.is_hidden = false -- [필수] 검색에서도 숨김 처리
    )
    SELECT *, (SELECT COUNT(*)::INTEGER FROM filtered_tweets)
    FROM filtered_tweets
    ORDER BY created_at DESC
    LIMIT p_per_page
    OFFSET p_page * p_per_page;
END;
$$;

-- 5. RPC 함수 보정 (get_trending_tweets)
CREATE OR REPLACE FUNCTION public.get_trending_tweets(p_limit INTEGER DEFAULT 5)
RETURNS SETOF public.tweets LANGUAGE sql SECURITY DEFINER AS $$
    SELECT *
    FROM public.tweets
    WHERE is_hidden = false -- [필수] 트렌드에서도 숨김 처리
    ORDER BY (like_count + reply_count + view_count/10) DESC
    LIMIT p_limit;
$$;
