-- =====================================================
-- subtitle 테이블 RLS 정책 (관리자 권한 허용)
-- =====================================================

ALTER TABLE public.subtitle ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (충돌 방지)
DROP POLICY IF EXISTS "subtitle_select_all" ON public.subtitle;
DROP POLICY IF EXISTS "subtitle_admin_all" ON public.subtitle;

-- 누구나 읽기 허용
CREATE POLICY "subtitle_select_all" ON public.subtitle FOR SELECT USING (true);

-- 관리자(is_admin=true)만 데이터 추가/수정/삭제 허용
CREATE POLICY "subtitle_admin_all" ON public.subtitle FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- 스키마 캐시 강제 새로고침 (혹시 모를 에러 방지용)
NOTIFY pgrst, 'reload schema';
