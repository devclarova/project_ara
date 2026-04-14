/**
 * 실시간 필터링 지원형 설정 내비게이션 엔진(Navigation Engine with Real-time Filtering Support):
 * - 목적(Why): 방대한 설정 항목 중 원하는 기능을 빠르게 탐색하고 탭 간 전환을 원활하게 수행할 수 있는 인터페이스를 제공함
 * - 방법(How): 검색 쿼리 기반의 키워드 하이라이팅(HighlightText), 스크롤 전파 방지 로직, 그리고 활성 탭 식별자를 통한 조건부 UI 트리거를 수행함
 */
import type { MenuId, SidebarItem } from '@/types/settings';
import { useRef, useEffect } from 'react';

type Props = {
  title?: string;
  items: SidebarItem[];
  activeId: MenuId;
  onChange: (id: MenuId) => void;
  className?: string;
  searchQuery?: string;
  onSearch?: (query: string) => void;
};

import { useTranslation } from 'react-i18next';

import HighlightText from '../common/HighlightText';

// 내비게이션 엔진(Navigation Engine) — 설정 탭 선택 로직 및 검색 쿼리에 따른 실시간 필터링 인터페이스 제공
export default function SettingsSidebar({
  title,
  items,
  activeId,
  onChange,
  className = 'md:w-96',
  searchQuery,
  onSearch,
}: Props) {
  const { t } = useTranslation();
  const displayTitle = title || t('settings.account_settings');
  const ref = useRef<HTMLDivElement>(null);

  // 뷰 스위칭 동기화 — 활성 탭 식별자(Active Tab)에 따라 고유한 하위 설정 화면을 조건부 렌더링
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Prevent scroll propagation to parent container when reaching boundary limits
    const handleWheel = (e: WheelEvent) => {
      const atTop = el.scrollTop <= 0 && e.deltaY < 0;
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 1 && e.deltaY > 0;
      if (atTop || atBottom) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const lockBody = () => {
      document.body.style.overflow = 'hidden';
    };
    const unlockBody = () => {
      document.body.style.overflow = '';
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    el.addEventListener('mouseenter', lockBody);
    el.addEventListener('mouseleave', unlockBody);

    return () => {
      el.removeEventListener('wheel', handleWheel);
      el.removeEventListener('mouseenter', lockBody);
      el.removeEventListener('mouseleave', unlockBody);
      unlockBody();
    };
  }, []);

  return (
    <aside
      className={`bg-white dark:bg-secondary rounded-2xl border border-gray-200 dark:border-gray-700 shadow-[0_4px_12px_rgba(0,0,0,0.04)] h-[420px] max-h-[calc(100vh-280px)] min-h-[320px] overflow-hidden flex flex-col w-full ${className}`}
    >
      <div
        ref={ref}
        className="flex-1 overflow-y-auto overscroll-contain p-6 scrollbar-thin scrollbar-thumb-[#00BFA5]/20 hover:scrollbar-thumb-[#00BFA5]/40 scrollbar-track-transparent custom-scrollbar"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0, 191, 165, 0.2) transparent'
        }}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(0, 191, 165, 0.2);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 191, 165, 0.4);
          }
        `}} />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{displayTitle}</h2>
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-gray-500 dark:text-gray-400">
            <p className="text-sm">{t('chat.no_result')}</p>
        </div>
      ) : (
      <ul className="space-y-2">
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
      )}
      </div>
    </aside>
  );
}
