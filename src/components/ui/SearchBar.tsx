import { Search } from 'lucide-react'; // lucide 아이콘

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit?: (query: string) => void;
  onClose?: () => void;
  autoFocus?: boolean;
}

export default function SearchBar({
  placeholder,
  value,
  onChange,
  onSubmit,
  autoFocus,
}: SearchBarProps) {
  const handleSubmit = () => {
    if (value.trim() === '') return;
    onSubmit?.(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="flex items-center justify-center bg-white dark:bg-secondary text-foreground transition-colors px-2 sm:px-4">
      {/* 검색 입력창 */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center justify-between h-10 sm:h-11 md:h-12 w-full max-w-[90%] sm:max-w-xl md:max-w-2xl rounded-full border border-input bg-card shadow-sm focus-within:ring-2 focus-within:ring-primary/60 focus-within:border-transparent transition-colors overflow-hidden">
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
            placeholder={placeholder ?? '검색어를 입력하세요'}
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
              검색
            </button>
          </div>
        </div>
        <div className="pt-3"></div>
      </div>
    </div>
  );
}
