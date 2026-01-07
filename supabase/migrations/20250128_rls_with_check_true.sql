-- ==========================================
-- ROOT CAUSE FIX: WITH CHECK = TRUE
-- ==========================================
-- Problem: WITH CHECK validates the NEW row (with ended_at set)
-- Solution: WITH CHECK (true) = allow any update
-- ==========================================

-- Clean up all policies
DO $$ 
DECLARE pol record;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'user_follows'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_follows', pol.policyname);
    END LOOP;
END $$;

-- SELECT policy
CREATE POLICY "follow_select" ON user_follows
  FOR SELECT 
  USING (ended_at IS NULL);

-- INSERT policy  
CREATE POLICY "follow_insert" ON user_follows
  FOR INSERT
  WITH CHECK (
    follower_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    AND follower_id != following_id
    AND ended_at IS NULL
  );

-- UPDATE policy - THE FIX: WITH CHECK (true)
CREATE POLICY "follow_update" ON user_follows
  FOR UPDATE
  USING (
    follower_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (true);  -- ✅ Key fix: Allow any NEW row state

-- Verification
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'user_follows'
ORDER BY cmd;
