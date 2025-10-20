// 개별 메시지 버블(내/상대 구분 + 시간/프로필 + 읽지 않은 메시지 배지 표시)

import { useState, useMemo, useEffect, useRef } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import type { Message } from '../../../types/dm';
import { fetchMessages, mockChatData, sendMessage } from '../chat';
import DMList from './DMList';
import { supabase } from '../../../lib/supabase';

type Props = {
  chatId: number;
  title: string;
  onAfterSend?: (chatId: number, lastText: string, localTime: string) => void;
  setSelectedChatId: (id: number | null) => void;
};

// 문자열에서 검색어 매치 구간(start,end) 계산 유틸 (대/소문자 무시)
function findRanges(text: string, q: string) {
  if (!q) return [];
  const ranges: { start: number; end: number }[] = [];
  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  let from = 0;
  while (true) {
    const idx = lower.indexOf(needle, from);
    if (idx === -1) break;
    ranges.push({ start: idx, end: idx + needle.length });
    from = idx + needle.length;
  }
  return ranges;
}

function DMRoom({ chatId, title, onAfterSend, setSelectedChatId }: Props) {
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [justSent, setJustSent] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false); // 햄버거 메뉴 드롭다운
  const [showChatList, setShowChatList] = useState(false); // 채팅목록 보기 상태
  const [showSearch, setShowSearch] = useState(false); // 검색창 표시 여부
  const [isAlarmOn, setIsAlarmOn] = useState(true); // 알림 상태
  const [isPinned, setIsPinned] = useState(false); // 핀 표시 여부
  const [query, setQuery] = useState(''); // 검색어
  const [hitIndex, setHitIndex] = useState(0); // 현재 매치 인덱스
  const [isHovered, setIsHovered] = useState(false); // 대화 서치 닫기 호버
  const [isUpHovered, setIsUpHovered] = useState(false); // 대화 서치 위로 호버
  const [isDownHovered, setIsDownHovered] = useState(false); // 대화 서치 아래로 호버
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null); // 프로필 이미지 불러오기

  const chatListRef = useRef<HTMLDivElement>(null); // 채팅목록을 위한 ref
  const dropdownRef = useRef<HTMLDivElement>(null); // 채팅목록을 위한 ref

  // // 현재 선택된 채팅방의 프로필 이미지 URL
  // const currentChat = mockChatData.find(chat => chat.id === chatId);
  // const profileImageUrl = currentChat
  //   ? currentChat.avatarUrl
  //   : 'https://api.dicebear.com/7.x/adventurer/svg?seed=sample-avatar';

  // // 채팅방 닫고 목록으로
  // const handleBackButton = () => {
  //   setSelectedChatId(null);
  // };

  // 데이터베이스 연동
  useEffect(() => {
    const fetchMessages = async () => {
      if (!chatId) return;

      const { data, error } = await supabase.from('messages').select('*').eq('chat_id', chatId);

      if (error) {
        console.error('메시지 패칭 에러', error);
      } else {
        setMsgs(data as Message[]);
        setLoading(false);
      }
    };

    fetchMessages();
  }, [chatId]);

  const sorted = useMemo(
    () => [...msgs].sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at)),
    [msgs],
  );

  // 검색 매치 계산: 메시지별 하이라이트 구간 생성
  const hits = useMemo(() => {
    if (!query.trim()) return [];
    return sorted
      .map((m, i) => {
        const ranges = findRanges(m.content ?? '', query.trim());
        return ranges.length ? { idx: i, id: m.id, ranges } : null;
      })
      .filter(Boolean) as {
      idx: number;
      id: Message['id'];
      ranges: { start: number; end: number }[];
    }[];
  }, [sorted, query]);

  // 하이라이트 맵 (MessageList로 전달)
  const highlightMap = useMemo(() => {
    const map: Record<string | number, { start: number; end: number }[]> = {};
    for (const h of hits) map[h.id] = h.ranges;
    return map;
  }, [hits]);

  // 현재 활성 매치의 메시지 id (스크롤 타겟)
  const activeMessageId = hits.length ? hits[Math.min(hitIndex, hits.length - 1)].id : undefined;

  // 매치 이동 핸들러
  const goPrev = () => {
    if (!hits.length) return;
    setHitIndex(i => (i - 1 + hits.length) % hits.length);
  };
  const goNext = () => {
    if (!hits.length) return;
    setHitIndex(i => (i + 1) % hits.length);
  };
  const clearSearch = () => {
    setQuery('');
    setHitIndex(0);
  };

  const handleSend = async (text: string) => {
    const newMsg = await sendMessage(String(chatId), text);
    setMsgs(prev => [...prev, newMsg]);

    setJustSent(true);
    setTimeout(() => setJustSent(false), 0);

    onAfterSend?.(chatId, text, new Date().toLocaleTimeString());
  };

  const handleSidebarAction = (action: string) => {
    switch (action) {
      case 'chatList':
        setShowChatList(true);
        setDropdownOpen(false); // 드롭다운 닫기
        break;
      case 'leave':
        if (window.confirm('채팅방을 나가시겠습니까?')) {
          alert('채팅방을 나갔습니다. (Mock 버전)');
        }
        break;
      case 'alarm':
        setIsAlarmOn(prev => !prev);
        break;
      case 'pin':
        setIsPinned(prev => !prev);
        break;
      default:
        break;
    }
  };

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (chatListRef.current && !chatListRef.current.contains(e.target as Node)) {
        setShowChatList(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };

    // 마운트 시 이벤트 리스너 추가
    document.addEventListener('mousedown', handleClickOutside);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative flex flex-col h-dvh sm:h-[calc(100vh-120px)] overscroll-contain">
      {/* 반응형 헤더 */}
      <div className="sm:hidden flex items-center gap-2 p-3 border-b-0 bg-white relative">
        <button onClick={() => setSelectedChatId(null)} className="text-m px-2 py-1">
          <img src="/back.svg" alt="뒤로가기" />
        </button>
        <img src={profileImageUrl} alt="Profile" className="w-9 h-9 rounded-full" />
        <div className="font-semibold">{title}</div>
        {/* 오른쪽 햄버거 버튼 */}
        <div className="ml-auto relative" ref={dropdownRef}>
          <div>
            <button onClick={() => setShowSearch(prev => !prev)} className="text-xs">
              <img
                src="/searchT.svg"
                alt="검색"
                className="absolute right-12 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center"
              />
            </button>
            <button
              type="button"
              onClick={() => setDropdownOpen(prev => !prev)}
              className="inline-flex items-center justify-center rounded-md border border-gray-200 px-3 py-2 text-xl"
            >
              ☰
            </button>
          </div>

          {/* 모바일 드롭다운 메뉴 */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-50">
              <button
                className="flex w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-600"
                onClick={() => handleSidebarAction('chatList')}
              >
                <img src="/chatlist.svg" alt="채팅목록" className="w-7 h-7 mr-3" />
                채팅목록보기
              </button>
              <button
                className="flex w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-600"
                onClick={() => handleSidebarAction('leave')}
              >
                <img src="/exit.svg" alt="나가기" className="w-6 h-6 mr-3" />
                나가기
              </button>
              <div className="flex">
                <button
                  className="w-full text-left px-4 py-2"
                  onClick={() => handleSidebarAction('alarm')}
                >
                  <img
                    src={isAlarmOn ? '/alarmon.svg' : '/alaramoff.svg'}
                    alt={isAlarmOn ? '알람 켬' : '알람 끔'}
                    className="w-5 h-5"
                  />
                </button>
                <button
                  className="w-full text-left px-4 py-2"
                  onClick={() => handleSidebarAction('pin')}
                >
                  <img
                    src={isPinned ? '/pinon.svg' : '/pinoff.svg'}
                    alt={isPinned ? '고정됨' : '고정해제'}
                    className="w-5 h-5"
                  />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* 고정 헤더 (태블릿 이상에서 보임) */}
      <div className="hidden sm:flex p-3 border-b bg-white items-center gap-3 sticky top-0 z-30">
        <img src={profileImageUrl} alt="Profile" className="w-9 h-9 rounded-full" />
        <div className="font-semibold text-gray-900">{title}</div>

        {/* 오른쪽: 대화 검색 및 나가기 */}
        <div className="flex ml-auto items-center gap-4">
          <button onClick={() => setShowSearch(prev => !prev)} className="text-xs">
            <img src="/searchT.svg" alt="검색" className="w-6 h-6" />
          </button>

          <button onClick={() => handleSidebarAction('leave')} className="text-xs">
            <img src="/exit.svg" alt="나가기" className="w-6 h-6" />
          </button>
        </div>
      </div>
      {/* 검색창: 검색 버튼을 클릭했을 때 보이기 */}
      {showSearch && (
        <div className="flex items-center justify-center p-2 bg-white border-b">
          <div className="flex items-center justify-between h-10 bg-white border-b w-full border rounded-md border-gray-300 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1 focus-within:ring-offset-white focus-within:border-transparent">
            <img src="/searchT.svg" alt="검색" className="w-6 h-6 m-4" />
            <input
              type="text"
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                setHitIndex(0);
              }}
              placeholder="대화 내용 검색"
              className="flex-grow p-0 m-0 border-none outline-none bg-transparent focus:outline-none focus:ring-0 focus:border-transparent"
            />
            {/* 매치 카운터 & 이동 */}
            <div className="flex items-center gap-1 text-xs text-gray-500 mx-2">
              {query ? (
                <>
                  <span>{hits.length ? `${hitIndex + 1}/${hits.length}` : '0/0'}</span>
                  <button
                    onClick={goPrev}
                    onMouseEnter={() => setIsUpHovered(true)}
                    onMouseLeave={() => setIsUpHovered(false)}
                    className="px-1 py-1"
                  >
                    <img
                      src={isUpHovered ? '/arrow-up-h.svg' : '/arrow-up.svg'}
                      alt="이전"
                      className="w-5 h-5"
                    />
                  </button>
                  <button
                    onClick={goNext}
                    onMouseEnter={() => setIsDownHovered(true)}
                    onMouseLeave={() => setIsDownHovered(false)}
                    className="px-1 py-1"
                  >
                    <img
                      src={isDownHovered ? '/arrow-up-h.svg' : '/arrow-up.svg'}
                      alt="다음"
                      className="w-5 h-5 rotate-180"
                    />
                  </button>
                  <button
                    onClick={clearSearch}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className="px-2 py-1"
                  >
                    <img
                      src={isHovered ? '/closeh.svg' : '/close.svg'}
                      alt="지우기"
                      className="w-5 h-5"
                    />
                  </button>
                </>
              ) : (
                <></>
              )}
              <div className="flex items-center text-gray-400 mr-2">
                <img src="/line-y.svg" alt="구분선" />
                <button className="text-gray-400 text-sm hover:text-gray-700 hover:font-bold ml-1 mr-2">
                  검색
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 메시지 리스트 */}
      <div className="flex flex-col flex-1 min-h-0">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">불러오는 중…</div>
        ) : (
          <MessageList
            messages={sorted.map(m => ({
              id: m.id,
              chat_id: String(m.chat_id),
              author_id: m.author_id,
              author_name: m.author_name,
              content: m.content,
              created_at: m.created_at,
              isMe: m.isMe,
            }))}
            autoScrollMode="onSend"
            justSent={justSent}
            highlightMap={highlightMap}
            activeMessageId={activeMessageId}
          />
        )}
      </div>
      {/* 입력창 */}
      <div className="sticky bottom-0 z-30 shrink-0 bg-white border-t">
        <MessageInput onSend={handleSend} placeholder="메시지를 입력하세요…" submitLabel="전송" />
      </div>

      {/* 채팅목록 슬라이드 */}
      {showChatList && (
        <div
          className="sm:hidden absolute inset-y-0 left-0 w-[85%] max-w-[360px] bg-gray-50 border-r shadow-xl z-40"
          ref={chatListRef}
        >
          <div className="flex items-center justify-between p-3 border-b bg-white">
            <div className="font-semibold">채팅 목록</div>
            <button
              onClick={() => setShowChatList(false)}
              className="rounded-md border border-gray-200 px-2 py-1 text-sm"
            >
              닫기
            </button>
          </div>
          <DMList
            chats={mockChatData}
            selectedChatId={chatId}
            onSelect={() => {}}
            onUpdateChat={() => {}}
          />
        </div>
      )}
    </div>
  );
}

export default DMRoom;
