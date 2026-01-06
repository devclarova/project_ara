-- Admin policies for content tables to ensure reported content is visible
-- Replies: Allow admins to view ALL replies (including deleted ones if soft-deleted, though RLS usually hides rows based on filters)
-- Actually, RLS hides rows if no policy matches.

-- Policy for REPLIES (tweet_replies)
DROP POLICY IF EXISTS "replies_admin_select" ON public.tweet_replies;
CREATE POLICY "replies_admin_select" ON public.tweet_replies
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Policy for TWEETS (just in case)
DROP POLICY IF EXISTS "tweets_admin_select" ON public.tweets;
CREATE POLICY "tweets_admin_select" ON public.tweets
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Policy for MESSAGES (Chat)
DROP POLICY IF EXISTS "messages_admin_select" ON public.messages;
CREATE POLICY "messages_admin_select" ON public.messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.is_admin = true
        )
    );
