/**
 * 이메일 주소를 마스킹 처리
 * 예: user@example.com -> u***@example.com
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
