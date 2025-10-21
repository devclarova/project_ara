/* 채팅리스트 (왼쪽 - 검색 + 목록)
   - Tailwind 토큰으로 색상 정리(bg-gray-50 / border-gray-200)
   - DMUserSearch에 "사용자" 목록을 따로 전달
   - 새 유저 선택 시: 기존 대화 찾기 → 없으면 새 대화 생성 → 부모 onSelect 호출
*/

import { useEffect, useMemo, useState } from 'react';
import type { Chat } from '../../../types/dm';
import DMChatList from './DMChatList';
import DMHeader from './DMHeader';
import DMUserSearch from './DMUserSearch';
// import { mockChatData } from '../chat';
import { supabase } from '../../../lib/supabase';

type DMListProps = {
  chats: Chat[];
  selectedChatId: string | null;
  onSelect: (id: string) => void;
  onUpdateChat: (id: string, patch: Partial<Chat>) => void;
  onSearchToggle?: () => void;
};

const DMList: React.FC<DMListProps> = ({ chats, selectedChatId, onSelect }) => {
  const [chatList, setChatList] = useState<Chat[]>([]); // Supabase에서 가져온 채팅 목록 상태
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Supabase에서 채팅 목록을 가져오는 함수
  useEffect(() => {
    const fetchChats = async () => {
      const { data, error } = await supabase
        .from('chats') // 'chats' 테이블에서 데이터 가져오기
        .select('*');

      if (error) {
        console.log('채팅 에러 패칭 :', error.message);
      } else {
        setChatList(data || []); // data가 null일 경우 빈 배열로 처리
      }
    };

    fetchChats();
  }, []);

  // 새 채팅 버튼 클릭 시 검색 창 열기
  const handleNewChatClick = () => {
    setIsSearchOpen(true);
  };

  // 사용자 목록 준비
  const users = useMemo(
    () =>
      chatList.map(c => ({
        id: String(c.id),
        nickname: c.name,
        avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(c.name)}`,
      })),
    [chatList],
  );

  // 유저 선택 시 처리: 기존 채팅이 있으면 선택, 없으면 새 채팅 생성
  const handleSelectUser = async (u: { id: string; nickname: string }) => {
    const existing = chatList.find(c => String(c.id) === u.id);
    if (existing) {
      onSelect(existing.id);
      return;
    }

    const now = new Date();
    const newChat: Chat = {
      id: u.id,
      name: u.nickname,
      lastMessage: '새 대화를 시작해보세요!',
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      unread: 0,
      avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(u.nickname)}`,
      pinned: false,
      alarmOff: false,
      lastUpdated: now.toISOString(),
      participantIds: [u.id, 'user1'],
      user1_id: 'user1',
      user2_id: u.id,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    // 새 채팅을 Supabase에 추가
    const { data, error } = await supabase
      .from('chats') // 'chats' 테이블에 새 채팅 추가
      .insert([newChat])
      .single(); // 단일 결과만 반환받기 위해 .single() 사용

    if (error) {
      console.error('Error inserting new chat:', error.message);
    } else {
      const newChatData = data as Chat; // `data`를 Chat 타입으로 명시
      setChatList(prev => [newChatData, ...prev]); // 새 채팅 추가
      onSelect(newChatData.id); // 새 채팅 선택
    }
  };

  return (
    <div className="relative flex flex-col h-dvh sm:h-[calc(100vh-120px)] overscroll-contain">
      <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
        <DMHeader onNewChatClick={handleNewChatClick} />
        {isSearchOpen && (
          <DMUserSearch
            users={users}
            onSelectUser={handleSelectUser}
            onClose={() => setIsSearchOpen(false)}
          />
        )}
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        <DMChatList chats={chatList} selectedChatId={selectedChatId} onSelect={onSelect} />
      </div>
    </div>
  );
};

export default DMList;
