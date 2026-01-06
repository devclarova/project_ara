-- ⚠️ WARNING: This script is for DEVELOPMENT/TEST ENVIRONMENT ONLY!
-- DO NOT run this in production!
-- 
-- This script clears all test moderation data:
-- - Reports (신고 내역)
-- - Blocked users (차단 내역) - optional

-- Clear all reports
TRUNCATE TABLE public.reports CASCADE;

-- Optional: Clear all blocked_users from profiles
-- Uncomment if you want to reset all user blocks
-- UPDATE public.profiles SET blocked_users = '[]'::jsonb WHERE blocked_users IS NOT NULL;

-- Reset auto-increment sequences
ALTER SEQUENCE IF EXISTS reports_id_seq RESTART WITH 1;

-- Verification queries (uncomment to check results)
-- SELECT COUNT(*) as total_reports FROM public.reports;
-- SELECT COUNT(*) as profiles_with_blocks FROM public.profiles WHERE jsonb_array_length(blocked_users) > 0;

-- Add timestamp comment
COMMENT ON TABLE public.reports IS 'Test data cleared on ' || NOW()::TEXT;


