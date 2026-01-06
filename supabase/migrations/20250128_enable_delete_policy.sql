-- Enable DELETE policy for user_follows (temporary workaround)
-- This allows hard delete until soft delete RLS is fixed

DROP POLICY IF EXISTS "delete_unfollow" ON user_follows;

CREATE POLICY "delete_unfollow" ON user_follows
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = follower_id 
      AND user_id = auth.uid()
    )
    AND ended_at IS NULL
  );

COMMENT ON POLICY "delete_unfollow" ON user_follows 
  IS 'Temporary: Allow users to delete (unfollow) their own follows';
