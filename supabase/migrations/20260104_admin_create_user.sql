-- [NEW] Admin User Creation RPC
-- This allows admins to create new users without needing the service role key on the frontend.

CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_email text,
  p_password text,
  p_nickname text,
  p_is_admin boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid;
  v_encrypted_password text;
BEGIN
  -- 1. Authorization Check
  IF NOT authorize_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- 2. Check if user already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
    RAISE EXCEPTION 'User with this email already exists.';
  END IF;

  -- 3. Hash the password (Supabase uses bcrypt)
  -- Note: pgcrypto must be enabled in the extensions
  v_encrypted_password := crypt(p_password, gen_salt('bf'));

  -- 4. Insert into auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    p_email,
    v_encrypted_password,
    now(),
    '{"provider": "email", "providers": ["email"]}',
    jsonb_build_object('nickname', p_nickname),
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO v_user_id;

  -- 5. Insert into public.profiles
  -- The trigger 'on_auth_user_created' might already exist, 
  -- but we'll do it explicitly or handle potential conflicts.
  -- To be safe, we check if it was already created by a trigger.
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = v_user_id) THEN
    INSERT INTO public.profiles (
      user_id,
      nickname,
      is_admin,
      created_at,
      updated_at
    )
    VALUES (
      v_user_id,
      p_nickname,
      p_is_admin,
      now(),
      now()
    );
  ELSE
    -- If trigger created it, update the nickname and admin status
    UPDATE public.profiles
    SET nickname = p_nickname,
        is_admin = p_is_admin,
        updated_at = now()
    WHERE user_id = v_user_id;
  END IF;

  RETURN v_user_id;
END;
$$;

-- Grant execution to authenticated users (who pass the authorize_admin check)
GRANT EXECUTE ON FUNCTION public.admin_create_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_user TO service_role;
