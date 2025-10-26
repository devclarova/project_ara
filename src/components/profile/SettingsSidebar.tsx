// 왼쪽 메뉴 (계정 설정)

import type { MenuId, SidebarItem } from '@/types/settings';

type Props = {
  title?: string;
  items: SidebarItem[];
  activeId: MenuId;
  onChange: (id: MenuId) => void;
  className?: string; // w-96, w-[28rem] 같은 폭 제어용
};

export default function SettingsSidebar({
  title = '계정 설정',
  items,
  activeId,
  onChange,
  className = 'md:w-96',
}: Props) {
  return (
    <aside
      className={`bg-white rounded-2xl border border-gray-200 p-6 shadow-[0_4px_12px_rgba(0,0,0,0.04)] w-full ${className}`}
    >
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      <ul className="space-y-1">
        {items.map(it => {
          const active = activeId === it.id;
          return (
            <li key={it.id}>
              <button
                onClick={() => onChange(it.id)}
                className={`w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm transition
                  ${active ? 'bg-gray-100 text-gray-900 font-medium' : 'hover:bg-gray-50 text-gray-700'}`}
              >
                <span className="truncate">{it.label}</span>
                <span className="text-gray-400">›</span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
