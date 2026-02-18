-- Function to unlink identity from user by user_id and provider
CREATE OR REPLACE FUNCTION unlink_identity(
  target_user_id uuid, 
  provider_param text,
  identity_id_param text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  identity_count integer;
  user_email text;
BEGIN
  -- Check if user has at least 2 identities (cannot unlink the last one)
  SELECT COUNT(*) INTO identity_count
  FROM auth.identities
  WHERE user_id = target_user_id;

  IF identity_count <= 1 THEN
    RETURN json_build_object('success', false, 'error', 'Cannot unlink last identity');
  END IF;

  -- Get user email
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = target_user_id;

  -- Save unlink record BEFORE deletion
  INSERT INTO unlinked_identities (identity_id, provider, original_user_id, original_email)
  VALUES (identity_id_param, provider_param, target_user_id, user_email)
  ON CONFLICT (provider, identity_id) DO UPDATE
  SET original_user_id = target_user_id,
      original_email = user_email,
      unlinked_at = now();

  -- Delete the identity by user_id and provider
  DELETE FROM auth.identities
  WHERE user_id = target_user_id AND provider = provider_param;

  -- Check if deletion was successful
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Identity not found');
  END IF;

  RETURN json_build_object('success', true, 'message', 'Identity unlinked successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;



