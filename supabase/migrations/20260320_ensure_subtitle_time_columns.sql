-- subtitle_start_time 및 subtitle_end_time 컬럼이 없을 경우 안전하게 추가합니다.
DO $$ 
BEGIN
    -- subtitle_start_time 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema='public' AND table_name='subtitle' AND column_name='subtitle_start_time'
    ) THEN
        ALTER TABLE public.subtitle ADD COLUMN subtitle_start_time numeric;
    END IF;

    -- subtitle_end_time 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema='public' AND table_name='subtitle' AND column_name='subtitle_end_time'
    ) THEN
        ALTER TABLE public.subtitle ADD COLUMN subtitle_end_time numeric;
    END IF;
END $$;

-- Supabase PostgREST(API) 스키마 캐시 강제 새로고침
NOTIFY pgrst, 'reload schema';
