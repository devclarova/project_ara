-- Create a function to fetch all reports related to a specific user (received reports)
-- This includes:
-- 1. Reports targeting the user profile directly.
-- 2. Reports targeting any tweet authored by the user.
-- 3. Reports targeting any reply authored by the user.

CREATE OR REPLACE FUNCTION public.get_user_related_reports(target_profile_id UUID)
RETURNS SETOF public.reports
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT r.*
    FROM public.reports r
    WHERE 
        -- 1. Direct User Reports
        (r.target_type = 'user' AND r.target_id = target_profile_id)
        
        OR
        
        -- 2. Reports on Tweets authored by the user
        (r.target_type = 'tweet' AND r.target_id IN (
            SELECT id FROM public.tweets WHERE author_id = target_profile_id
        ))
        
        OR
        
        -- 3. Reports on Replies authored by the user
        (r.target_type = 'reply' AND r.target_id IN (
            SELECT id FROM public.tweet_replies WHERE author_id = target_profile_id
        ))

        OR

        -- 4. Reports on Direct Messages sent by the user
        (r.target_type = 'direct_message' AND r.target_id IN (
            SELECT dm.id 
            FROM public.direct_messages dm
            JOIN public.profiles p ON p.user_id = dm.sender_id
            WHERE p.id = target_profile_id
        ))
        
    ORDER BY r.created_at DESC;
$$;
