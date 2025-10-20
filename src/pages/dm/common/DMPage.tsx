import { useEffect, useMemo, useState } from 'react';
import type { MessagesRow, Profile } from '../../../types/database';

import { supabase } from '../../../lib/supabase';
import DMList from './DMList';
import DMRoom from './DMRoom';
import type { Chat } from '../../../types/dm';
import { useAuth } from '../../../contexts/AuthContext';

function DMPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessagesRow[]>([]); // 실제 메시지 상태 관리
  const [chatList, setChatList] = useState<Chat[]>([]); // 실제 채팅 목록을 위한 상태
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null); // 선택된 채팅방 ID
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const selectedChat = useMemo(
    () => messages.find(c => c.id === selectedChatId) ?? null,
    [messages, selectedChatId],
  );

  // 프로필 불러오기
  useEffect(() => {
    if (!user) return; // user가 없으면 프로필을 불러오지 않음

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles') // profiles 테이블에서 프로필 데이터 가져오기
        .select('avatar_url') // 필요 데이터만 선택
        .eq('user_id', user.id) // user.id와 매칭되는 프로필 찾기
        .single(); // 한 개의 데이터만 가져오기

      if (error) {
        console.error('프로필 데이터 로드 실패', error);
      } else {
        setProfile(data); // profile 상태 업데이트
      }
    };

    if (user) {
      fetchProfile(); // 사용자가 있을 경우 프로필 불러오기
    }
  }, [user]); // user가 변경될 때마다 실행

  // 실제 채팅 목록을 Supabase에서 가져오는 함수
  useEffect(() => {
    const fetchChats = async () => {
      const { data, error } = await supabase.from('chats').select('*'); // 'chats' 테이블에서 실제 채팅 목록 가져오기

      if (error) {
        console.log('채팅 목록 패칭 에러', error);
      } else {
        setChatList(data); // 채팅 목록 데이터 업데이트
      }
    };

    fetchChats();
  }, []); // 컴포넌트가 마운트될 때 채팅 목록 불러오기

  // 메시지 불러오기
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChatId) return; // 선택된 채팅방 ID가 없으면 반환

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', selectedChatId); // 선택된 채팅방의 메시지만 불러오기

      if (error) {
        console.log('메시지 패칭 에러', error); // 오류 발생 시 에러 메시지 출력
      } else {
        setMessages(data); // 정상적으로 데이터 불러오면 상태 업데이트
      }
    };

    fetchMessages(); // 채팅방 ID 변경시 메시지 불러오기
  }, [selectedChatId, messages]); // 채팅방이 변경될 때마다 메시지 불러오기

  const handleAfterSend = (chatId: string, lastText: string, localTime: string) => {
    setMessages(prev =>
      prev.map(c =>
        c.id === chatId ? { ...c, lastMessage: lastText, time: localTime, unread: 0 } : c,
      ),
    );
  };

  // 채팅 전환 시 전체 페이지 스크롤을 맨 위로
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [selectedChatId]);

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full mt-2 mb-2 bg-white text-gray-900 mx-auto w-full max-w-[1200px] px-2 sm:px-4 lg:px-8 overflow-y-auto">
      <div className="flex flex-1 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        {/* 왼쪽 사이드바 (내부만 스크롤) */}
        <aside className="hidden sm:flex sm:w-[260px] md:w-[300px] lg:w-[340px] border-r border-gray-200 bg-gray-50 flex-col overflow-y-auto transition-all duration-300">
          <DMList
            chats={chatList}
            selectedChatId={selectedChatId}
            onSelect={setSelectedChatId}
            onUpdateChat={() => {}}
          />
        </aside>

        {/* 오른쪽 메인 영역 (내부만 스크롤) */}
        <main className="flex-1 flex flex-col bg-white overflow-hidden">
          {selectedChat ? (
            <DMRoom
              chatId={selectedChat.chat_id} // 채팅 ID를 DMRoom에 전달
              title={selectedChat.chat_id} // 채팅 이름을 DMRoom에 전달
              avatarUrl={profile?.avatar_url || '/default_avatar.svg'} // 기본이미지 넣기
              onAfterSend={handleAfterSend}
              setSelectedChatId={setSelectedChatId}
            />
          ) : (
            <>
              <div className="sm:hidden flex-1 overflow-y-auto bg-gray-50">
                <DMList
                  chats={chatList} // 실제 채팅 목록을 DMList에 전달
                  selectedChatId={selectedChatId}
                  onSelect={setSelectedChatId}
                  onUpdateChat={() => {}}
                />
              </div>
              {/* 안내 화면 */}
              <div className="hidden sm:flex flex-1 items-center justify-center text-center p-8 text-gray-600 overflow-auto">
                <div>
                  <h2 className="text-2xl font-semibold mb-2">1 : 1 채팅</h2>
                  <p className="text-sm sm:text-base">좌측에서 채팅방을 선택하거나</p>
                  <p className="text-sm sm:text-base">새 채팅 버튼을 눌러 대화를 시작하세요.</p>
                  <div className="mt-6 text-gray-700 space-y-1 text-sm sm:text-base">
                    <p>💬 실시간 1:1 메시지</p>
                    <p>👥 사용자 검색 및 초대</p>
                    <p>📱 반응형 디자인</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default DMPage;
