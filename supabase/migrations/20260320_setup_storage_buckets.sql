-- 1. 스토리지 버킷 생성 (기존에 없을 경우)
-- 참고: Supabase 대시보드(Storage 메뉴)에서 직접 생성하는 것이 가장 권장됩니다.
-- 아래 SQL은 대시보드 접근이 어려울 때 SQL Editor에서 실행하여 버킷을 생성하는 예시입니다.

INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 스토리지 RLS 정책 설정 (videos 버킷)
-- 모든 사용자가 영상을 볼 수 있도록 허용
CREATE POLICY "Public Access for Videos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'videos' );

-- 관리자만 영상을 업로드/수정/삭제할 수 있도록 허용
CREATE POLICY "Admin All Access for Videos"
ON storage.objects FOR ALL
USING ( 
  bucket_id = 'videos' AND 
  (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true))
)
WITH CHECK ( 
  bucket_id = 'videos' AND 
  (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true))
);


-- 3. 스토리지 RLS 정책 설정 (thumbnails 버킷)
-- 모든 사용자가 썸네일을 볼 수 있도록 허용
CREATE POLICY "Public Access for Thumbnails"
ON storage.objects FOR SELECT
USING ( bucket_id = 'thumbnails' );

-- 관리자만 썸네일을 업로드/수정/삭제할 수 있도록 허용
CREATE POLICY "Admin All Access for Thumbnails"
ON storage.objects FOR ALL
USING ( 
  bucket_id = 'thumbnails' AND 
  (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true))
)
WITH CHECK ( 
  bucket_id = 'thumbnails' AND 
  (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true))
);
