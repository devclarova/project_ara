-- ==========================================
-- user_follows table - SAFE VERSION
-- ==========================================
-- Design principles:
-- 1. NO CASCADE deletes - explicit handling required
-- 2. Soft delete support with ended_at
-- 3. Data integrity with constraints
-- 4. Type safety with NOT NULL
-- ==========================================

CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign keys with RESTRICT (safe - prevents accidental deletes)
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE NULL,  -- Soft delete support
  
  -- Constraints
  CONSTRAINT unique_active_follow UNIQUE(follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id),
  CONSTRAINT valid_ended_at CHECK (ended_at IS NULL OR ended_at >= created_at)
);

-- Create indexes for query optimization
CREATE INDEX IF NOT EXISTS idx_follows_follower 
  ON user_follows(follower_id) 
  WHERE ended_at IS NULL;  -- Only active follows

CREATE INDEX IF NOT EXISTS idx_follows_following 
  ON user_follows(following_id) 
  WHERE ended_at IS NULL;  -- Only active follows

CREATE INDEX IF NOT EXISTS idx_follows_created 
  ON user_follows(created_at DESC);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_follows_active 
  ON user_follows(follower_id, following_id) 
  WHERE ended_at IS NULL;

-- Enable RLS (Row Level Security)
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- RLS Policies - Secure and Type-Safe
-- ==========================================

-- Read: Anyone can view active follows
CREATE POLICY "Users can view active follows" ON user_follows
  FOR SELECT 
  USING (ended_at IS NULL);

-- Insert: Only authenticated users can follow (must own follower_id)
CREATE POLICY "Users can follow others" ON user_follows
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = follower_id 
      AND user_id = auth.uid()
    )
    AND follower_id != following_id  -- Extra safety check
    AND ended_at IS NULL  -- Must be active follow
  );

-- Update: Users can only soft-delete (set ended_at)
CREATE POLICY "Users can unfollow (soft delete)" ON user_follows
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = follower_id 
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Only allow setting ended_at, no other modifications
    ended_at IS NOT NULL
    AND follower_id = follower_id  -- Prevent changing FKs
    AND following_id = following_id
  );

-- Delete: DISABLED for safety - use soft delete instead
-- No DELETE policy = hard deletes prevented by RLS

-- ==========================================
-- Comments for maintenance
-- ==========================================
COMMENT ON TABLE user_follows IS 
  'Follow relationships - Uses soft delete pattern (ended_at). Never use hard DELETE.';
COMMENT ON COLUMN user_follows.ended_at IS 
  'Soft delete timestamp - NULL means active follow';
COMMENT ON COLUMN user_follows.follower_id IS 
  'User who is following (with RESTRICT to prevent cascade)';
COMMENT ON COLUMN user_follows.following_id IS 
  'User being followed (with RESTRICT to prevent cascade)';
