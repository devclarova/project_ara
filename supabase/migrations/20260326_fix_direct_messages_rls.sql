-- =============================================================
-- FIX: direct_messages 테이블에 UPDATE/INSERT RLS 정책 추가
-- 원인: emergency_fix_unified.sql이 기존 정책을 전부 삭제한 후
--       SELECT 정책만 재생성하고 INSERT/UPDATE를 누락함.
--       이로 인해 일반 사용자가 is_read를 업데이트할 수 없어
--       채팅 알림이 새로고침 시마다 되살아남.
-- =============================================================

-- 1. 채팅 참여자가 메시지를 INSERT할 수 있도록 허용
DROP POLICY IF EXISTS "direct_messages_insert_participant" ON public.direct_messages;
CREATE POLICY "direct_messages_insert_participant" ON public.direct_messages
FOR INSERT TO authenticated
WITH CHECK (
    sender_id = auth.uid()
);

-- 2. 채팅 참여자가 메시지의 is_read/read_at/deleted_at 등을 UPDATE할 수 있도록 허용
--    (수신자가 읽음 처리, 관리자가 삭제 처리)
DROP POLICY IF EXISTS "direct_messages_update_participant" ON public.direct_messages;
CREATE POLICY "direct_messages_update_participant" ON public.direct_messages
FOR UPDATE TO authenticated
USING (
    -- 본인이 발신자이거나, 해당 채팅방의 참여자인 경우
    sender_id = auth.uid()
    OR chat_id IN (
        SELECT id FROM public.direct_chats 
        WHERE user1_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
           OR user2_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    )
    -- 관리자는 모든 메시지 수정 가능
    OR EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
);

-- 3. 관리자 전체 접근 정책 (기존에 누락된 경우 추가)
DROP POLICY IF EXISTS "direct_messages_admin_all" ON public.direct_messages;
CREATE POLICY "direct_messages_admin_all" ON public.direct_messages
FOR ALL TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
);
