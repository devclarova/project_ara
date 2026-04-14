-- 20260409_03_fix_linters.sql
-- 잔여 WARN 시스템 에러 수정 및 보안 경로(search_path) 고정 마이그레이션

DO $$
DECLARE
    r RECORD;
BEGIN
    -------------------------------------------------------------------------------
    -- [Group 3 패치] Extension in Public 에러 해결
    -- public 스키마에 방치된 확장 프로그램들을 안전한 extensions 스키마로 격리
    -------------------------------------------------------------------------------
    CREATE SCHEMA IF NOT EXISTS extensions;
    
    -- pg_trgm 이동
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
        ALTER EXTENSION pg_trgm SET SCHEMA extensions;
    END IF;
    
    -- unaccent 이동
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'unaccent') THEN
        ALTER EXTENSION unaccent SET SCHEMA extensions;
    END IF;

    -------------------------------------------------------------------------------
    -- [Group 2 패치] Function Search Path Mutable 에러 일괄 해결
    -- 해킹 방지를 위해 검색 경로(search_path)가 명시되지 않은 모든 커스텀 함수(30여개) 순회
    -------------------------------------------------------------------------------
    FOR r IN
        SELECT p.proname AS function_name, 
               pg_catalog.pg_get_function_identity_arguments(p.oid) AS args
        FROM pg_catalog.pg_proc p
        JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          -- search_path 설정이 없는 함수만 필터링 (WARN 명단과 100% 일치함)
          AND (p.proconfig IS NULL OR NOT (p.proconfig::text LIKE '%search_path%'))
    LOOP
        -- 기존 앱 로직(검색, 필터 등)이 100% 동일하게 작동하도록,
        -- search_path를 'public'과 방금 만든 'extensions'로 안전하게 고정 주입합니다.
        EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = public, extensions;', r.function_name, r.args);
    END LOOP;
    
END
$$;
