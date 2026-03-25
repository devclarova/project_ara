-- 1. Check all current policies on tweets, tweet_replies, and direct_messages
SELECT 
    schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('tweets', 'tweet_replies', 'direct_messages');

-- 2. Check if the current user is an admin
SELECT user_id, nickname, is_admin 
FROM public.profiles 
WHERE user_id = auth.uid();

-- 3. Check specific tweet status
-- Replace 'YOUR_TWEET_ID' with the ID of the tweet that is still visible
-- SELECT id, content, is_hidden FROM public.tweets WHERE id = 'YOUR_TWEET_ID';
