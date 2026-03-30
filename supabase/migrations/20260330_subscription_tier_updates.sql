-- Add subscription plan to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'premium'));

-- Add subscription tier requirements to learning contents (if learning_contents table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'learning_contents') THEN
        ALTER TABLE public.learning_contents
        ADD COLUMN IF NOT EXISTS required_plan text NOT NULL DEFAULT 'free' CHECK (required_plan IN ('free', 'basic', 'premium'));
    END IF;
END $$;
