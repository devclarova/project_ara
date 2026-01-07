-- ==========================================
-- COMPLETE RESET & REBUILD: user_follows RLS
-- ==========================================
-- Step 1: Complete cleanup
-- Step 2: Rebuild with minimal, working policies
-- ==========================================

-- STEP 1: Complete cleanup
-- Disable RLS temporarily for clean slate
ALTER TABLE user_follows DISABLE ROW LEVEL SECURITY;

-- Drop ALL possible policies (including ones we may have missed)
DO $$ 
DECLARE 
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_follows'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_follows', pol.policyname);
    END LOOP;
END $$;

-- STEP 2: Rebuild with working policies
-- Re-enable RLS
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- Policy 1: SELECT - View active follows
CREATE POLICY "rls_select_follows" ON user_follows
  FOR SELECT 
  TO authenticated, anon
  USING (ended_at IS NULL);

-- Policy 2: INSERT - Create new follows  
CREATE POLICY "rls_insert_follow" ON user_follows
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User must own the follower profile
    follower_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
    -- Cannot follow self
    AND follower_id != following_id
    -- Must be active follow
    AND ended_at IS NULL
  );

-- Policy 3: UPDATE - Soft delete only
-- CRITICAL: This must allow ended_at to be set
CREATE POLICY "rls_update_follow" ON user_follows
  FOR UPDATE
  TO authenticated
  USING (
    -- User must own the follower profile (for OLD row)
    follower_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    -- User still owns it (for NEW row)
    follower_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
    -- Allow ended_at to be any value (including NOT NULL)
    -- This is the key fix!
  );

-- NO DELETE policy = hard deletes blocked

-- ==========================================
-- Verify installation
-- ==========================================
DO $$
BEGIN
  RAISE NOTICE 'RLS policies installed:';
  RAISE NOTICE '  - rls_select_follows';
  RAISE NOTICE '  - rls_insert_follow';
  RAISE NOTICE '  - rls_update_follow';
  RAISE NOTICE 'Hard DELETE is blocked (no policy)';
END $$;
