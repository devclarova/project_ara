-- Add deleted_at column to tweets table
ALTER TABLE public.tweets 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add deleted_at column to tweet_replies table
ALTER TABLE public.tweet_replies 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add deleted_at column to direct_messages table
ALTER TABLE public.direct_messages 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add comments for clarity
COMMENT ON COLUMN public.tweets.deleted_at IS 'Timestamp when the tweet was soft-deleted by an admin';
COMMENT ON COLUMN public.tweet_replies.deleted_at IS 'Timestamp when the reply was soft-deleted by an admin';
COMMENT ON COLUMN public.direct_messages.deleted_at IS 'Timestamp when the message was soft-deleted by an admin';
