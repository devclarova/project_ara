-- word 테이블 관리자 권한 정책 (403 에러 해결)
ALTER TABLE public.word ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "word_select_all" ON public.word;
DROP POLICY IF EXISTS "word_admin_all" ON public.word;
CREATE POLICY "word_select_all" ON public.word FOR SELECT USING (true);
CREATE POLICY "word_admin_all" ON public.word FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true)
);
