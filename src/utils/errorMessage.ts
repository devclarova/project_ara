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

/** HTML 문자열에서 텍스트만 추출 (ReplyCard 등에서 사용) */
export function htmlToPlainText(html: string): string {
  if (!html) return '';
  // 브라우저 환경이 아닐 경우(SSR 등)를 대비한 체크
  if (typeof window === 'undefined') return html;
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  } catch (e) {
    // 대체 수단: 간단한 정규식으로 태그 제거
    return html.replace(/<[^>]*>/g, '');
  }
}
