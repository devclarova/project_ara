import bcrypt from 'bcryptjs';

/**
 * 복구 답변 해싱
 * - 소문자 변환 + trim으로 대소문자 구분 제거
 * - bcrypt rounds=10 (보안과 성능의 적절한 균형)
 */
export async function hashRecoveryAnswer(answer: string): Promise<string> {
  const normalized = answer.trim().toLowerCase();
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(normalized, salt);
}

/**
 * 복구 답변 검증
 * - 입력된 답변과 저장된 해시 비교
 */
export async function verifyRecoveryAnswer(
  answer: string,
  hash: string
): Promise<boolean> {
  const normalized = answer.trim().toLowerCase();
  return bcrypt.compare(normalized, hash);
}
