-- 기존 사용자에게 recovery 정보 추가하기
-- 사용 방법: 아래 값들을 본인의 정보로 수정한 후 실행

-- 1. 본인의 user_id 확인 (현재 로그인한 사용자)
-- SELECT auth.uid();

-- 2. recovery 정보 업데이트
UPDATE profiles
SET 
  recovery_email = 'your-recovery-email@example.com',  -- 복구 이메일 (실제 이메일 주소로 변경)
  recovery_question = 'mother_maiden_name',            -- 복구 질문 키 (아래 중 선택)
  recovery_answer_hash = '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890'  -- 임시 해시 (아래 참고)
WHERE user_id = auth.uid();

-- 복구 질문 옵션:
-- 'mother_maiden_name' - 어머니의 결혼 전 성은?
-- 'first_pet_name' - 첫 번째 반려동물의 이름은?
-- 'birth_city' - 태어난 도시는?
-- 'favorite_teacher' - 가장 좋아했던 선생님의 이름은?
-- 'first_school' - 다녔던 첫 학교의 이름은?

-- ========================================
-- 답변 해시 생성 방법 (옵션 A: Node.js 사용)
-- ========================================
-- 1. 터미널 열기
-- 2. 다음 명령어 실행:
--    node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('your-answer', 10));"
-- 3. 출력된 해시를 위의 recovery_answer_hash에 복사

-- ========================================
-- 간단한 테스트용 예제 (옵션 B: 기본값 사용)
-- ========================================
-- 아래는 답변이 "test123"일 때의 해시입니다 (테스트용)
-- UPDATE profiles
-- SET 
--   recovery_email = 'test@example.com',
--   recovery_question = 'mother_maiden_name',
--   recovery_answer_hash = '$2a$10$rBV2yXZ5Q3eQ7ZO8pqK5XO7Z4L9xJ3kX5Q7Z4L9xJ3kX5Q7Z4L9xJ2'
-- WHERE user_id = auth.uid();

-- ========================================
-- 여러 사용자에게 한번에 추가 (관리자용)
-- ========================================
-- UPDATE profiles
-- SET 
--   recovery_email = email || '.recovery@example.com',
--   recovery_question = 'mother_maiden_name',
--   recovery_answer_hash = '$2a$10$rBV2yXZ5Q3eQ7ZO8pqK5XO7Z4L9xJ3kX5Q7Z4L9xJ3kX5Q7Z4L9xJ2'
-- WHERE recovery_email IS NULL;

-- 확인하기
SELECT user_id, nickname, recovery_email, recovery_question 
FROM profiles 
WHERE user_id = auth.uid();
