/**
 * 에러 타입 가드 유틸리티 (Error Type Guard Utilities)
 * - 목적(Why): TypeScript에서 catch 블록의 unknown 타입을 안전하게 narrowing하여
 *              err.message 접근 시 런타임 오류를 방지함
 * - 방법(How): instanceof Error 체크 + 폴백 문자열 변환으로 모든 throw 유형 처리
 */

/** unknown 에러에서 메시지 문자열을 안전하게 추출 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (
    error !== null &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  ) {
    return (error as Record<string, unknown>).message as string;
  }
  return '알 수 없는 오류가 발생했습니다.';
}

/** 에러 여부 타입 가드 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}
