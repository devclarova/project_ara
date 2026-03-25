-- 1. 트윗(tweets) RLS 정책 갱신
DROP POLICY IF EXISTS "unified_select_tweets" ON public.tweets;
CREATE POLICY "unified_select_tweets" ON public.tweets
FOR SELECT USING (
    is_hidden = false 
    OR author_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()) -- 작성자 본인 허용
    OR (SELECT is_admin FROM public.profiles WHERE user_id = auth.uid()) = true -- 관리자 허용
);

DROP POLICY IF EXISTS "unified_insert_tweets" ON public.tweets;
CREATE POLICY "unified_insert_tweets" ON public.tweets
FOR INSERT WITH CHECK (
    author_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()) -- 본인 이름으로만 작성 가능
);

-- 2. 댓글(tweet_replies) RLS 정책 갱신
DROP POLICY IF EXISTS "unified_select_replies" ON public.tweet_replies;
CREATE POLICY "unified_select_replies" ON public.tweet_replies
FOR SELECT USING (
    is_hidden = false 
    OR author_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()) -- 작성자 본인 허용
    OR (SELECT is_admin FROM public.profiles WHERE user_id = auth.uid()) = true -- 관리자 허용
);

DROP POLICY IF EXISTS "unified_insert_replies" ON public.tweet_replies;
CREATE POLICY "unified_insert_replies" ON public.tweet_replies
FOR INSERT WITH CHECK (
    author_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- 3. 다이렉트 메시지(direct_messages) RLS 정책 갱신 (긴급 간소화 버전)
DROP POLICY IF EXISTS "unified_select_direct_messages" ON public.direct_messages;
CREATE POLICY "unified_select_direct_messages" ON public.direct_messages
FOR SELECT USING (
    sender_id = auth.uid() 
    OR chat_id IN (SELECT id FROM public.direct_chats) -- 참여 확인 일시 완화 또는 유지
    OR (SELECT is_admin FROM public.profiles WHERE user_id = auth.uid()) = true
);

DROP POLICY IF EXISTS "unified_insert_direct_messages" ON public.direct_messages;
CREATE POLICY "unified_insert_direct_messages" ON public.direct_messages
FOR INSERT WITH CHECK (
    sender_id = auth.uid() -- 본인 발원만 검증 (채팅방 참여 확인 일시 제외)
);

-- 4. 다이렉트 채팅방(direct_chats) RLS 정책
DROP POLICY IF EXISTS "unified_select_direct_chats" ON public.direct_chats;
CREATE POLICY "unified_select_direct_chats" ON public.direct_chats
FOR SELECT USING (
    user1_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR user2_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR (SELECT is_admin FROM public.profiles WHERE user_id = auth.uid()) = true
);

DROP POLICY IF EXISTS "unified_insert_direct_chats" ON public.direct_chats;
CREATE POLICY "unified_insert_direct_chats" ON public.direct_chats
FOR INSERT WITH CHECK (
    user1_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR user2_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- 5. 인기 트윗 RPC 고도화 (아바타 포함 및 알고리즘 개선)
DROP FUNCTION IF EXISTS public.get_trending_tweets();
DROP FUNCTION IF EXISTS public.get_trending_tweets(integer);
DROP FUNCTION IF EXISTS public.get_trending_tweets(p_limit integer);

CREATE OR REPLACE FUNCTION public.get_trending_tweets(p_limit INTEGER DEFAULT 5)
RETURNS TABLE (
    id UUID,
    content TEXT,
    like_count INTEGER,
    reply_count INTEGER,
    view_count INTEGER,
    created_at TIMESTAMPTZ,
    profiles JSONB
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id, t.content, t.like_count, t.reply_count, t.view_count, t.created_at,
        jsonb_build_object('nickname', p.nickname, 'avatar_url', p.avatar_url) as profiles
    FROM public.tweets t
    JOIN public.profiles p ON t.author_id = p.id
    WHERE t.is_hidden = false
      AND (t.deleted_at IS NULL)
    ORDER BY (t.like_count + t.reply_count + t.view_count/10.0) DESC
    LIMIT p_limit;
END;
$$;

-- 6. 스토리지 권한 보강 (프로필 사진 깨짐 방지)
-- 'avatars' 또는 'profiles' 버킷이 존재할 경우 공개 읽기 권한을 부여합니다.
DO $$ 
BEGIN
    -- avatars 버킷 정책
    IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars') THEN
        DROP POLICY IF EXISTS "Public Access for Avatars" ON storage.objects;
        CREATE POLICY "Public Access for Avatars" ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' );
    END IF;
    
    -- profiles 버킷 정책 (아바타가 여기에 저장되는 경우 대비)
    IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'profiles') THEN
        DROP POLICY IF EXISTS "Public Access for Profile Images" ON storage.objects;
        CREATE POLICY "Public Access for Profile Images" ON storage.objects FOR SELECT USING ( bucket_id = 'profiles' );
    END IF;
END $$;
