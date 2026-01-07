-- Helper: authorize_admin
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

-- Secure RPC: delete_user (ACTUAL DELETION)
CREATE OR REPLACE FUNCTION delete_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Strict Check
  IF NOT authorize_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Prevent self-deletion
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete your own account.';
  END IF;

  -- Delete from auth.users (Cascades to public.profiles usually)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- Constraint Update: Preserve Reports when User is deleted
-- We utilize a DO block to check and update constraints safely
DO $$
BEGIN
    -- Check if constraint exists effectively for target_user_id
    -- We assume standard naming or just try to drop and re-add if needed.
    -- However, determining exact constraint name can be tricky.
    -- Instead, we will try to alter the column to be nullable first (if not already)
    -- and then drop/add constraint if we can identify it.
    -- Simplify: Just ALTER TABLE reports... but we need to know constraint name.
    -- Commonly: reports_target_user_id_fkey or similar.
    
    -- Attempting to handle 'target_user_id'
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'reports_target_user_id_fkey'
        AND table_name = 'reports'
    ) THEN
        ALTER TABLE public.reports DROP CONSTRAINT reports_target_user_id_fkey;
        ALTER TABLE public.reports 
        ADD CONSTRAINT reports_target_user_id_fkey 
        FOREIGN KEY (target_user_id) 
        REFERENCES auth.users(id) 
        ON DELETE SET NULL;
    END IF;

    -- Also handle 'reporter_id' if needed, though less critical for 'deletion of target'.
    -- But if a reporter is deleted, we probably want to keep the report too.
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'reports_reporter_id_fkey'
        AND table_name = 'reports'
    ) THEN
        ALTER TABLE public.reports DROP CONSTRAINT reports_reporter_id_fkey;
        ALTER TABLE public.reports 
        ADD CONSTRAINT reports_reporter_id_fkey 
        FOREIGN KEY (reporter_id) 
        REFERENCES auth.users(id) 
        ON DELETE SET NULL;
    END IF;
END $$;


-- Refined get_admin_users_list with Explicit Casting
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
    pp.nickname::text,    -- Explicit cast to text
    pp.avatar_url::text,  -- Explicit cast to text
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
