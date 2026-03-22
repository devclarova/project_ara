-- culture_note 테이블에 contents 컬럼이 누락되어 발생하는 오류 해결 스크립트
-- 이 스크립트를 Supabase SQL Editor에서 실행하면 즉시 문제가 해결됩니다.

-- 1. culture_note 테이블에 contents 컬럼 추가
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'culture_note' AND column_name = 'contents'
  ) THEN
    ALTER TABLE public.culture_note ADD COLUMN contents text;
  END IF;
END $$;

-- 2. 관련 RLS 정책 재확인 및 적용
ALTER TABLE public.culture_note ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "culture_note_select_all" ON public.culture_note;
DROP POLICY IF EXISTS "culture_note_admin_all" ON public.culture_note;

CREATE POLICY "culture_note_select_all" ON public.culture_note FOR SELECT USING (true);
CREATE POLICY "culture_note_admin_all" ON public.culture_note FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true)
);

-- 3. culture_note_contents 테이블 RLS 정책 (자식 테이블)
ALTER TABLE public.culture_note_contents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "culture_note_contents_select_all" ON public.culture_note_contents;
DROP POLICY IF EXISTS "culture_note_contents_admin_all" ON public.culture_note_contents;

CREATE POLICY "culture_note_contents_select_all" ON public.culture_note_contents FOR SELECT USING (true);
CREATE POLICY "culture_note_contents_admin_all" ON public.culture_note_contents FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true)
);
