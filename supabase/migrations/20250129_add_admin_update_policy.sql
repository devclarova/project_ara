-- Ensure deleted_at column exists on direct_messages
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'direct_messages' AND column_name = 'deleted_at') THEN
        ALTER TABLE public.direct_messages ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
END $$;

-- 1. Direct Messages: Admin Full Access
DROP POLICY IF EXISTS "direct_messages_admin_select" ON public.direct_messages;
DROP POLICY IF EXISTS "direct_messages_admin_update" ON public.direct_messages;
DROP POLICY IF EXISTS "direct_messages_admin_all" ON public.direct_messages;

CREATE POLICY "direct_messages_admin_all" ON public.direct_messages
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- 2. Tweets: Admin Full Access
DROP POLICY IF EXISTS "tweets_admin_select" ON public.tweets;
DROP POLICY IF EXISTS "tweets_admin_update" ON public.tweets;
DROP POLICY IF EXISTS "tweets_admin_all" ON public.tweets;

CREATE POLICY "tweets_admin_all" ON public.tweets
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- 3. Replies: Admin Full Access
DROP POLICY IF EXISTS "replies_admin_select" ON public.tweet_replies;
DROP POLICY IF EXISTS "replies_admin_update" ON public.tweet_replies;
DROP POLICY IF EXISTS "replies_admin_all" ON public.tweet_replies;

CREATE POLICY "replies_admin_all" ON public.tweet_replies
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.is_admin = true
        )
    );
