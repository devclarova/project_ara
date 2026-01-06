-- Complete RLS policy fix for user_follows
-- This replaces all policies with simpler, working ones

-- 1. Drop all existing policies
DROP POLICY IF EXISTS "Users can view active follows" ON user_follows;
DROP POLICY IF EXISTS "Users can follow others" ON user_follows;
DROP POLICY IF EXISTS "Users can unfollow (soft delete)" ON user_follows;

-- 2. Simple SELECT policy - anyone can view active follows
CREATE POLICY "select_active_follows" ON user_follows
  FOR SELECT 
  USING (ended_at IS NULL);

-- 3. Simple INSERT policy - users can create follows
CREATE POLICY "insert_follow" ON user_follows
  FOR INSERT 
  WITH CHECK (
    -- Must be authenticated
    auth.uid() IS NOT NULL
    -- Must own the follower_id
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = follower_id 
      AND user_id = auth.uid()
    )
    -- Cannot follow self
    AND follower_id != following_id
  );

-- 4. Simple UPDATE policy - users can soft delete their own follows
CREATE POLICY "update_unfollow" ON user_follows
  FOR UPDATE
  USING (
    -- Must be authenticated
    auth.uid() IS NOT NULL
    -- Must own the follower_id
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = follower_id 
      AND user_id = auth.uid()
    )
  );
  -- No WITH CHECK - allow any update if USING passes

-- Comments
COMMENT ON POLICY "select_active_follows" ON user_follows 
  IS 'Anyone can view active (non-ended) follows';
COMMENT ON POLICY "insert_follow" ON user_follows 
  IS 'Authenticated users can follow others';
COMMENT ON POLICY "update_unfollow" ON user_follows 
  IS 'Users can update (unfollow) their own follow records';
