-- =====================================================
-- word 및 culture_note 테이블 RLS 정책 추가
-- =====================================================

-- 1. word 테이블 (학습 단어용)
ALTER TABLE public.word ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "word_select_all" ON public.word;
DROP POLICY IF EXISTS "word_admin_all" ON public.word;
CREATE POLICY "word_select_all" ON public.word FOR SELECT USING (true);
CREATE POLICY "word_admin_all" ON public.word FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true)
);

-- 2. culture_note 테이블 (문화 노트 부모 테이블)
ALTER TABLE public.culture_note ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "culture_note_select_all" ON public.culture_note;
DROP POLICY IF EXISTS "culture_note_admin_all" ON public.culture_note;
CREATE POLICY "culture_note_select_all" ON public.culture_note FOR SELECT USING (true);
CREATE POLICY "culture_note_admin_all" ON public.culture_note FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true)
);
