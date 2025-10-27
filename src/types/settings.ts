export type MenuId = string;

export type SidebarItem = {
  id: MenuId;
  label: string;
  icon?: React.ReactNode;
};

export type SettingsLayoutProps = {
  sidebarTitle?: string;
  items: SidebarItem[];
  activeId: MenuId;
  onChange: (id: MenuId) => void;
  children: React.ReactNode; // 오른쪽 콘텐츠(라우팅 or 조건부 렌더링)
};
