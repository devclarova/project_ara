import type { ActiveKey, ActiveSetting, ActiveSystem } from '@/types/settings';

export function getSettingsTitle(active: ActiveSetting) {
  switch (active) {
    case 'password':
      return '비밀번호 변경';
    case 'sns':
      return 'SNS 계정 연결';
      case 'withdraw':
      return '계정 탈퇴';
    default:
      return '';
  }
}
export function getPolicyTitle(active: ActiveKey) {
  switch (active) {
    case 'terms':
      return '이용약관';
    case 'privacy':
      return '개인정보처리방침';
    case 'marketing':
      return '마케팅 정보 수신';
    case 'support':
      return '고객센터';
    default:
      return '';
  }
}

export function getSystemTitle(active: ActiveSystem) {
  switch (active) {
    case 'language':
      return '언어 변경';
    case 'theme':
      return '테마 변경';
    default:
      return '';
  }
}
