-- [REPAIR] Enhanced Admin Audit RPCs
-- Run this in your Supabase SQL Editor

-- 1. get_user_activity_counts (Fixing 404)
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
    -- Security Check
    IF NOT authorize_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    SELECT id INTO p_id FROM public.profiles WHERE user_id = target_uid OR id = target_uid LIMIT 1;

    SELECT json_build_object(
        'tweets_count', (SELECT count(*) FROM public.tweets WHERE author_id = p_id),
        'replies_count', (SELECT count(*) FROM public.tweet_replies WHERE author_id = p_id),
        'chats_count', (SELECT count(*) FROM public.direct_chats WHERE user1_id = p_id OR user2_id = p_id)
    ) INTO res;

    RETURN res;
END;
$$;

-- Ensure execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_activity_counts(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_activity_counts(uuid) TO service_role;

-- 2. get_user_sanction_history_v2
CREATE OR REPLACE FUNCTION public.get_user_sanction_history_v2(target_user_id uuid)
RETURNS TABLE (
  id uuid,
  sanction_type text,
  duration_days int,
  reason text,
  created_at timestamptz,
  admin_nickname text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT authorize_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    sh.id,
    sh.sanction_type::text,
    sh.duration_days,
    sh.reason,
    sh.created_at,
    p.nickname::text as admin_nickname
  FROM public.sanction_history sh
  LEFT JOIN public.profiles p ON sh.admin_id = p.id
  WHERE sh.target_user_id = target_user_id
     OR sh.target_user_id IN (SELECT user_id FROM public.profiles WHERE id = target_user_id)
     OR sh.target_user_id IN (SELECT id FROM public.profiles WHERE user_id = target_user_id)
  ORDER BY sh.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_sanction_history_v2(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_sanction_history_v2(uuid) TO service_role;

-- 3. get_admin_chat_messages
CREATE OR REPLACE FUNCTION public.get_admin_chat_messages(p_chat_id uuid)
RETURNS SETOF public.direct_messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT authorize_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT * FROM public.direct_messages
  WHERE chat_id = p_chat_id
  ORDER BY created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_chat_messages(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_chat_messages(uuid) TO service_role;
