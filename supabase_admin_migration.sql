-- ============================================
-- 관리자 인증 시스템 DB 마이그레이션
-- ⚠️ 주의: 각 단계를 순서대로 실행하세요
-- ============================================

-- ============================================
-- STEP 0: profiles 테이블 구조 확인 (먼저 실행!)
-- ============================================

-- profiles 테이블의 모든 컬럼 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- profiles 테이블 데이터 샘플 확인 (처음 5개)
SELECT * FROM profiles LIMIT 5;

-- ⚠️ 위 결과를 확인 후 STEP 1로 진행하세요
-- ============================================

-- ============================================
-- STEP 1: 컬럼 추가 (필수)
-- ============================================

-- profiles 테이블에 is_admin 컬럼 추가
-- IF NOT EXISTS를 사용하여 이미 존재하면 건너뜀 (안전)
-- DEFAULT FALSE로 기존 사용자는 모두 비관리자로 설정 (기존 데이터 보존)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- ============================================
-- STEP 2: 인덱스 추가 (필수, 성능 최적화)
-- ============================================

-- is_admin이 TRUE인 행만 인덱싱 (관리자는 소수이므로 효율적)
-- IF NOT EXISTS를 사용하여 중복 생성 방지 (안전)
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin 
ON profiles(is_admin) 
WHERE is_admin = TRUE;

-- ============================================
-- STEP 3: RLS 정책 추가 (선택사항 - 건너뛰어도 됨)
-- ⚠️ 기존 RLS 정책이 있다면 이 부분은 건너뛰세요
-- ============================================

-- 현재 profiles 테이블의 RLS 정책 확인
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- 기존 정책이 없는 경우에만 실행
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users cannot modify is_admin'
  ) THEN
    CREATE POLICY "Users cannot modify is_admin" 
    ON profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
      (is_admin IS NOT DISTINCT FROM (SELECT is_admin FROM profiles WHERE id = auth.uid()))
    );
  END IF;
END $$;

-- ============================================
-- STEP 4: 관리자 계정 설정 (필수)
-- ⚠️ 방법 A 또는 B 중 하나를 선택하세요
-- ============================================

-- 방법 A: auth.users에서 email로 찾아서 설정 (권장)
-- ⚠️ 이메일을 본인의 실제 이메일로 변경하세요!
UPDATE profiles 
SET is_admin = TRUE 
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email = 'your@email.com'  -- ⚠️ 실제 이메일로 변경!
);

-- 여러 관리자 한번에 설정
UPDATE profiles 
SET is_admin = TRUE 
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin1@email.com',  -- ⚠️ 실제 이메일로 변경
    'admin2@email.com',  -- ⚠️ 실제 이메일로 변경
    'admin3@email.com'   -- ⚠️ 실제 이메일로 변경
  )
);

-- 방법 B: id로 직접 설정 (email을 모르는 경우)
-- 먼저 본인의 id 확인:
-- SELECT p.id, au.email 
-- FROM profiles p
-- JOIN auth.users au ON p.id = au.id
-- LIMIT 10;

-- id 확인 후 아래 실행:
-- UPDATE profiles 
-- SET is_admin = TRUE 
-- WHERE id = 'your-user-id-here';  -- ⚠️ 실제 id로 변경!

-- ============================================
-- STEP 5: 확인 쿼리 (필수)
-- ============================================

-- 관리자로 설정된 계정 확인 (auth.users와 조인)
SELECT 
  p.id, 
  au.email,
  p.is_admin, 
  p.created_at
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE p.is_admin = TRUE
ORDER BY p.created_at;

-- 전체 사용자 수 및 관리자 수 확인
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE is_admin = TRUE) as admin_users,
  COUNT(*) FILTER (WHERE is_admin = FALSE) as regular_users
FROM profiles;

-- profiles 테이블의 모든 컬럼과 함께 관리자 확인
SELECT p.*, au.email
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE p.is_admin = TRUE;

-- ============================================
-- 롤백 방법 (문제 발생 시)
-- ============================================

-- is_admin 컬럼 제거 (주의: 관리자 설정 모두 삭제됨)
-- ALTER TABLE profiles DROP COLUMN IF EXISTS is_admin;

-- 인덱스 제거
-- DROP INDEX IF EXISTS idx_profiles_is_admin;

-- RLS 정책 제거 (추가한 경우에만)
-- DROP POLICY IF EXISTS "Users cannot modify is_admin" ON profiles;

-- ============================================
-- 안전성 체크리스트
-- ============================================
/*
✅ IF NOT EXISTS 사용 - 중복 실행 시 안전
✅ DEFAULT FALSE - 기존 사용자 데이터 보존
✅ 데이터 삭제 없음 - UPDATE만 사용
✅ 트리거 사용 안 함
✅ 롤백 방법 제공
✅ profiles 테이블 사용 (users 아님)
✅ email은 auth.users와 조인으로 확인
⚠️ RLS 정책은 선택사항 - 기존 정책 확인 후 적용
⚠️ STEP 0으로 profiles 구조 먼저 확인 권장
*/
