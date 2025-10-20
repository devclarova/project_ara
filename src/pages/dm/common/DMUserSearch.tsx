// 검색

import React, { useEffect, useRef, useState } from 'react';

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
  onClose?: () => void;
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
  onClose,
}: Props) {
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [isHovered, setIsHovered] = useState(false); // 서치 닫기 호버
  const listRef = useRef<HTMLDivElement>(null);

  // 디바운스
  useEffect(() => {
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
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCloseSearch(); // ESC 로 닫기
      return;
    }
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
      if (target) onSelectUser(target); // 엔터로는 닫지 않음
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

  const handleCloseSearch = () => {
    setQ(''); // 검색창 비우고 닫기
    setDebouncedQ('');
    setActiveIndex(-1);
    onClose?.();
  };

  return (
    <div className="p-2 border-b border-gray-200 bg-white">
      <div className="flex items-center justify-center p-2 bg-white">
        <div className="flex items-center justify-between h-10 bg-white border-b w-full border rounded-md border-gray-300 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1 focus-within:ring-offset-white focus-within:border-transparent">
          <input
            type="text"
            value={q}
            onChange={e => {
              setQ(e.target.value);
              setActiveIndex(-1);
            }}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className="flex-grow p-0 m-0 border-none ml-3 outline-none bg-transparent focus:outline-none focus:ring-0 focus:border-transparent sm:w-12"
            role="combobox"
            aria-expanded={!!debouncedQ && filtered.length > 0}
            aria-controls="dm-user-search-listbox"
            aria-autocomplete="list"
          />
          <div className="flex items-center text-gray-400 ml-1 mr-1 sm:ml-0 sm:mr-0 sm:">
            <img src="/line-y.svg" alt="구분선" />
            <button className="text-gray-400 hover:text-gray-700 ml-2 mr-3"> 검색</button>
          </div>
        </div>
        <button
          type="button"
          className="ml-3 mr-3"
          onClick={handleCloseSearch}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <img src={isHovered ? '/closeh.svg' : '/close.svg'} alt="닫기" className="w-8 h-8" />
        </button>
      </div>

      <div
        id="dm-user-search-listbox"
        ref={listRef}
        role="listbox"
        className="max-h-[200px] overflow-y-auto rounded-md border-t-gray-3200"
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
                onDoubleClick={() => onSelectUser(u)} // 더블 클릭시 채팅방 이동
                className="
                  w-full flex items-center p-2 rounded text-left transition
                  hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                  data-[active=true]:bg-primary/10
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
