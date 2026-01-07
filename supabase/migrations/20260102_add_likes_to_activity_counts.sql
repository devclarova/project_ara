-- Add likes count to get_user_activity_counts
CREATE OR REPLACE FUNCTION public.get_user_activity_counts(target_uid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    res json;
    p_id uuid;
BEGIN
    -- Check if user is admin
    IF NOT authorize_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Find profile ID
    SELECT id INTO p_id FROM public.profiles WHERE user_id = target_uid OR id = target_uid LIMIT 1;

    SELECT json_build_object(
        'tweets_count', (SELECT count(*) FROM public.tweets WHERE author_id = p_id),
        'replies_count', (SELECT count(*) FROM public.tweet_replies WHERE author_id = p_id),
        'tweet_likes_count', (SELECT count(*) FROM public.tweet_likes WHERE user_id = p_id),
        'reply_likes_count', (SELECT count(*) FROM public.tweet_replies_likes WHERE user_id = p_id),
        'chats_count', (SELECT count(*) FROM public.direct_chats WHERE user1_id = p_id OR user2_id = p_id)
    ) INTO res;

    RETURN res;
END;
$$;
