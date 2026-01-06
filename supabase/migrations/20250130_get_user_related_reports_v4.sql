-- Create a function to fetch all reports related to a specific user (received reports)
-- V4: Includes target_type = 'chat'
-- 1. Resolves IDs (Profile UUID & Auth ID) to handle referencing ambiguity.
-- 2. Finds reports on existing content (tweets, replies, users) via Joins.
-- 3. Finds reports on Chat Rooms (direct_chats) where the user is a participant but NOT the reporter.
-- 4. Finds reports on DELETED content via content_snapshot JSON matching.

CREATE OR REPLACE FUNCTION public.get_user_related_reports(target_profile_id UUID)
RETURNS SETOF public.reports
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID; -- Auth ID
    v_profile_id UUID; -- Profile UUID
    v_user_id_text TEXT; -- Auth ID as text for JSON comparison
BEGIN
    -- 1. 입력된 ID로 프로필 정보 조회
    SELECT id, user_id INTO v_profile_id, v_user_id
    FROM public.profiles
    WHERE id = target_profile_id OR user_id = target_profile_id
    LIMIT 1;

    -- 프로필을 못 찾은 경우
    IF v_profile_id IS NULL THEN
        v_profile_id := target_profile_id;
        v_user_id := target_profile_id;
    END IF;
    
    v_user_id_text := v_user_id::text;

    RETURN QUERY
    SELECT DISTINCT r.*
    FROM public.reports r
    WHERE 
        -- 1. 사용자 프로필 직접 신고
        (r.target_type = 'user' AND (r.target_id = v_profile_id OR r.target_id = v_user_id))
        
        OR
        
        -- 2. 작성한 트윗에 대한 신고 (존재하는 콘텐츠)
        (r.target_type = 'tweet' AND r.target_id IN (
            SELECT t.id FROM public.tweets t 
            WHERE t.author_id = v_profile_id OR t.author_id = v_user_id
        ))
        
        OR
        
        -- 3. 작성한 답글에 대한 신고 (존재하는 콘텐츠)
        (r.target_type = 'reply' AND r.target_id IN (
            SELECT tr.id FROM public.tweet_replies tr 
            WHERE tr.author_id = v_profile_id OR tr.author_id = v_user_id
        ))

        OR

        -- 4. 채팅방에 대한 신고
        -- (해당 채팅방의 참가자 중 한 명이지만, 신고자가 본인이 아닌 경우 -> 즉, 본인이 신고 대상)
        (r.target_type = 'chat' AND r.target_id IN (
            SELECT c.id FROM public.direct_chats c
            WHERE (c.user1_id = v_profile_id OR c.user2_id = v_profile_id)
            AND r.reporter_id != v_profile_id
        ))

        OR

        -- 5. 삭제된 콘텐츠에 대한 신고 (스냅샷 기반 조회)
        -- 스냅샷의 user.id 또는 user.username 이 대상 사용자와 일치하는 경우
        (
            r.content_snapshot IS NOT NULL 
            AND (
                r.content_snapshot->'user'->>'id' = v_user_id_text
                OR
                r.content_snapshot->'user'->>'username' = v_user_id_text
                OR
                r.content_snapshot->'user'->>'id' = v_profile_id::text
            )
        )
        
    ORDER BY r.created_at DESC;
END;
$$;
