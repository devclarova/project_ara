-- ==============================================================================
-- [NUCLEAR OPTION] Profiles RLS Complete Reset & Realtime Fix
-- ==============================================================================

-- 1. Disable RLS momentarily to clear the slate
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Drop legacy triggering policies (if any)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Drop ALL existing policies on profiles (Clean Sweep)
--    We use a DO block to iterate and drop everything to ensure no hidden policies remain.
DO $$ 
DECLARE 
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
END $$;

-- 4. Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Define Essential Policies (Only what is needed)

-- A. SELECT: Open to Everyone (Required for Realtime Admin Subscription)
--    관리자가 다른 유저의 상태 변화를 실시간으로 보려면 이 권한이 필수입니다.
CREATE POLICY "profiles_select_public" 
ON public.profiles FOR SELECT 
USING (true);

-- B. UPDATE: Self-Update (Required for Logout Status Update)
--    사용자가 자신의 is_online 상태를 변경할 수 있어야 합니다.
CREATE POLICY "profiles_update_self" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

-- C. INSERT: System/Self usually handled by triggers, but allowing self-insert for robustness
CREATE POLICY "profiles_insert_self" 
ON public.profiles FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

-- 6. Ensure Realtime is Enabled
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
-- (Optional) If not already in publication
-- ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- 7. Reset Trigger for New User Creation (Standard Pattern)
--    This ensures new users get a profile.
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nickname, email, is_online, last_active_at)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'nickname', new.email), 
    new.email,
    true,
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create trigger if valid
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

