-- Fix RLS policy for unfollow
-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can unfollow (soft delete)" ON user_follows;

-- Create corrected UPDATE policy
CREATE POLICY "Users can unfollow (soft delete)" ON user_follows
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = follower_id 
      AND user_id = auth.uid()
    )
    AND ended_at IS NULL  -- Can only update active follows
  )
  WITH CHECK (
    -- Allow setting ended_at (soft delete)
    -- No other field modifications allowed
    ended_at IS NOT NULL
  );
