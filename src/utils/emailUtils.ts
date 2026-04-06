/**
 * 사용자 식별 정보 보안 마스킹 유틸리티(User Identity Security Masking Utility):
 * - 목적(Why): 화면 노출 시 개인정보(이메일 등) 일부를 가려 보안 사고를 방지하고 프라이버시를 보호함
 * - 방법(How): 정규 표현식 및 문자열 슬라이싱을 통해 도메인 정보를 제외한 로컬 파트에 마스킹 알고리즘을 적용함
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  
  const [localPart, domain] = email.split('@');
  
  if (localPart.length <= 1) {
    return `${localPart}***@${domain}`;
  }
  
  const maskedLocal = localPart[0] + '***';
  return `${maskedLocal}@${domain}`;
}
