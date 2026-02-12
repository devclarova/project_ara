export type MenuId = string;

export type SidebarItem = {
  id: MenuId;
  label: string;
  icon?: React.ReactNode;
  keywords?: string[]; // 검색용 키워드 추가
};

export type SettingsLayoutProps = {
  sidebarTitle?: string;
  items: SidebarItem[];
  activeId: MenuId;
  onChange: (id: MenuId) => void;
  children: React.ReactNode; // 오른쪽 콘텐츠(라우팅 or 조건부 렌더링)
};

export type ActiveSetting = 'password' | 'recovery' | 'sns' | 'withdraw' | 'blocked_users' | null;

export type ActiveKey = 'terms' | 'privacy' | 'marketing' | 'support' | null;

export type ActiveSystem = 'language' | 'theme' | null;

export type Mode = 'light' | 'dark' | 'system';
export type Lang =
  | 'ko'
  | 'en'
  | 'ja'
  | 'zh'
  | 'ru'
  | 'vi'
  | 'bn'
  | 'ar'
  | 'hi'
  | 'th'
  | 'es'
  | 'fr'
  | 'pt'
  | 'pt-br'
  | 'de'
  | 'fi';
