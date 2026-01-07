-- Add is_admin column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Comment on column
COMMENT ON COLUMN public.profiles.is_admin IS 'Indicates if the user has admin privileges';

-- Update RLS if necessary (assuming profiles are publicly readable, so is_admin is too)
-- If we want to hide is_admin from public, we would need column-level security or separate table,
-- but for this app, public visibility of admin status is acceptable.
