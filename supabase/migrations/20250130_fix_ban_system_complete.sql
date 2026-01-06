-- Comprehensive Fix for Ban System
-- 1. Ensure 'banned_until' column exists in profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS banned_until TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.profiles.banned_until IS 'Timestamp until which the user is banned. NULL means not banned.';

-- 2. Ensure 'is_admin' column exists in profiles (Required for policy)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 3. Fix RLS Policies for Admin Updates
-- Drop potentially conflicting or incorrect policies
DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Create the correct policy using user_id
CREATE POLICY "profiles_admin_update" ON public.profiles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- 4. Enable RLS (Just in case)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
