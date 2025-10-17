// 개별 메시지 버블(내/상대 구분 + 시간/프로필 + 읽지 않은 메시지 배지 표시)

import { useState, useMemo, useEffect, useRef } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import type { Message } from '../../../types/dm';
import { fetchMessages, sendMessage } from '../chat';
import DMList from './DMList';
import { mockChats } from '../chat';

type Props = {
  chatId: number;
  title: string;
  onAfterSend?: (chatId: number, lastText: string, localTime: string) => void;
  setSelectedChatId: (id: number | null) => void;
};

function DMRoom({ chatId, title, onAfterSend, setSelectedChatId }: Props) {
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [justSent, setJustSent] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false); // 햄버거 메뉴 드롭다운
  const [showChatList, setShowChatList] = useState(false); // 채팅목록 보기 상태
  const [showSearch, setShowSearch] = useState(false); // 검색창 표시 여부
  const [isAlarmOn, setIsAlarmOn] = useState(true); // 알림 상태
  const [isPinned, setIsPinned] = useState(false); // 핀 표시 여부

  const chatListRef = useRef<HTMLDivElement>(null); // 채팅목록을 위한 ref
  const dropdownRef = useRef<HTMLDivElement>(null); // 채팅목록을 위한 ref

  // 현재 선택된 채팅방의 프로필 이미지 URL
  const currentChat = mockChats.find(chat => chat.id === chatId);
  const profileImageUrl = currentChat
    ? currentChat.avatarUrl
    : 'https://api.dicebear.com/7.x/adventurer/svg?seed=sample-avatar';

  // 채팅방 닫고 목록으로
  const handleBackButton = () => {
    setSelectedChatId(null);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const data = await fetchMessages(String(chatId));
      if (mounted) {
        setMsgs(data);
        setLoading(false);
        setJustSent(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [chatId]);

  const sorted = useMemo(
    () => [...msgs].sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at)),
    [msgs],
  );

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
    <div className="flex flex-col h-full sm:h-[calc(100vh-120px)]">
      {/* 반응형 헤더 */}
      <div className="sm:hidden flex items-center gap-2 p-3 border-b-0 bg-white relative">
        <button onClick={handleBackButton} className="text-m px-2 py-1">
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
              placeholder="대화 내용 검색"
              className="flex-grow p-0 m-0 border-none outline-none bg-transparent focus:outline-none focus:ring-0 focus:border-transparent"
            />
            <div className="text-gray-400 ml-3 mr-3">
              | <button className="text-gray-400 hover:text-gray-700 ml-2 mr-3"> 검색</button>
            </div>
          </div>
        </div>
      )}

      {/* 메시지 리스트 */}
      <div className="flex flex-col h-full sm:h-[calc(100vh-120px)] min-h-0">
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
          />
        )}
      </div>

      {/* 입력창 */}
      <MessageInput onSend={handleSend} placeholder="메시지를 입력하세요…" submitLabel="전송" />

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
            chats={mockChats}
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
