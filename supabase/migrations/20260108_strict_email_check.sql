-- 사용자 입력 이메일이 profiles 테이블의 email 컬럼이나 recovery_email 컬럼에 존재하는지 확인
-- 존재하면 true (중복), 존재하지 않으면 false (사용 가능) 반환
CREATE OR REPLACE FUNCTION check_email_exists_strict(_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE email = _email 
       OR recovery_email = _email
  );
END;
$$;
