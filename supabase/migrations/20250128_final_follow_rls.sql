-- ==========================================
-- FINAL SOLUTION: user_follows RLS Policy
-- ==========================================
-- Root cause: WITH CHECK clause was blocking soft deletes
-- Solution: Remove WITH CHECK entirely from UPDATE policy
-- ==========================================

-- 1. Clean slate - remove all policies
DROP POLICY IF EXISTS "Users can view active follows" ON user_follows;
DROP POLICY IF EXISTS "Users can follow others" ON user_follows;
DROP POLICY IF EXISTS "Users can unfollow (soft delete)" ON user_follows;
DROP POLICY IF EXISTS "select_active_follows" ON user_follows;
DROP POLICY IF EXISTS "insert_follow" ON user_follows;
DROP POLICY IF EXISTS "update_unfollow" ON user_follows;
DROP POLICY IF EXISTS "delete_unfollow" ON user_follows;

-- 2. SELECT: Anyone can view active follows
CREATE POLICY "follow_select" ON user_follows
  FOR SELECT 
  USING (ended_at IS NULL);

-- 3. INSERT: Users can follow others
CREATE POLICY "follow_insert" ON user_follows
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND follower_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
    AND follower_id != following_id
    AND ended_at IS NULL
  );

-- 4. UPDATE: Users can soft delete (unfollow) - NO WITH CHECK!
CREATE POLICY "follow_update" ON user_follows
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND follower_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );
  -- CRITICAL: No WITH CHECK clause!
  -- PostgreSQL will apply USING to the NEW row automatically
  -- WITH CHECK was causing the "new row violates RLS" error

-- 5. DELETE: Explicitly disabled for data safety
-- No DELETE policy = hard deletes prevented

-- ==========================================
-- Verification queries (for testing)
-- ==========================================
COMMENT ON POLICY "follow_select" ON user_follows 
  IS 'Anyone can view active follows (ended_at IS NULL)';
COMMENT ON POLICY "follow_insert" ON user_follows 
  IS 'Authenticated users can follow others (soft delete pattern)';
COMMENT ON POLICY "follow_update" ON user_follows 
  IS 'Users can update their follows (for soft delete). NO WITH CHECK to allow ended_at updates';
COMMENT ON TABLE user_follows 
  IS 'Follow relationships using soft delete pattern. UPDATE sets ended_at. DELETE disabled.';
