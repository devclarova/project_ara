-- =====================================================
-- 과거 버그로 인해 DB에 잘못 저장된 'blob:' 임시 이미지 주소 텍스트를 일괄 삭제합니다.
-- =====================================================

UPDATE public.study 
SET poster_image_url = '' 
WHERE poster_image_url LIKE 'blob:%';

UPDATE public.video 
SET image_url = '' 
WHERE image_url LIKE 'blob:%';

UPDATE public.video 
SET video_url = '' 
WHERE video_url LIKE 'blob:%';
