import type { MenuId, SidebarItem } from '@/types/settings';

type Props = {
  title?: string;
  items: SidebarItem[];
  activeId: MenuId;
  onChange: (id: MenuId) => void;
  className?: string;
};

import { useTranslation } from 'react-i18next';

import HighlightText from '../common/HighlightText';

export default function SettingsSidebar({
  title, // default prop 제거
  items,
  activeId,
  onChange,
  className = 'md:w-96',
  searchQuery,
}: Props & { searchQuery?: string }) { // searchQuery prop 추가
  const { t } = useTranslation();
  const displayTitle = title || t('settings.account_settings'); // fallback 처리

  return (
    <aside
      className={`bg-white dark:bg-secondary rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-[0_4px_12px_rgba(0,0,0,0.04)] w-full ${className}`}
    >
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{displayTitle}</h2>
      <ul className="space-y-1">
        {items.map(it => {
          const active = activeId === it.id;
          return (
            <li key={it.id}>
              <button
                onClick={() => onChange(it.id)}
                className={`w-full flex items-center justify-between rounded-xl px-4 py-3 transition text-base
                  ${
                    active
                      ? 'bg-gray-100 dark:bg-primary/20 text-gray-900 dark:text-gray-100 font-medium'
                      : 'hover:bg-gray-50 dark:hover:bg-primary/10 text-gray-700 dark:text-gray-200'
                  }`}
              >
                <div className="flex flex-col items-start overflow-hidden">
                  <span className="truncate">
                    <HighlightText text={it.label} query={searchQuery} />
                  </span>
                  {/* 검색어와 일치하는 키워드가 있으면 하단에 표시 */}
                  {searchQuery && searchQuery.trim() !== '' && it.keywords && (
                    <div className="text-xs text-start text-gray-500 dark:text-gray-400 mt-0.5 truncate w-full">
                      {it.keywords
                        .filter(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((k, i) => (
                          <span key={i} className="mr-2">
                            • <HighlightText text={k} query={searchQuery} />
                          </span>
                        ))}
                    </div>
                  )}
                </div>
                <span className="text-gray-400 dark:text-gray-500 flex-shrink-0">›</span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
