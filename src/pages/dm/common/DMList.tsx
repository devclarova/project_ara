/* 채팅리스트 (왼쪽 - 검색 + 목록)
   - Tailwind 토큰으로 색상 정리(bg-gray-50 / border-gray-200)
   - DMUserSearch에 "사용자" 목록을 따로 전달
   - 새 유저 선택 시: 기존 대화 찾기 → 없으면 새 대화 생성 → 부모 onSelect 호출
*/

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import type { Chat } from '../../../types/dm';
import DMChatList from './DMChatList';
import DMHeader from './DMHeader';
import DMUserSearch from './DMUserSearch';

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
  const [users, setUsers] = useState<any[]>([]); // 사용자 목록 상태

  // Supabase에서 채팅 목록과 사용자 목록을 가져오는 함수
  useEffect(() => {
    const fetchChatsAndUsers = async () => {
      // 채팅 목록 가져오기
      const { data: chatsData, error: chatError } = await supabase
        .from('chats') // 'chats' 테이블에서 데이터 가져오기
        .select('*');

      if (chatError) {
        console.log('채팅 에러 패칭 :', chatError.message);
      } else {
        setChatList(chatsData || []); // data가 null일 경우 빈 배열로 처리
      }

      // 사용자 목록 가져오기 (user1_id, user2_id를 기반으로 profiles에서 가져오기)
      const userIds = Array.from(
        new Set(
          // user1_id와 user2_id를 중복 없이 합침
          chatsData?.flatMap((chat: Chat) => [chat.user1_id, chat.user2_id]) || [],
        ),
      );

      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_url')
        .in('id', userIds); // userIds에 포함된 사용자만 가져오기

      if (usersError) {
        console.log('사용자 에러 패칭 :', usersError.message);
      } else {
        setUsers(usersData || []);
      }
    };

    fetchChatsAndUsers();
  }, []);

  // 새 채팅 버튼 클릭 시 검색 창 열기
  const handleNewChatClick = () => {
    setIsSearchOpen(true);
  };

  // 유저 선택 시 처리: 기존 채팅이 있으면 선택, 없으면 새 채팅 생성
  const handleSelectUser = async (u: { id: string; nickname: string }) => {
    // 기존 채팅방 찾기
    const existingChat = chatList.find(
      c =>
        (c.user1_id === u.id || c.user2_id === u.id) &&
        (c.user1_id !== u.id || c.user2_id !== u.id),
    );

    if (existingChat) {
      // 기존 채팅방이 있으면 해당 채팅방으로 이동
      onSelect(existingChat.id);
      return;
    }

    // 프로필 정보가 없으면 추가 (유저 정보 확인)
    const user1Profile = users.find(user => user.id === u.id);

    if (!user1Profile) {
      console.log('유저 프로필이 없습니다.');
      alert('해당 유저의 프로필이 존재하지 않습니다.'); // 사용자에게 알림
      return;
    }

    const now = new Date();
    const newChat: Chat = {
      id: u.id,
      user1_id: u.id,
      user2_id: 'user1', // 상대방의 user2_id (여기서는 'user1'이지만 실제로는 상대방의 ID로 바꿔야 함)

      // user1과 user2 프로필을 각각 찾는다
      user1: user1Profile, // 실제 유저 프로필
      user2: users.find(profile => profile.id === 'user1') || {
        id: 'user1',
        nickname: 'User1',
        avatar_url: '',
      }, // 상대방 프로필 (여기선 'user1'으로 가정)

      lastMessage: '새 대화를 시작해보세요!',
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      unread: 0,
      avatarUrl: user1Profile.avatar_url || '', // 사용자1의 아바타 URL
      pinned: false,
      alarm: true,
      lastUpdated: now.toISOString(),
      participantIds: [u.id, 'user1'],
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
