-- ==========================================
-- Admin Permissions for `word` table
-- ==========================================

-- 1. Enable RLS on word table (if not already enabled)
ALTER TABLE word ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing admin policies if they exist (to prevent duplicates)
DROP POLICY IF EXISTS "Admins can insert words" ON word;
DROP POLICY IF EXISTS "Admins can update words" ON word;
DROP POLICY IF EXISTS "Admins can delete words" ON word;

-- 3. Create Admin Write Policies
CREATE POLICY "Admins can insert words"
  ON word FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update words"
  ON word FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete words"
  ON word FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Ensure public read access (if needed)
DROP POLICY IF EXISTS "Public can view words" ON word;
CREATE POLICY "Public can view words"
  ON word FOR SELECT
  USING (true);

-- ==========================================
-- Verify user_roles exists and is structured correctly (Safety check)
-- ==========================================
-- This assumes you have a user_roles table or similar logic for checking admin status.
-- If the project uses 'profiles.role' instead of 'user_roles', the policy should be adjusted.
