-- Function to check if a social identity was previously unlinked
-- Returns information to guide user decision

CREATE OR REPLACE FUNCTION check_unlinked_identity(
  current_user_id uuid,
  provider_param text,
  identity_id_param text,
  current_email_param text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  original_email_stored text;
BEGIN
  -- 1. Check if this identity was previously unlinked
  -- We look for the MOST RECENT unlink record for this specific identity
  SELECT original_email INTO original_email_stored
  FROM unlinked_identities
  WHERE provider = provider_param 
  AND identity_id = identity_id_param
  ORDER BY unlinked_at DESC
  LIMIT 1;

  -- 2. If no record exists, it is not a relink attempt
  IF original_email_stored IS NULL THEN
    RETURN json_build_object(
      'should_block', false,
      'reason', null,
      'original_email_masked', null,
      'is_same_email', false
    );
  END IF;

  -- 3. Block login to allow user to decide (Reconnect or Continue New)
  IF original_email_stored = current_email_param THEN
    RETURN json_build_object(
      'should_block', true,
      'reason', 'same_email',
      'original_email_masked', mask_email(original_email_stored),
      'is_same_email', true
    );
  ELSE
    RETURN json_build_object(
      'should_block', true,
      'reason', 'different_email',
      'original_email_masked', mask_email(original_email_stored),
      'is_same_email', false
    );
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error info for debugging
    RETURN json_build_object(
      'should_block', false,
      'reason', 'error',
      'error', SQLERRM
    );
END;
$$;
