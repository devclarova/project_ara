import type { ReactNode } from 'react';
import TrendsPanel from '../homes/feature/TrendsPanel';

interface SnsLayoutProps {
  children: ReactNode;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  hideSearchBar?: boolean; // 상세 페이지에서는 true
}

export default function SnsLayout({
  children,
  searchQuery,
  onSearchChange,
  hideSearchBar,
}: SnsLayoutProps) {
  return (
    <div className="bg-white dark:bg-background overflow-x-hidden">
      {/* 가운데 + 오른쪽 2컬럼 레이아웃 (오른쪽은 공간만 잡아줌) */}
      <div className="mx-auto max-w-7xl px-4 sm:px-5 lg:px-6">
        <div className="grid w-full gap-4 lg:gap-6 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px]">
          {/* 가운데 SNS 피드 */}
          <div className="flex justify-center">
            <div className="w-full md:max-w-3xl xl:max-w-4xl">{children}</div>
          </div>

          {/* 오른쪽 컬럼: 화면에서 자리만 차지 (실제 패널은 fixed로 따로 띄움) */}
          <div className="hidden xl:block" />
        </div>
      </div>

      {/* 🔥 화면에 떠 있는(항상 따라다니는) 실시간 인기 피드 */}
      <div className="hidden xl:block">
        <div className="fixed top-[100px] right-[calc((100vw-1280px)/2)]">
          <TrendsPanel
            searchQuery={searchQuery ?? ''}
            onSearchChange={onSearchChange ?? (() => {})}
            hideSearchBar={hideSearchBar}
          />
        </div>
      </div>
    </div>
  );
}
