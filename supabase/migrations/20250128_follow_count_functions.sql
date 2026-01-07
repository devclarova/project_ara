-- ==========================================
-- Database Functions for Follow Counts
-- ==========================================
-- These update followers/following counts in profiles table
-- Safe increment/decrement (never go below 0)
-- ==========================================

-- Increment followers count
CREATE OR REPLACE FUNCTION increment_followers_count(profile_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET followers_count = COALESCE(followers_count, 0) + 1
  WHERE id = profile_id;
END;
$$;

-- Decrement followers count (safe - never below 0)
CREATE OR REPLACE FUNCTION decrement_followers_count(profile_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET followers_count = GREATEST(COALESCE(followers_count, 0) - 1, 0)
  WHERE id = profile_id;
END;
$$;

-- Increment following count
CREATE OR REPLACE FUNCTION increment_following_count(profile_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET following_count = COALESCE(following_count, 0) + 1
  WHERE id = profile_id;
END;
$$;

-- Decrement following count (safe - never below 0)
CREATE OR REPLACE FUNCTION decrement_following_count(profile_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET following_count = GREATEST(COALESCE(following_count, 0) - 1, 0)
  WHERE id = profile_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_followers_count TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_followers_count TO authenticated;
GRANT EXECUTE ON FUNCTION increment_following_count TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_following_count TO authenticated;

-- Comments
COMMENT ON FUNCTION increment_followers_count IS 'Safely increment followers count in profiles table';
COMMENT ON FUNCTION decrement_followers_count IS 'Safely decrement followers count (never below 0)';
COMMENT ON FUNCTION increment_following_count IS 'Safely increment following count in profiles table';
COMMENT ON FUNCTION decrement_following_count IS 'Safely decrement following count (never below 0)';
