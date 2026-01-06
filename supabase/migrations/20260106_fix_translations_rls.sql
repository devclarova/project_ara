-- Translations Table RLS Fix
-- Error 42501 (RLS violation) and 401 (Unauthorized) indicate missing policies.

-- 1. Create table if not exists (Safety check)
CREATE TABLE IF NOT EXISTS public.translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content_id TEXT NOT NULL,
    original_text TEXT,
    translated_text TEXT,
    source_lang TEXT,
    target_lang TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, content_id, target_lang)
);

-- 2. Enable RLS
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- 3. Consolidate Policies (Drop potential duplicates first)
DROP POLICY IF EXISTS "Users can view their own translations" ON public.translations;
DROP POLICY IF EXISTS "Users can insert their own translations" ON public.translations;
DROP POLICY IF EXISTS "Users can update their own translations" ON public.translations;
DROP POLICY IF EXISTS "Users can delete their own translations" ON public.translations;

-- 4. Create Policies (CRUD for Owner)

-- SELECT
CREATE POLICY "Users can view their own translations"
ON public.translations FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- INSERT
CREATE POLICY "Users can insert their own translations"
ON public.translations FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- UPDATE
CREATE POLICY "Users can update their own translations"
ON public.translations FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE
CREATE POLICY "Users can delete their own translations"
ON public.translations FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 5. Grant Permissions (Sometimes needed for anon/authenticated roles explicitly if defaults were changed)
GRANT ALL ON public.translations TO authenticated;
GRANT ALL ON public.translations TO service_role;
