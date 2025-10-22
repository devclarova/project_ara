// 유저 검색

import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

type UserItem = {
  id: string;
  user_id: string;
  nickname: string;
  avatar_url?: string;
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
  onSelectUser,
  placeholder = '사용자 검색...',
  emptyText = '검색 결과가 없습니다.',
  debounceMs = 180,
  onClose,
}: Props) {
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [filteredUsers, setFilteredUsers] = useState<UserItem[]>([]); // 필터링된 사용자 목록
  const [loading, setLoading] = useState(false); // 로딩 상태
  const [isHovered, setIsHovered] = useState(false); // 서치 닫기 호버
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate(); // 페이지 이동
  const { user } = useAuth(); // user 정보 가져오기

  // 디바운스
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), debounceMs);
    return () => clearTimeout(t);
  }, [q, debounceMs]);

  // Supabase에서 사용자 검색
  useEffect(() => {
    const fetchUsers = async () => {
      if (!debouncedQ) {
        setFilteredUsers([]);
        return;
      }
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, nickname, avatar_url')
          .ilike('nickname', `%${debouncedQ}%`); // 대소문자 구분 없이 부분 일치 검색

        if (error) {
          console.error('사용자 검색 에러', error);
        } else {
          setFilteredUsers(data || []);
        }
      } catch (err) {
        console.error('검색 중 오류 발생', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [debouncedQ]);

  // 키보드 내비게이션
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCloseSearch();
      return;
    }
    if (filteredUsers.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => (i + 1) % filteredUsers.length);
      scrollActiveIntoView(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => (i - 1 + filteredUsers.length) % filteredUsers.length);
      scrollActiveIntoView(-1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filteredUsers[activeIndex] ?? filteredUsers[0];
      if (target) {
        // 본인 선택시 프로필 페이지로 이동
        if (target.user_id === user?.id) {
          navigate(`/profile/${user.id}`); // 프로필 페이지로 이동
        } else {
          onSelectUser(target);
        }
      }
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
        {debouncedQ && filteredUsers.length > 0 ? (
          filteredUsers.map((u, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={`${u.user_id}-${u.nickname}`} // `id`와 `nickname`을 결합해 고유한 key 생성
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
                    src={u.avatar_url || '/default-avatar.svg'} // avatar_url 사용
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
