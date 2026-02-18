-- [NEW] 20260216 Add last_known_country for real-time tracking
-- Adds a column to store the user's latest detected access country via IP geolocation.

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_known_country TEXT;

COMMENT ON COLUMN public.profiles.last_known_country IS 'Latest detected country via IP geolocation at access time';
