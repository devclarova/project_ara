/* 채팅리스트 (왼쪽 - 검색 + 목록)
   - Tailwind 토큰으로 색상 정리(bg-gray-50 / border-gray-200)
   - DMUserSearch에 "사용자" 목록을 따로 전달
   - 새 유저 선택 시: 기존 대화 찾기 → 없으면 새 대화 생성 → 부모 onSelect 호출
*/
import { useMemo, useState } from 'react';
import type { Chat } from '../../../types/dm';
import { mockChats } from '../chat';
import DMChatList from './DMChatList';
import DMHeader from './DMHeader';
import DMUserSearch from './DMUserSearch';

type DMListProps = {
  chats: Chat[];
  selectedChatId: number | null;
  onSelect: (id: number) => void;
  onUpdateChat: (id: number, patch: Partial<Chat>) => void;
};

const DMList: React.FC<DMListProps> = ({ chats, selectedChatId, onSelect }) => {
  // 초기 상태 설정 (목업데이터 사용)
  const [chatList, setChatList] = useState<Chat[]>(chats.length ? chats : mockChats);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // 새 채팅 버튼 클릭 시 검색 창 열기
  const handleNewChatClick = () => {
    setIsSearchOpen(true);
  };

  const users = useMemo(
    () =>
      chatList.map(c => ({
        id: String(c.id), // DMUserSearch가 string id를 기대
        nickname: c.name,
        avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(c.name)}`,
      })),
    [chatList],
  );

  // 유저 선택 시 처리: 선택 상태는 부모가 소유(onSelect)
  const handleSelectUser = (u: { id: string; nickname: string }) => {
    const existing = chatList.find(c => String(c.id) === u.id);
    if (existing) {
      onSelect(existing.id);
      return;
    }

    const newId = chatList.length ? Math.max(...chatList.map(c => c.id)) + 1 : 1;
    const now = new Date();
    const newChat: Chat = {
      id: newId,
      name: u.nickname,
      lastMessage: '새 대화를 시작해보세요!',
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      unread: 0,
    };

    setChatList(prev => [newChat, ...prev]);
    onSelect(newId);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 border-r border-gray-200">
      <DMHeader onNewChatClick={handleNewChatClick} />
      {isSearchOpen && <DMUserSearch users={users} onSelectUser={handleSelectUser} />}
      <DMChatList chats={chatList} selectedChatId={selectedChatId} onSelect={onSelect} />
    </div>
  );
};

export default DMList;
