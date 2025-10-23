// 개별 메시지 버블(내/상대 구분 + 시간/프로필 + 읽지 않은 메시지 배지 표시)
// - 특정 chatId의 메시지 목록 조회/표시, 메시지 전송
// - 반응형 헤더(모바일/데스크톱), 대화 검색 UI 토글
// - 모바일에서 좌측 채팅목록 슬라이드 열기/닫기

import { useEffect, useRef, useState, useCallback } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import type { Chat, Message } from '../../../types/dm';
import DMList from './DMList';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { ensureMyProfileId } from '../../../lib/ensureMyProfileId';

type DMRoomProps = {
  chatId: string;
  title: string;
  avatarUrl: string;
  onAfterSend?: (chatId: string, lastText: string, localTime: string) => void;
  setSelectedChatId: (id: string | null) => void;
};

function DMRoom({ chatId, title, avatarUrl, onAfterSend, setSelectedChatId }: DMRoomProps) {
  const { user } = useAuth();
  const [myProfileId, setMyProfileId] = useState<string>('');

  // 메시지 / UI 상
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [justSent, setJustSent] = useState(false);

  const [dropdownOpen, setDropdownOpen] = useState(false); // 햄버거 메뉴 드롭다운
  const [showChatList, setShowChatList] = useState(false); // (모바일) 채팅목록 슬라이드
  const [showSearch, setShowSearch] = useState(false); // 대화 내용 검색 UI
  const [isAlarmOn, setIsAlarmOn] = useState(true); // 알림 상태 (로컬)
  const [isPinned, setIsPinned] = useState(false); // 핀 상태 (로컬)

  const chatListRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const myId = user?.id ?? '';

  // 뒤로 가기 (모바일
  const handleBackButton = () => {
    setSelectedChatId(null);
  };

  // 메시지 조
  const fetchMessages = useCallback(async (cid: string): Promise<Message[]> => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', cid)
      .order('created_at', { ascending: true }); // 시간 순으로 정렬하여 전달

    if (error) {
      console.error('[DMRoom] 메시지 패칭 에러:', error.message);
      return [];
    }
    return (data ?? []) as Message[];
  }, []);

  // 메시지 전
  const sendMessage = useCallback(
    async (cid: string, content: string): Promise<Message | null> => {
      if (!user?.id) {
        console.error('[DMRoom] 로그인 정보가 없어 메시지를 보낼 수 없습니다.');
        return null;
      }

      const profileId = await ensureMyProfileId();

      // sender_id에는 "profiles.id" 또는 "auth.users.id" 중 스키마에 맞는 값을 사용하세요.
      // 여기서는 auth.users.id(= user.id)를 사용했다고 가정합니다.
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            chat_id: cid,
            sender_id: profileId, // 실제 로그인 유저 id
            auth_id: user.id,
            content,
            type: 'text',
          },
        ])
        .select('*')
        .single();

      if (error) {
        console.error('[DMRoom] 메시지 전송 에러:', error.message);
        return null;
      }
      return data as Message;
    },
    [user?.id],
  );

  // 메시지 패칭 이펙트 (chatId 변경 시
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!chatId) return;
      setLoading(true);
      const data = await fetchMessages(chatId);
      if (!alive) return;
      setMsgs(data);
      setLoading(false);
      setJustSent(false);
    })();
    return () => {
      alive = false;
    };
  }, [chatId, fetchMessages]);

  // 내 프로필 id state로 받아서 넘기기
  useEffect(() => {
    (async () => {
      const pid = await ensureMyProfileId().catch(() => '');
      setMyProfileId(pid ?? '');
    })();
  }, []);

  // Realtime : messages 테이블 변경 실시간 반영
  // useEffect(() => {
  //   if (!chatId) return;
  //   const channel = supabase
  //     .channel(`messages:${chatId}`)
  //     .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` }, payload => {
  //       setMsgs(prev => [...prev, payload.new as Message]);
  //     })
  //     .subscribe();
  //   return () => {
  //     supabase.removeChannel(channel);
  //   };
  // }, [chatId]);

  // 전송 핸들
  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    const newMsg = await sendMessage(String(chatId), text);
    if (!newMsg) return;

    // 낙관적 업데이트 (select('*').single()로 받은 row라 타임스탬프 포함)
    setMsgs(prev => [...prev, newMsg]);

    setJustSent(true);
    // MessageList의 autoScrollMode="onSend"와 함께 스크롤 트리거
    setTimeout(() => setJustSent(false), 0);

    onAfterSend?.(chatId, text, new Date().toLocaleTimeString());
  };

  // (모바일) 슬라이드 내에서 채팅 선
  const handleSelectChat = (id: string) => {
    setSelectedChatId(id);
    setShowChatList(false);
  };

  // 드롭다운/슬라이드 외부 클릭 닫
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (chatListRef.current && !chatListRef.current.contains(t)) {
        setShowChatList(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(t)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside, { capture: true });
    return () => document.removeEventListener('mousedown', handleClickOutside, { capture: true });
  }, []);

  // 헤더 우측 액션
  const handleSidebarAction = (action: 'chatList' | 'leave' | 'alarm' | 'pin') => {
    switch (action) {
      case 'chatList':
        setShowChatList(true);
        setDropdownOpen(false);
        break;
      case 'leave':
        if (window.confirm('채팅방을 나가시겠습니까?')) {
          // 실제 나가기 로직(멤버십 삭제 등)은 서버/RLS 정책에 맞게 구현
          alert('채팅방을 나갔습니다. (Mock)');
        }
        break;
      case 'alarm':
        setIsAlarmOn(prev => !prev);
        break;
      case 'pin':
        setIsPinned(prev => !prev);
        break;
    }
  };

  return (
    <div className="flex flex-col h-full sm:h-[calc(100vh-120px)]">
      {/* 모바일 헤더 */}
      <header className="sm:hidden flex items-center gap-2 p-3 bg-white relative">
        <button onClick={handleBackButton} className="px-2 py-1">
          <img src="/back.svg" alt="뒤로가기" />
        </button>
        <img src={avatarUrl} alt="프로필이미지" className="w-9 h-9 rounded-full" />
        <div className="font-semibold">{title}</div>

        <div className="ml-auto relative" ref={dropdownRef}>
          <button onClick={() => setShowSearch(prev => !prev)} className="relative mr-2">
            <img
              src="/searchT.svg"
              alt="검색"
              className="w-6 h-6 inline-flex items-center justify-center"
            />
          </button>
          <button
            type="button"
            onClick={() => setDropdownOpen(prev => !prev)}
            className="inline-flex items-center justify-center rounded-md border border-gray-200 px-3 py-2 text-xl"
            aria-expanded={dropdownOpen}
            aria-haspopup="menu"
          >
            ☰
          </button>

          {/* 모바일 드롭다운 메뉴 */}
          {dropdownOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-50"
            >
              <button
                className="flex w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-600"
                onClick={() => handleSidebarAction('chatList')}
                role="menuitem"
              >
                <img src="/chatlist.svg" alt="채팅목록" className="w-7 h-7 mr-3" />
                채팅목록보기
              </button>
              <button
                className="flex w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-600"
                onClick={() => handleSidebarAction('leave')}
                role="menuitem"
              >
                <img src="/exit.svg" alt="나가기" className="w-6 h-6 mr-3" />
                나가기
              </button>
              <div className="flex border-t border-gray-100">
                <button
                  className="w-full text-left px-4 py-2 flex items-center gap-2"
                  onClick={() => handleSidebarAction('alarm')}
                  role="menuitem"
                >
                  <img
                    src={isAlarmOn ? '/alarmon.svg' : '/alaramoff.svg'}
                    alt={isAlarmOn ? '알람 켬' : '알람 끔'}
                    className="w-5 h-5"
                  />
                  <span className="text-gray-600">{isAlarmOn ? '알림 끄기' : '알림 켜기'}</span>
                </button>
                <button
                  className="w-full text-left px-4 py-2 flex items-center gap-2"
                  onClick={() => handleSidebarAction('pin')}
                  role="menuitem"
                >
                  <img
                    src={isPinned ? '/pinon.svg' : '/pinoff.svg'}
                    alt={isPinned ? '고정됨' : '고정해제'}
                    className="w-5 h-5"
                  />
                  <span className="text-gray-600">{isPinned ? '고정 해제' : '상단 고정'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 데스크톱 헤더 */}
      <header className="hidden sm:flex p-3 border-b bg-white items-center gap-3">
        <img src={avatarUrl} alt="프로필이미지" className="w-9 h-9 rounded-full" />
        <div className="font-semibold text-gray-900">{title}</div>
        <div className="flex ml-auto items-center gap-4">
          <button onClick={() => setShowSearch(prev => !prev)} aria-pressed={showSearch}>
            <img src="/searchT.svg" alt="검색" className="w-6 h-6" />
          </button>
          <button onClick={() => handleSidebarAction('leave')}>
            <img src="/exit.svg" alt="나가기" className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* 검색창 */}
      {showSearch && (
        <div className="flex items-center justify-center p-2 bg-white border-b">
          <div className="flex items-center h-10 bg-white w-full rounded-md border border-gray-300 focus-within:ring-2 focus-within:ring-primary/60 focus-within:ring-offset-1">
            <img src="/searchT.svg" alt="검색" className="w-5 h-5 mx-3" />
            <input
              type="text"
              placeholder="대화 내용 검색"
              className="flex-grow border-none outline-none bg-transparent"
            />
            <button className="text-gray-500 px-3 hover:text-gray-700">검색</button>
          </div>
        </div>
      )}

      {/* 메시지 리스트 */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">불러오는 중…</div>
      ) : (
        <MessageList
          messages={msgs}
          myId={myProfileId} // 현재 사용자 id 전달 (sender_id와 동일 축)
          autoScrollMode="onSend"
          justSent={justSent}
        />
      )}

      {/* 입력창 */}
      <MessageInput onSend={handleSend} placeholder="메시지를 입력하세요…" submitLabel="전송" />

      {/* (모바일) 채팅목록 슬라이드 */}
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
          <DMList selectedChatId={chatId} onSelect={handleSelectChat} />
        </div>
      )}
    </div>
  );
}

export default DMRoom;
