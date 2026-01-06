-- ==========================================
-- user_blocks RLS policies (same pattern as user_follows)
-- ==========================================

-- Clean up any existing policies
DO $$ 
DECLARE pol record;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'user_blocks'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_blocks', pol.policyname);
    END LOOP;
END $$;

-- SELECT: View active blocks (your own blocks or global)
CREATE POLICY "block_select" ON user_blocks
  FOR SELECT 
  USING (
    ended_at IS NULL 
    OR blocker_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- INSERT: Create new blocks  
CREATE POLICY "block_insert" ON user_blocks
  FOR INSERT
  WITH CHECK (
    blocker_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    AND blocker_id != blocked_id
    AND ended_at IS NULL
  );

-- UPDATE: Soft delete (unblock)
CREATE POLICY "block_update" ON user_blocks
  FOR UPDATE
  USING (
    blocker_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (true);  -- Allow any update if user owns it

-- Comments
COMMENT ON POLICY "block_select" ON user_blocks 
  IS 'Users can view active blocks and their own soft-deleted blocks';
COMMENT ON POLICY "block_insert" ON user_blocks 
  IS 'Authenticated users can block others (soft delete pattern)';
COMMENT ON POLICY "block_update" ON user_blocks 
  IS 'Users can update (unblock) their own blocks';
