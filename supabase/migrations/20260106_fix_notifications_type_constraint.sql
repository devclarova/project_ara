-- [MIGRATION] Fix notifications type constraint to allow 'system' and other types
-- This fixes the 400 Bad Request error when inserting system notifications (e.g., from admin actions)

DO $$ 
BEGIN
    -- 1. Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'notifications_type_check'
    ) THEN
        ALTER TABLE public.notifications DROP CONSTRAINT notifications_type_check;
    END IF;

    -- 2. Add new constraint with expanded type list
    ALTER TABLE public.notifications 
    ADD CONSTRAINT notifications_type_check 
    CHECK (type IN ('like', 'comment', 'mention', 'follow', 'reply', 'system', 'repost', 'like_comment', 'like_feed'));

    -- 3. Confirm Column Type (Ensure it's text or varchar)
    -- Typically it's already text, but good to ensure type safety.
END $$;
