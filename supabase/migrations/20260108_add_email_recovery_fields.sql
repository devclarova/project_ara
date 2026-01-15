-- 이메일 복구를 위한 필드 추가
-- 안전한 마이그레이션: ADD COLUMN IF NOT EXISTS 사용
-- 기존 데이터에 영향 없음 (DEFAULT NULL)

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS recovery_question TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS recovery_answer_hash TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS recovery_email TEXT DEFAULT NULL;

-- 인덱스 추가 (이메일 찾기 쿼리 최적화)
-- WHERE 절로 NULL 값 제외하여 인덱스 크기 최적화
CREATE INDEX IF NOT EXISTS idx_profiles_recovery_email 
ON public.profiles(recovery_email) 
WHERE recovery_email IS NOT NULL;

-- 컬럼 설명 추가 (문서화)
COMMENT ON COLUMN public.profiles.recovery_question IS '이메일 찾기 질문 (번역 키)';
COMMENT ON COLUMN public.profiles.recovery_answer_hash IS '이메일 찾기 답변 해시 (bcrypt, 보안)';
COMMENT ON COLUMN public.profiles.recovery_email IS '임시 이메일 (선택, 복구 링크 전송용)';
