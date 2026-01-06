-- Add banned_until column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS banned_until TIMESTAMP WITH TIME ZONE;

-- Comment on column
COMMENT ON COLUMN public.profiles.banned_until IS 'Timestamp until which the user is banned. NULL means not banned.';

-- Allow admins to update profiles (for banning)
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
  );
