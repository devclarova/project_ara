-- Create a function to fetch all reports related to a specific user (received reports)
-- Robust Version: Handles both Profile UUID and Auth User ID
-- 1. Resolves the input ID to finding the correct profile.
-- 2. Uses both Profile ID and Auth ID to find authored content (tweets/replies).

CREATE OR REPLACE FUNCTION public.get_user_related_reports(target_profile_id UUID)
RETURNS SETOF public.reports
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID; -- Auth ID
    v_profile_id UUID; -- Profile UUID (PK)
BEGIN
    -- 1. Attempt to resolve IDs from the input
    -- Assume input could be EITHER profile.id OR profile.user_id
    SELECT id, user_id INTO v_profile_id, v_user_id
    FROM public.profiles
    WHERE id = target_profile_id OR user_id = target_profile_id
    LIMIT 1;

    -- If no profile found, try to use input as is (maybe it's a deleted user)
    IF v_profile_id IS NULL THEN
        v_profile_id := target_profile_id;
        v_user_id := target_profile_id;
    END IF;

    RETURN QUERY
    SELECT r.*
    FROM public.reports r
    WHERE 
        -- 1. Direct User Reports (Targeting Profile UUID or Auth ID)
        (r.target_type = 'user' AND (r.target_id = v_profile_id OR r.target_id = v_user_id))
        
        OR
        
        -- 2. Reports on Tweets authored by the user (checking both ID types)
        (r.target_type = 'tweet' AND r.target_id IN (
            SELECT t.id FROM public.tweets t 
            WHERE t.author_id = v_profile_id OR t.author_id = v_user_id
        ))
        
        OR
        
        -- 3. Reports on Replies authored by the user
        (r.target_type = 'reply' AND r.target_id IN (
            SELECT tr.id FROM public.tweet_replies tr 
            WHERE tr.author_id = v_profile_id OR tr.author_id = v_user_id
        ))
        
    ORDER BY r.created_at DESC;
END;
$$;
