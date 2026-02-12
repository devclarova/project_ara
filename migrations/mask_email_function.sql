-- Email masking function for privacy protection
-- Shows first 2 and last 2 characters, masks the middle
-- Always masks at least 1 character for 4-char or shorter emails

CREATE OR REPLACE FUNCTION mask_email(email text) 
RETURNS text AS $$
DECLARE
  local_part text;
  domain_part text;
  masked_local text;
  local_len integer;
BEGIN
  -- Split by @
  local_part := SPLIT_PART(email, '@', 1);
  domain_part := SPLIT_PART(email, '@', 2);
  
  local_len := LENGTH(local_part);
  
  -- Handle different lengths
  IF local_len <= 2 THEN
    -- 1-2 chars: show first char only
    masked_local := SUBSTRING(local_part FROM 1 FOR 1) || '*';
  ELSIF local_len = 3 THEN
    -- 3 chars: show first and last, mask middle
    masked_local := SUBSTRING(local_part FROM 1 FOR 1) || '*' || SUBSTRING(local_part FROM 3 FOR 1);
  ELSIF local_len = 4 THEN
    -- 4 chars: show first 2 and last 1, mask 1
    masked_local := SUBSTRING(local_part FROM 1 FOR 2) || '*' || SUBSTRING(local_part FROM 4 FOR 1);
  ELSE
    -- 5+ chars: show first 2 and last 2, mask middle
    masked_local := 
      SUBSTRING(local_part FROM 1 FOR 2) || 
      REPEAT('*', local_len - 4) ||
      SUBSTRING(local_part FROM local_len - 1 FOR 2);
  END IF;
  
  RETURN masked_local || '@' || domain_part;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Examples:
-- 'a@test.com' -> 'a*@test.com'
-- 'ab@test.com' -> 'a*@test.com'
-- 'abc@test.com' -> 'a*c@test.com'
-- 'abcd@test.com' -> 'ab*d@test.com'
-- 'user@example.com' -> 'us**er@example.com'
-- 'john.doe@gmail.com' -> 'jo****oe@gmail.com'
