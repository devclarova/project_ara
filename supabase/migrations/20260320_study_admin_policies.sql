-- =====================================================
-- Study 테이블 관리자 UPDATE/DELETE 정책 + 누락 컬럼 추가
-- =====================================================

-- 1. is_hidden 컬럼이 없으면 추가 (IF NOT EXISTS 활용)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'study' AND column_name = 'is_hidden'
  ) THEN
    ALTER TABLE public.study ADD COLUMN is_hidden boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- 2. is_featured 컬럼이 없으면 추가
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'study' AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE public.study ADD COLUMN is_featured boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- 3. RLS가 활성화되어 있는지 확인하고 활성화
ALTER TABLE public.study ENABLE ROW LEVEL SECURITY;

-- 4. 기존 study 관련 정책 삭제 (충돌 방지)
DROP POLICY IF EXISTS "study_select_all" ON public.study;
DROP POLICY IF EXISTS "study_admin_update" ON public.study;
DROP POLICY IF EXISTS "study_admin_delete" ON public.study;
DROP POLICY IF EXISTS "study_admin_insert" ON public.study;

-- 5. SELECT: 모든 사용자 허용 (공개 데이터)
CREATE POLICY "study_select_all" ON public.study
  FOR SELECT USING (true);

-- 6. UPDATE: 관리자(is_admin=true)만 허용
CREATE POLICY "study_admin_update" ON public.study
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- 7. DELETE: 관리자만 허용
CREATE POLICY "study_admin_delete" ON public.study
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- 8. INSERT: 관리자만 허용
CREATE POLICY "study_admin_insert" ON public.study
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- =====================================================
-- video, words, culture_note_contents 테이블에도 동일 정책 적용
-- =====================================================

-- video 테이블
ALTER TABLE public.video ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "video_select_all" ON public.video;
DROP POLICY IF EXISTS "video_admin_all" ON public.video;
CREATE POLICY "video_select_all" ON public.video FOR SELECT USING (true);
CREATE POLICY "video_admin_all" ON public.video FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true)
);

-- word 테이블
ALTER TABLE public.word ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "word_select_all" ON public.word;
DROP POLICY IF EXISTS "word_admin_all" ON public.word;
CREATE POLICY "word_select_all" ON public.word FOR SELECT USING (true);
CREATE POLICY "word_admin_all" ON public.word FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true)
);


-- culture_note_contents 테이블
ALTER TABLE public.culture_note_contents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "culture_note_contents_select_all" ON public.culture_note_contents;
DROP POLICY IF EXISTS "culture_note_contents_admin_all" ON public.culture_note_contents;
CREATE POLICY "culture_note_contents_select_all" ON public.culture_note_contents FOR SELECT USING (true);
CREATE POLICY "culture_note_contents_admin_all" ON public.culture_note_contents FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true)
);


