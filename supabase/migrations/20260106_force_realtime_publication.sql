-- [CRITICAL] Realtime Publication Enforcement
-- RLS 정책만으로는 부족하며, 테이블 자체가 Realtime Publication에 포함되어 있어야 이벤트가 전송됩니다.
-- 기존 마이그레이션에서 주석 처리되었던 부분을 강제로 실행합니다.

BEGIN;

-- 1. Realtime Publication에 profiles 테이블 추가 (없을 경우)
--    "supabase_realtime"은 Supabase의 기본 Publication 이름입니다.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'profiles'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    END IF;
END $$;

-- 2. REPLICA IDENTITY FULL 재확인
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

COMMIT;
