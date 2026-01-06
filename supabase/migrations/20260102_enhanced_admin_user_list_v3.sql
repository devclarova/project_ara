-- [ENHANCEMENT] Full filter support for all columns in get_admin_users_list
DROP FUNCTION IF EXISTS public.get_admin_users_list(int, int, text, text, text, text, text);

CREATE OR REPLACE FUNCTION public.get_admin_users_list(
  page int DEFAULT 1,
  per_page int DEFAULT 10,
  search_term text DEFAULT '',
  filter_role text DEFAULT 'All',
  filter_status text DEFAULT 'All',
  filter_gender text DEFAULT 'All',
  filter_online text DEFAULT 'All',
  sort_by text DEFAULT 'created_at_desc'
)
RETURNS TABLE (
  id uuid,
  profile_id uuid,
  email text,
  nickname text,
  avatar_url text,
  is_admin boolean,
  banned_until timestamptz,
  country text,
  gender text,
  birthday text,
  is_online boolean,
  last_active_at timestamptz,
  bio text,
  location text,
  followers_count int,
  following_count int,
  banner_url text,
  country_name text,
  country_flag_url text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  total_count bigint,
  received_reports_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  offset_val int;
  total_rows bigint;
BEGIN
  IF NOT authorize_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  offset_val := (page - 1) * per_page;

  SELECT COUNT(*) INTO total_rows
  FROM auth.users au
  JOIN public.profiles pp ON au.id = pp.user_id
  WHERE 
    (search_term = '' OR au.email ILIKE '%' || search_term || '%' OR pp.nickname ILIKE '%' || search_term || '%')
    AND (filter_role = 'All' OR (filter_role = 'Admin' AND pp.is_admin = true) OR (filter_role = 'User' AND pp.is_admin = false))
    AND (filter_status = 'All' 
      OR (filter_status = 'Active' AND (pp.banned_until IS NULL OR pp.banned_until < now()))
      OR (filter_status = 'Banned' AND pp.banned_until > now()))
    AND (filter_gender = 'All' OR pp.gender::text = filter_gender)
    AND (filter_online = 'All' OR (filter_online = 'Online' AND pp.is_online = true) OR (filter_online = 'Offline' AND pp.is_online = false));

  RETURN QUERY
  SELECT 
    au.id,
    pp.id as profile_id,
    au.email::text,
    pp.nickname::text,
    pp.avatar_url::text,
    pp.is_admin,
    pp.banned_until,
    pp.country::text,
    pp.gender::text,
    pp.birthday::text,
    pp.is_online,
    pp.last_active_at,
    pp.bio::text,
    pp.location::text,
    pp.followers_count::int,
    pp.following_count::int,
    pp.banner_url::text,
    (SELECT c.name::text FROM public.countries c WHERE c.id::text = pp.country OR c.iso_code = pp.country LIMIT 1),
    (SELECT c.flag_url::text FROM public.countries c WHERE c.id::text = pp.country OR c.iso_code = pp.country LIMIT 1),
    au.created_at,
    pp.last_sign_in_at,
    total_rows,
    (SELECT count(DISTINCT r.id) FROM public.reports r WHERE r.target_id IN (au.id, pp.id))
  FROM auth.users au
  JOIN public.profiles pp ON au.id = pp.user_id
  WHERE 
    (search_term = '' OR au.email ILIKE '%' || search_term || '%' OR pp.nickname ILIKE '%' || search_term || '%')
    AND (filter_role = 'All' OR (filter_role = 'Admin' AND pp.is_admin = true) OR (filter_role = 'User' AND pp.is_admin = false))
    AND (filter_status = 'All' 
      OR (filter_status = 'Active' AND (pp.banned_until IS NULL OR pp.banned_until < now()))
      OR (filter_status = 'Banned' AND pp.banned_until > now()))
    AND (filter_gender = 'All' OR pp.gender::text = filter_gender)
    AND (filter_online = 'All' OR (filter_online = 'Online' AND pp.is_online = true) OR (filter_online = 'Offline' AND pp.is_online = false))
  ORDER BY 
    CASE WHEN sort_by = 'created_at_desc' THEN au.created_at END DESC,
    CASE WHEN sort_by = 'created_at_asc' THEN au.created_at END ASC,
    CASE WHEN sort_by = 'nickname_asc' THEN pp.nickname END ASC,
    CASE WHEN sort_by = 'last_active_desc' THEN pp.last_active_at END DESC
  LIMIT per_page OFFSET offset_val;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_users_list TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_users_list TO service_role;
