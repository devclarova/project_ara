import { Search } from 'lucide-react';
import { useState } from 'react';

interface SearchBarProps {
  placeholder?: string;
  onSubmit?: (query: string) => void;
  onClose?: () => void;
}

export default function Input({ placeholder, onSubmit, onClose }: SearchBarProps) {
  const [q, setQ] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  const handleSubmit = () => {
    if (q.trim() === '') return;
    onSubmit?.(q);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const handleClose = () => {
    setQ('');
    onClose?.();
  };

  return (
    <div className="flex items-center justify-center pb-5 bg-background text-foreground transition-colors">
      {/* 검색 입력창 */}
      <div className="flex items-center justify-between h-12 w-full rounded-full border border-input bg-card shadow-sm focus-within:ring-2 focus-within:ring-primary/60 focus-within:border-transparent transition-colors overflow-hidden">
        {/* 돋보기 아이콘 */}
        <div className="flex items-center pl-4 text-muted-foreground">
          <Search className="w-5 h-5" />
        </div>

        {/* 입력 필드 */}
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? '검색어를 입력하세요'}
          className="flex-1 h-full px-3 bg-transparent outline-none text-sm placeholder-muted-foreground border-none focus:outline-none focus:ring-0 focus:border-transparent"
        />

        {/* 구분선 + 검색 버튼 */}
        <div className="flex items-center text-muted-foreground pr-2">
          <span className="mx-2 h-6 w-px bg-border" aria-hidden="true" />
          <button
            type="button"
            onClick={handleSubmit}
            className="
          px-3 py-1.5 text-sm font-medium
          text-muted-foreground hover:text-foreground
          rounded-full hover:bg-accent transition-colors
        "
            aria-label="검색"
          >
            검색
          </button>
        </div>
      </div>
    </div>
  );
}
