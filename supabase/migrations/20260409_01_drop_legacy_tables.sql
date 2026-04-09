-- 20260409_01_drop_legacy_tables.sql
-- 프론트엔드 연결이 전혀 없는 1차 데드 테이블 2개를 영구 삭제하는 마이그레이션
-- Linter Error 일부 해결 조치용

-- 1. public.users
-- auth.users와 혼동되어 생긴 평문 password 노출 취약점 보유 더미 테이블입니다. 앱 구동에 영향이 없습니다.
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. signup_error_log
-- 과거 테스트나 디버깅용으로 만든 에러 보관용 테이블로, 현재 사용되지 않습니다.
DROP TABLE IF EXISTS public.signup_error_log CASCADE;

-- [참고]: user_id_map 테이블은 사용자님의 예리한 지적대로, 레거시 시스템(숫자형 old_id)을 
-- 현재의 문자열 UUID(new_id)로 매핑해주는 핵심 히스토리 테이블로 확인되어 삭제 명단에서 제외했습니다!
