// 개별 메시지 버블(내/상대 구분 + 시간/프로필 + 읽지 않은 메시지 배지 표시)

import { useState, useMemo, useEffect, useRef } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import type { Chat, Message } from '../../../types/dm';
import DMList from './DMList';
import { supabase } from '../../../lib/supabase';

type DMRoomProps = {
  chatId: string;
  title: string;
  avatarUrl: string;
  onAfterSend?: (chatId: string, lastText: string, localTime: string) => void;
  setSelectedChatId: (id: string | null) => void;
};

function DMRoom({ chatId, title, avatarUrl, onAfterSend, setSelectedChatId }: DMRoomProps) {
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [justSent, setJustSent] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false); // 햄버거 메뉴 드롭다운
  const [showChatList, setShowChatList] = useState(false); // 채팅목록 보기 상태
  const [showSearch, setShowSearch] = useState(false); // 검색창 표시 여부
  const [isAlarmOn, setIsAlarmOn] = useState(true); // 알림 상태
  const [isPinned, setIsPinned] = useState(false); // 핀 표시 여부
  const [selectedChatId, setSelectedChatIdInternal] = useState<string | null>(null);
  const chatListRef = useRef<HTMLDivElement>(null); // 채팅목록을 위한 ref
  const dropdownRef = useRef<HTMLDivElement>(null); // 채팅목록을 위한 ref

  // 채팅방 닫고 목록으로
  const handleBackButton = () => {
    setSelectedChatIdInternal(null);
    setSelectedChatId(null);
  };

  const fetchMessages = async (chatId: string): Promise<Message[]> => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true }); // 시간 순으로 정렬

    if (error) {
      console.error('Error fetching messages:', error.message);
      return [];
    }

    return data as Message[];
  };

  const sendMessage = async (chatId: string, content: string): Promise<Message> => {
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          chat_id: chatId,
          sender_id: 'me', // 현재 사용자 ID (여기서는 예시로 "me" 사용, 실제로는 auth를 통해 동적으로 얻어야 함)
          content,
          created_at: new Date().toISOString(),
          type: 'text', // 기본 메시지 유형 'text'
        },
      ])
      .single(); // 하나의 메시지만 반환

    if (error) {
      console.error('Error sending message:', error.message);
      return null as any; // 오류 처리
    }

    return data as Message; // 성공적으로 삽입된 메시지 반환
  };

  // 채팅 목록 가져오기
  useEffect(() => {
    const fetchChats = async () => {
      const { data, error } = await supabase.from('chats').select('*');

      if (error) {
        console.log('채팅 에러 패치 :', error.message);
      } else {
        // 여기에 채팅 목록 데이터를 DMList에 전달
        setSelectedChatIdInternal(data ? data[0].id : null);
      }
    };

    fetchChats();
  }, []);

  // 채팅 데이터 불러오기
  useEffect(() => {
    const fetchMessages = async () => {
      if (!chatId) return; // chatId가 없으면 실행하지 않음

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true }); // 시간순으로 정렬

      if (error) {
        console.log('메시지 패칭 에러:', error.message);
      } else {
        setMsgs(data); // 메시지 상태에 데이터 저장
      }
    };

    fetchMessages(); // chatId가 바뀔 때마다 실행
  }, [chatId]); // chatId가 변경될 때마다 실행

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

  // 메시지 전송
  const handleSend = async (text: string) => {
    const newMsg = await sendMessage(String(chatId), text);
    setMsgs(prev => [...prev, newMsg]);

    setJustSent(true);
    setTimeout(() => setJustSent(false), 0);

    onAfterSend?.(chatId, text, new Date().toLocaleTimeString());
  };

  // 채팅 목록을 보여주는 슬라이드
  const handleSelectChat = (id: string) => {
    setSelectedChatIdInternal(id);
    setSelectedChatId(id); // 부모로 선택된 채팅 ID 전달
    setShowChatList(false); // 채팅 목록 닫기
  };

  const handleUpdateChat = (id: string, patch: Partial<Chat>) => {
    // 채팅 업데이트 로직
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
      <header className="sm:hidden flex items-center gap-2 p-3 border-b-0 bg-white relative">
        <button onClick={handleBackButton} className="text-m px-2 py-1">
          <img src="/back.svg" alt="뒤로가기" />
        </button>
        <img src={avatarUrl} alt="프로필이미지" className="w-9 h-9 rounded-full" />
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
      </header>

      {/* 고정 헤더 (태블릿 이상에서 보임) */}
      <header className="hidden sm:flex p-3 border-b bg-white items-center gap-3">
        <img src={avatarUrl} alt="프로필이미지" className="w-9 h-9 rounded-full" />
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
      </header>

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
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">불러오는 중…</div>
      ) : (
        <MessageList
          messages={sorted.map(m => ({
            id: m.id,
            chat_id: String(m.chat_id),
            sender_id: m.sender_id,
            auth_id: m.sender_id,
            content: m.content,
            created_at: m.created_at,
            type: 'text',
          }))}
          autoScrollMode="onSend"
          justSent={justSent}
        />
      )}

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
            chats={[]}
            selectedChatId={selectedChatId}
            onSelect={handleSelectChat}
            onUpdateChat={handleUpdateChat}
          />
        </div>
      )}
    </div>
  );
}

export default DMRoom;
