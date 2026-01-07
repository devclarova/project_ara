-- Admin policies for Direct Messages (Chat)
-- User was reporting "content not found" for chat reports. 
-- The table name is 'direct_messages', NOT 'messages'.

DROP POLICY IF EXISTS "direct_messages_admin_select" ON public.direct_messages;
CREATE POLICY "direct_messages_admin_select" ON public.direct_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Also add policy for 'direct_chats' just in case fetching chat room info fails
DROP POLICY IF EXISTS "direct_chats_admin_select" ON public.direct_chats;
CREATE POLICY "direct_chats_admin_select" ON public.direct_chats
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.is_admin = true
        )
    );
