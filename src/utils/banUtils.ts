/**
 * 제재 관련 유틸리티 함수들
 */

/**
 * 제재 기간을 계산하고 포맷팅된 문자열을 반환
 * @param banStartDate 제재 시작 일시 (ISO string)
 * @param banEndDate 제재 종료 일시 (ISO string)
 * @returns 포맷팅된 제재 기간 정보
 */
export function formatBanPeriod(banStartDate: string, banEndDate: string): {
  duration: string;
  startFormatted: string;
  endFormatted: string;
  daysRemaining: number;
} {
  const start = new Date(banStartDate);
  const end = new Date(banEndDate);
  const now = new Date();

  // 총 제재 기간 (일 단위) - 반올림으로 더 정확한 일수 계산
  const totalMilliseconds = end.getTime() - start.getTime();
  const totalDays = Math.round(totalMilliseconds / (1000 * 60 * 60 * 24));
  
  // 남은 기간 (일 단위) - 올림으로 최소 1일은 보장
  const daysRemaining = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // 날짜 포맷: YYYY.MM.DD HH:mm
  const formatDate = (date: Date) => {
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(/\. /g, '.').replace(/\.$/, '');
  };

  return {
    duration: `${totalDays}일`,
    startFormatted: formatDate(start),
    endFormatted: formatDate(end),
    daysRemaining: Math.max(0, daysRemaining)
  };
}

/**
 * 사용자가 현재 제재 중인지 확인
 * @param bannedUntil 제재 종료 일시 (ISO string | null)
 * @returns 제재 중이면 true
 */
export function isBanned(bannedUntil: string | null | undefined): boolean {
  if (!bannedUntil) return false;
  return new Date(bannedUntil) > new Date();
}

/**
 * 제재 메시지 생성
 * @param bannedUntil 제재 종료 일시
 * @returns 제재 안내 메시지
 */
export function getBanMessage(bannedUntil: string, action: string = '이 작업을 수행'): string {
  const endDate = new Date(bannedUntil);
  const now = new Date();
  const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  const formattedDate = endDate.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `이용제한 상태에서는 ${action}할 수 없습니다.\n이용제한 기간: ~${formattedDate} (${daysRemaining}일 남음)`;
}
