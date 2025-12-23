-- Add notification setting columns to profiles table
-- Use IF NOT EXISTS to prevent errors if running multiple times
-- Default value is TRUE (on) for all notifications

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notify_comment BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notify_like BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notify_follow BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notify_chat BOOLEAN DEFAULT TRUE;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.notify_comment IS 'Enable push notifications for comments';
COMMENT ON COLUMN public.profiles.notify_like IS 'Enable push notifications for likes';
COMMENT ON COLUMN public.profiles.notify_follow IS 'Enable push notifications for follows';
COMMENT ON COLUMN public.profiles.notify_chat IS 'Enable push notifications for direct messages';
