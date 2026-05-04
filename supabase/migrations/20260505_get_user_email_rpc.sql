-- [NEW] RPC to get user email by ID (Admin only)
CREATE OR REPLACE FUNCTION public.get_user_email_admin(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email text;
BEGIN
  -- Authorization check
  IF NOT authorize_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT email INTO v_email
  FROM auth.users
  WHERE id = p_user_id;

  RETURN v_email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_email_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_email_admin(uuid) TO service_role;
