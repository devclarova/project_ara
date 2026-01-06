-- Temporary: Disable RLS for debugging
-- WARNING: This is for TESTING ONLY

-- Disable RLS temporarily to test if the issue is with policies
ALTER TABLE user_follows DISABLE ROW LEVEL SECURITY;

-- After testing, re-enable with:
-- ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
