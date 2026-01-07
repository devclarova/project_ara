-- Allow Admins to UPDATE profiles (e.g., set banned_until)
DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles; -- Drop the potentially buggy old policy

CREATE POLICY "profiles_admin_update" ON public.profiles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.is_admin = true
        )
    );
