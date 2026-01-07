-- [MIGRATION] Final Ban System Enforcement & Restoration
-- This is the definitive fix for the ban system.

-- 1. Correct Admin Policy on Profiles
-- Previously failed because it was using 'id = auth.uid()' instead of 'user_id = auth.uid()'
DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "profiles_admin_update" ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid()
            AND is_admin = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid()
            AND is_admin = true
        )
    );

-- 2. Prevent Banned Users from Posting (Tweets & Replies)
-- This ensures the ban is FUNCTIONAL, not just a badge.

-- A. For Tweets
DROP POLICY IF EXISTS "tweets_insert_owner" ON public.tweets;
CREATE POLICY "tweets_insert_owner" ON public.tweets
    FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Must own the profile
        (author_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
        AND
        -- Must NOT be banned
        NOT EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid()
            AND banned_until > now()
        )
    );

-- B. For Replies
DROP POLICY IF EXISTS "replies_insert_owner" ON public.tweet_replies;
CREATE POLICY "replies_insert_owner" ON public.tweet_replies
    FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Must own the profile
        (author_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
        AND
        -- Must NOT be banned
        NOT EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid()
            AND banned_until > now()
        )
    );

-- 3. Fix Sanction History 409 & Types
DO $$
BEGIN
    -- Drop unique constraint if exists (from common schema errors)
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sanction_history_report_id_key') THEN
        ALTER TABLE public.sanction_history DROP CONSTRAINT sanction_history_report_id_key;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'sanction_history_report_id_key') THEN
        DROP INDEX IF EXISTS public.sanction_history_report_id_key;
    END IF;
END $$;

ALTER TABLE public.sanction_history DROP CONSTRAINT IF EXISTS sanction_type_check;
ALTER TABLE public.sanction_history ADD CONSTRAINT sanction_type_check CHECK (sanction_type IN ('ban', 'permanent_ban', 'warning', 'unban'));

-- 4. Ensure Banned Users cannot use Notifications/DMs (Optional but recommended)
-- ... can be added if needed, but Tweets/Replies are primary.
