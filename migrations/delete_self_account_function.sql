-- Function to safely delete the current user's account from the database
-- Used when a user cancels a relink attempt or chooses to reconnect with an old account
-- This avoids using the insecure admin API on the client side

CREATE OR REPLACE FUNCTION delete_self_account()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_uid uuid;
BEGIN
  -- Get the ID of the user calling this function (authenticated user)
  current_uid := auth.uid();
  
  IF current_uid IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Delete from auth.users (cascades to identities, factors, etc.)
  -- Note: Depending on foreign key constraints in public schema, 
  -- you might need to handle those first if they aren't ON DELETE CASCADE.
  DELETE FROM auth.users WHERE id = current_uid;

  RETURN json_build_object('success', true, 'message', 'Account deleted successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;
