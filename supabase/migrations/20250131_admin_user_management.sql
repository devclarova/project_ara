-- Helper function to check if the current user is an admin
CREATE OR REPLACE FUNCTION authorize_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin boolean;
BEGIN
  SELECT p.is_admin INTO is_admin
  FROM public.profiles p
  WHERE p.user_id = auth.uid();
  
  RETURN coalesce(is_admin, false);
END;
$$;

-- Secure RPC to get user list with email (requires admin privilege)
CREATE OR REPLACE FUNCTION get_admin_users_list(
  page int DEFAULT 1,
  per_page int DEFAULT 10,
  search_term text DEFAULT '',
  filter_role text DEFAULT 'All',
  filter_status text DEFAULT 'All'
)
RETURNS TABLE (
  id uuid,
  email varchar,
  nickname text,
  avatar_url text,
  is_admin boolean,
  banned_until timestamptz,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth 
AS $$
DECLARE
  offset_val int;
  total_rows bigint;
BEGIN
  -- Check Admin Permission
  IF NOT authorize_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  offset_val := (page - 1) * per_page;

  -- Get Total Count efficiently
  SELECT COUNT(*) INTO total_rows
  FROM auth.users au
  JOIN public.profiles pp ON au.id = pp.user_id
  WHERE 
    (search_term = '' OR au.email ILIKE '%' || search_term || '%' OR pp.nickname ILIKE '%' || search_term || '%')
    AND
    (filter_role = 'All' OR (filter_role = 'Admin' AND pp.is_admin = true) OR (filter_role = 'User' AND pp.is_admin = false))
    AND
    (filter_status = 'All' 
      OR (filter_status = 'Active' AND (pp.banned_until IS NULL OR pp.banned_until < now()))
      OR (filter_status = 'Banned' AND pp.banned_until > now())
    );

  RETURN QUERY
  SELECT 
    au.id,
    au.email::varchar,
    pp.nickname,
    pp.avatar_url,
    pp.is_admin,
    pp.banned_until,
    au.created_at,
    au.last_sign_in_at,
    total_rows
  FROM auth.users au
  JOIN public.profiles pp ON au.id = pp.user_id
  WHERE 
    (search_term = '' OR au.email ILIKE '%' || search_term || '%' OR pp.nickname ILIKE '%' || search_term || '%')
    AND
    (filter_role = 'All' OR (filter_role = 'Admin' AND pp.is_admin = true) OR (filter_role = 'User' AND pp.is_admin = false))
    AND
    (filter_status = 'All' 
      OR (filter_status = 'Active' AND (pp.banned_until IS NULL OR pp.banned_until < now()))
      OR (filter_status = 'Banned' AND pp.banned_until > now())
    )
  ORDER BY au.created_at DESC
  LIMIT per_page OFFSET offset_val;
END;
$$;

-- RPC to toggle Admin Role
CREATE OR REPLACE FUNCTION toggle_admin_role(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_status boolean;
BEGIN
  -- Check Admin Permission
  IF NOT authorize_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Prevent self-demotion
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot change your own admin status.';
  END IF;

  SELECT is_admin INTO current_status FROM public.profiles WHERE user_id = target_user_id;
  
  UPDATE public.profiles
  SET is_admin = NOT coalesce(current_status, false)
  WHERE user_id = target_user_id;

  RETURN true;
END;
$$;
