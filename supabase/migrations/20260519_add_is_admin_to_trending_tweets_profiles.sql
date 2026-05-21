-- [고도화] TrendsPanel 실시간 인기 피드 관리자 뱃지 연동 마이그레이션
-- 기존 정렬, 점수 계산, 필터, 24시간/7일 fallback 로직 및 RLS를 100% 보존하면서 profiles JSONB 객체에 'is_admin' 키값만 안전하게 추가합니다.

CREATE OR REPLACE FUNCTION public.get_trending_tweets(p_limit INTEGER DEFAULT 5)
RETURNS TABLE (
    id UUID,
    content TEXT,
    like_count INTEGER,
    reply_count INTEGER,
    view_count INTEGER,
    created_at TIMESTAMPTZ,
    profiles JSONB
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- 1단계: 최근 24시간 이내의 "활동량이 있는(Engagement > 0)" 인기글 조회
    RETURN QUERY
    WITH trending_24h AS (
        SELECT 
            t.id, 
            t.content, 
            COALESCE(t.like_count, 0) as like_count, 
            COALESCE(t.reply_count, 0) as reply_count, 
            COALESCE(t.view_count, 0) as view_count, 
            t.created_at,
            jsonb_build_object(
                'nickname', p.nickname,
                'avatar_url', p.avatar_url,
                'plan', COALESCE(p.plan, 'free'),
                'is_admin', COALESCE(p.is_admin, false) -- 🟢 관리자 여부 속성 추가
            ) as profiles
        FROM public.tweets t
        LEFT JOIN public.profiles p ON t.author_id = p.id
        WHERE t.is_hidden = false 
          AND t.deleted_at IS NULL
          AND t.created_at >= (now() - interval '24 hours')
          -- [핵심] 조회수, 좋아요, 댓글 중 하나라도 있어야 함
          AND (COALESCE(t.like_count, 0) + COALESCE(t.reply_count, 0) + COALESCE(t.view_count, 0)) > 0
        ORDER BY (COALESCE(t.reply_count, 0) * 20 + COALESCE(t.like_count, 0) * 10 + COALESCE(t.view_count, 0)) DESC, t.created_at DESC
        LIMIT p_limit
    )
    SELECT * FROM trending_24h;

    -- 결과 개수 확인
    GET DIAGNOSTICS v_count = ROW_COUNT;

    -- 2단계: 24시간 이내 데이터가 부족할 경우, 7일 이내로 범위 확장 (활동 기준 동일 적용)
    IF v_count < p_limit THEN
        RETURN QUERY
        WITH trending_7d AS (
            SELECT 
                t.id, 
                t.content, 
                COALESCE(t.like_count, 0) as like_count, 
                COALESCE(t.reply_count, 0) as reply_count, 
                COALESCE(t.view_count, 0) as view_count, 
                t.created_at,
                jsonb_build_object(
                    'nickname', p.nickname,
                    'avatar_url', p.avatar_url,
                    'plan', COALESCE(p.plan, 'free'),
                    'is_admin', COALESCE(p.is_admin, false) -- 🟢 관리자 여부 속성 추가
                ) as profiles
            FROM public.tweets t
            LEFT JOIN public.profiles p ON t.author_id = p.id
            WHERE t.is_hidden = false 
              AND t.deleted_at IS NULL
              AND t.created_at >= (now() - interval '7 days')
              -- [핵심] 활동량 기준 (0회 활동 게시글 배제)
              AND (COALESCE(t.like_count, 0) + COALESCE(t.reply_count, 0) + COALESCE(t.view_count, 0)) > 0
              -- 이미 24시간 이내에서 뽑힌 데이터 중복 제외
              AND t.id NOT IN (
                  SELECT t2.id FROM public.tweets t2
                  WHERE t2.is_hidden = false 
                    AND t2.deleted_at IS NULL 
                    AND t2.created_at >= (now() - interval '24 hours')
                    AND (COALESCE(t2.like_count, 0) + COALESCE(t2.reply_count, 0) + COALESCE(t2.view_count, 0)) > 0
                  ORDER BY (COALESCE(t2.reply_count, 0) * 20 + COALESCE(t2.like_count, 0) * 10 + COALESCE(t2.view_count, 0)) DESC, t2.created_at DESC
                  LIMIT p_limit
              )
            ORDER BY (COALESCE(t.reply_count, 0) * 20 + COALESCE(t.like_count, 0) * 10 + COALESCE(t.view_count, 0)) DESC, t.created_at DESC
            LIMIT (p_limit - v_count)
        )
        SELECT * FROM trending_7d;
    END IF;
END;
$$;
