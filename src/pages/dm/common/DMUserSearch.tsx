// 유저 검색

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

type UserItem = {
  id: string; // profiles.id (chats FK와 동일 축)
  user_id: string; // auth.users.id
  nickname: string;
  avatar_url?: string;
};

type Props = {
  users?: UserItem[];
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
    .replace(/[\u0300-\u036f]/g, '');
}

const DMUserSearch: React.FC<Props> = ({
  users,
  onSelectUser,
  placeholder = '사용자 검색...',
  emptyText = '검색 결과가 없습니다.',
  debounceMs = 180,
  onClose,
}) => {
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [remoteUsers, setRemoteUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // 입력 디바운스
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), debounceMs);
    return () => clearTimeout(t);
  }, [q, debounceMs]);

  const useLocal = Array.isArray(users) && users.length > 0;

  // 로컬 필터 결과
  const localFiltered = useMemo(() => {
    if (!useLocal || !debouncedQ) return [];
    const nq = normalize(debouncedQ);
    return users!.filter(u => normalize(u.nickname).includes(nq)).slice(0, 50); // 안전 상한
  }, [useLocal, users, debouncedQ]);

  // 원격(Supabase) 검색
  useEffect(() => {
    if (useLocal) return; // 로컬 사용 시 서버 호출 안 함
    if (!debouncedQ) {
      setRemoteUsers([]);
      return;
    }

    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, user_id, nickname, avatar_url')
          .ilike('nickname', `%${debouncedQ}%`) // 부분 일치
          .limit(50);

        if (error) throw error;
        if (alive) setRemoteUsers((data ?? []) as UserItem[]);
      } catch (err) {
        console.error('[DMUserSearch] 사용자 검색 에러:', err);
        if (alive) setRemoteUsers([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [debouncedQ, useLocal]);

  const filteredUsers: UserItem[] = useLocal ? localFiltered : remoteUsers;

  // 🔽 키보드 내비게이션
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCloseSearch();
      return;
    }
    if (!filteredUsers.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => (i + 1) % filteredUsers.length);
      scrollActiveIntoView();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => (i - 1 + filteredUsers.length) % filteredUsers.length);
      scrollActiveIntoView();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filteredUsers[activeIndex] ?? filteredUsers[0];
      if (!target) return;

      // 본인 선택 시: 프로필 페이지로 이동
      if (target.user_id === user?.id) {
        navigate(`/profile/${user.id}`);
      } else {
        onSelectUser(target);
      }
    }
  };

  const scrollActiveIntoView = () => {
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
    setQ('');
    setDebouncedQ('');
    setActiveIndex(-1);
    onClose?.();
  };

  return (
    <div className="p-2 border-b border-gray-200 bg-white">
      {/* 입력 헤더 */}
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
            aria-expanded={!!debouncedQ && filteredUsers.length > 0}
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
          aria-label="닫기"
          title="닫기"
        >
          <img src={isHovered ? '/closeh.svg' : '/close.svg'} alt="닫기" className="w-8 h-8" />
        </button>
      </div>

      {/* 결과 리스트 */}
      <div
        id="dm-user-search-listbox"
        ref={listRef}
        role="listbox"
        className="max-h-[200px] overflow-y-auto rounded-md border-t-gray-3200"
        aria-live="polite"
        aria-label="사용자 검색 결과"
      >
        {/* 로딩 표시 */}
        {!useLocal && loading && (
          <div className="p-4 text-center text-gray-500 text-sm">검색 중…</div>
        )}

        {/* 결과 */}
        {debouncedQ && filteredUsers.length > 0 ? (
          filteredUsers.map((u, idx) => {
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
                onDoubleClick={() => onSelectUser(u)} // 더블 클릭 시 바로 선택
                className="
          w-full flex items-center p-2 rounded text-left transition
          hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
          data-[active=true]:bg-primary/10
        "
              >
                <div className="mr-3 w-8 h-8 rounded-full overflow-hidden bg-gray-300 shrink-0">
                  <img
                    src={u.avatar_url || '/default-avatar.svg'}
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
        ) : debouncedQ && !loading ? (
          <div className="p-4 text-center text-gray-500 text-sm">{emptyText}</div>
        ) : null}
      </div>
    </div>
  );
};

export default DMUserSearch;
