-- Verify exact policy definitions
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,        -- USING clause
  with_check   -- WITH CHECK clause
FROM pg_policies 
WHERE tablename = 'user_follows'
ORDER BY cmd;

-- This will show us the EXACT policy definitions including WITH CHECK
