-- reports 테이블의 target_type 제약조건을 업데이트합니다.
-- 'chat' 타입을 허용하기 위해 기존 제약조건을 삭제하고 다시 생성합니다.

ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_target_type_check;

ALTER TABLE public.reports 
    ADD CONSTRAINT reports_target_type_check 
    CHECK (target_type IN ('tweet', 'reply', 'user', 'chat'));
