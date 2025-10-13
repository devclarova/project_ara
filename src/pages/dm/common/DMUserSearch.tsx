// 검색

import React from 'react';

type UserItem = {
  id: string;
  nickname: string;
  avatarUrl?: string;
};

type Props = {
  users: UserItem[]; // 로컬/모의 데이터
  onSelectUser: (u: UserItem) => void;
  placeholder?: string;
  emptyText?: string;
  debounceMs?: number;
};

function normalize(s: string) {
  return (s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, ''); // 악센트 제거(간단 유니코드 정규화)
}

function DMUserSearch({
  users,
  onSelectUser,
  placeholder = '사용자 검색...',
  emptyText = '검색 결과가 없습니다.',
  debounceMs = 180,
}: Props) {
  const [q, setQ] = React.useState('');
  const [debouncedQ, setDebouncedQ] = React.useState('');
  const [activeIndex, setActiveIndex] = React.useState<number>(-1);
  const listRef = React.useRef<HTMLDivElement>(null);

  // 디바운스
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), debounceMs);
    return () => clearTimeout(t);
  }, [q, debounceMs]);

  const filtered = React.useMemo(() => {
    const nq = normalize(debouncedQ);
    if (!nq) return [];
    return users.filter(u => normalize(u.nickname).includes(nq)).slice(0, 50); // 상한(성능/스크롤 과도 방지)
  }, [users, debouncedQ]);

  // 키보드 내비게이션
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filtered.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => (i + 1) % filtered.length);
      scrollActiveIntoView(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => (i - 1 + filtered.length) % filtered.length);
      scrollActiveIntoView(-1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filtered[activeIndex] ?? filtered[0];
      if (target) onSelectUser(target);
    } else if (e.key === 'Escape') {
      setQ('');
      setActiveIndex(-1);
    }
  };

  const scrollActiveIntoView = (dir: 1 | -1) => {
    const container = listRef.current;
    if (!container) return;
    const item = container.querySelector<HTMLButtonElement>('[data-active="true"]');
    if (!item) return;
    const cTop = container.scrollTop;
    const cBottom = cTop + container.clientHeight;
    const iTop = item.offsetTop;
    const iBottom = iTop + item.offsetHeight;
    if (iTop < cTop) container.scrollTop = iTop - 4;
    else if (iBottom > cBottom) container.scrollTop = iBottom - container.clientHeight + 4;
  };

  return (
    <div className="p-4 border-b border-gray-200 bg-white">
      <div className="relative">
        <input
          type="text"
          value={q}
          onChange={e => {
            setQ(e.target.value);
            setActiveIndex(-1);
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:ring-2 focus-visible:ring-primary"
          role="combobox"
          aria-expanded={!!debouncedQ && filtered.length > 0}
          aria-controls="dm-user-search-listbox"
          aria-autocomplete="list"
        />
      </div>

      <div
        id="dm-user-search-listbox"
        ref={listRef}
        role="listbox"
        className="mt-2 max-h-[200px] overflow-y-auto rounded-md"
        aria-live="polite"
        aria-label="사용자 검색 결과"
      >
        {debouncedQ && filtered.length > 0 ? (
          filtered.map((u, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={u.id}
                type="button"
                role="option"
                aria-selected={isActive}
                data-active={isActive ? 'true' : 'false'}
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseLeave={() => setActiveIndex(-1)}
                onClick={() => onSelectUser(u)}
                className="
                  w-full flex items-center p-2 rounded text-left transition
                  hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                  data-[active=true]:bg-blue-50
                "
              >
                <div className="mr-3 w-8 h-8 rounded-full overflow-hidden bg-gray-300 shrink-0">
                  <img
                    src={u.avatarUrl || 'https://api.dicebear.com/7.x/adventurer/svg?seed=tmp'}
                    alt={u.nickname}
                    width={32}
                    height={32}
                    className="w-8 h-8 object-cover"
                  />
                </div>
                <div className="font-medium text-gray-900 text-sm">{u.nickname}</div>
              </button>
            );
          })
        ) : debouncedQ ? (
          <div className="p-4 text-center text-gray-500 text-sm">{emptyText}</div>
        ) : null}
      </div>
    </div>
  );
}

export default DMUserSearch;
