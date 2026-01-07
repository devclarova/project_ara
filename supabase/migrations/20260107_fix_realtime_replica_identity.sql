-- profiles 테이블의 모든 컬럼 변경 사항이 실시간으로 전송되도록 설정 강화
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- 만약 supabase_realtime 출판물에 테이블이 누락된 경우를 대비해 확실히 추가
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
