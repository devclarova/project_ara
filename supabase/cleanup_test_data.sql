-- 테스트 데이터 초기화 스크립트 (제재 및 신고 내역 삭제)

-- 1. 제재 이력 삭제 (Sanction History)
DELETE FROM public.sanction_history;

-- 2. 신고 내역 삭제 (Reports)
DELETE FROM public.reports;

-- 3. 사용자 제재 상태 초기화 (Profiles)
-- 모든 사용자의 제재 기간(banned_until)을 초기화합니다.
UPDATE public.profiles
SET banned_until = NULL;
