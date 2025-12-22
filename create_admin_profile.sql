-- ============================================
-- 소셜 로그인 사용자 관리자 프로필 생성
-- ============================================

-- 방법 1: 기존 프로필을 참고하여 생성 (권장)
-- 먼저 기존 프로필 하나를 확인
SELECT * FROM profiles LIMIT 1;

-- 방법 2: 최소 필수값으로 생성
-- ⚠️ 아래 값들을 실제 값으로 변경하세요!
INSERT INTO profiles (
  id,
  user_id,
  nickname,
  birthday,
  gender,
  country,
  created_at,
  updated_at,
  is_online,
  tos_agreed,
  privacy_agreed,
  age_confirmed,
  marketing_opt_in,
  is_onboarded,
  is_public,
  is_admin
) VALUES (
  '8671c71e-ed64-4bce-998b-6d5a487219d5',  -- id (auth.users의 id)
  '8671c71e-ed64-4bce-998b-6d5a487219d5',  -- user_id (같은 값)
  'Admin',                                   -- ⚠️ 닉네임 변경
  '2000-01-01',                             -- ⚠️ 생년월일 변경
  'other',                                   -- ⚠️ 성별 (male/female/other)
  'South Korea',                            -- ⚠️ 국가 변경
  NOW(),                                    -- created_at
  NOW(),                                    -- updated_at
  FALSE,                                    -- is_online
  TRUE,                                     -- tos_agreed
  TRUE,                                     -- privacy_agreed
  TRUE,                                     -- age_confirmed
  FALSE,                                    -- marketing_opt_in
  TRUE,                                     -- is_onboarded
  TRUE,                                     -- is_public
  TRUE                                      -- is_admin ⭐
)
ON CONFLICT (id) DO UPDATE SET is_admin = TRUE;

-- 방법 3: auth.users에서 email 가져오기 (간단)
-- 이메일로 찾아서 생성
INSERT INTO profiles (
  id,
  user_id,
  nickname,
  birthday,
  gender,
  country,
  created_at,
  updated_at,
  is_online,
  tos_agreed,
  privacy_agreed,
  age_confirmed,
  marketing_opt_in,
  is_onboarded,
  is_public,
  is_admin
)
SELECT 
  id,
  id as user_id,
  COALESCE(raw_user_meta_data->>'name', email) as nickname,  -- 소셜 로그인 이름 또는 이메일
  '2000-01-01'::date as birthday,
  'other' as gender,
  'South Korea' as country,
  NOW() as created_at,
  NOW() as updated_at,
  FALSE as is_online,
  TRUE as tos_agreed,
  TRUE as privacy_agreed,
  TRUE as age_confirmed,
  FALSE as marketing_opt_in,
  TRUE as is_onboarded,
  TRUE as is_public,
  TRUE as is_admin
FROM auth.users
WHERE email = 'your@email.com'  -- ⚠️ 본인 이메일로 변경!
ON CONFLICT (id) DO UPDATE SET is_admin = TRUE;

-- ============================================
-- 확인 쿼리
-- ============================================

-- 생성된 프로필 확인
SELECT p.*, au.email
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE p.is_admin = TRUE;
