import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import React from 'react';

/**
 * 고정 레이어 실시간 검색 인터페이스(Fixed-layer Real-time Search Interface):
 * - 목적(Why): 전역 검색 및 모달 내 데이터 필터링 시 사용자 입력에 즉각적으로 반응하여 정보 탐색 속도를 극대화함
 * - 방법(How): 제어 컴포넌트(Controlled Component) 패턴과 폼 서브밋 엔진을 결합하여 가변적 검색 쿼리를 처리하고, 반응형 테마 스타일링을 적용함
 */
interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit?: (query: string) => void;
  onClose?: () => void;
  autoFocus?: boolean;
  useSecondaryBg?: boolean; // 모달에서 사용 시 secondary 배경 적용
}

export default function SearchBar({
  placeholder,
  value,
  onChange,
  onSubmit,
  autoFocus,
  useSecondaryBg = false,
}: SearchBarProps) {
  const { t } = useTranslation();
  const handleSubmit = () => {
    if (value.trim() === '') return;
    onSubmit?.(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className={`flex items-center justify-center text-foreground transition-colors px-2 sm:px-0 ${
      useSecondaryBg ? 'bg-white dark:bg-secondary' : 'bg-white dark:bg-background'
    }`}>
      {/* 검색 입력창 */}
      <div className="flex items-center justify-between flex-1">
        <div className="flex items-center justify-between h-10 sm:h-11 md:h-12 w-full rounded-full border dark:border-gray-700 border-input bg-card dark:bg-secondary shadow-sm focus-within:ring-2 focus-within:ring-primary/60 focus-within:border-transparent transition-colors overflow-hidden">
          {/* 돋보기 아이콘 */}
          <div className="flex items-center pl-3 sm:pl-4 text-muted-foreground">
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>

          {/* 입력 필드 */}
          <input
            type="text"
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder ?? t('common.search')}
            autoFocus={autoFocus}
            className="flex-1 h-full px-2 sm:px-3 bg-transparent outline-none text-xs sm:text-sm md:text-base placeholder-muted-foreground border-none focus:outline-none focus:ring-0 focus:border-transparent"
          />

          {/* 구분선 + 검색 버튼 */}
          <div className="flex items-center text-muted-foreground pr-2 sm:pr-3">
            <span className="mx-1.5 sm:mx-2 h-5 sm:h-6 w-px bg-border" aria-hidden="true" />
            <button
              type="button"
              onClick={handleSubmit}
              className="flex items-center justify-center px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground rounded-full hover:bg-accent transition-colors whitespace-nowrap"
              aria-label="검색"
            >
              {t('common.search')}
            </button>
          </div>
        </div>
        <div className="pt-3"></div>
      </div>
    </div>
  );
}
