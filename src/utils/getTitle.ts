import type { ActiveKey, ActiveSetting, ActiveSystem } from '@/types/settings';

export function getSettingsTitle(active: ActiveSetting) {
  switch (active) {
    case 'password':
      return 'settings.title_password_change';
    case 'sns':
      return 'settings.title_sns_connect';
      case 'withdraw':
      return 'settings.title_withdraw';
    default:
      return '';
  }
}
export function getPolicyTitle(active: ActiveKey) {
  switch (active) {
    case 'terms':
      return 'settings.title_terms';
    case 'privacy':
      return 'settings.title_privacy';
    case 'marketing':
      return 'settings.title_marketing';
    case 'support':
      return 'settings.title_support';
    default:
      return '';
  }
}

export function getSystemTitle(active: ActiveSystem) {
  switch (active) {
    case 'language':
      return 'settings.title_language';
    case 'theme':
      return 'settings.title_theme';
    default:
      return '';
  }
}
