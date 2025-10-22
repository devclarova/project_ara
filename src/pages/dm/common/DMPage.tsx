import { useEffect, useMemo, useState } from 'react';
import type { MessagesRow, Profile } from '../../../types/database';
import { supabase } from '../../../lib/supabase';
import DMList from './DMList';
import DMRoom from './DMRoom';
import type { Chat } from '../../../types/dm';
import { useAuth } from '../../../contexts/AuthContext';

type RoomMeta = { title: string; avatarUrl: string };

function DMPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessagesRow[]>([]);
  const [chatList, setChatList] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roomMeta, setRoomMeta] = useState<RoomMeta | null>(null);

  const selectedChat = useMemo(
    () => chatList.find(c => c.id === selectedChatId) ?? null,
    [chatList, selectedChatId],
  );

  // 내 프로필 로드 (필요 필드 함께 선택 권장)
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, avatar_url')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('프로필 데이터 로드 실패', error);
      } else {
        setProfile(data as Profile);
      }
    })();
  }, [user?.id]);

  // 채팅 목록 로드 (RLS가 멤버만 필터링)
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('chats').select('*');
      if (error) {
        console.log('채팅 목록 패칭 에러', error);
      } else {
        setChatList((data ?? []) as Chat[]);
      }
    })();
  }, []);

  // 메시지 로드: 의존성은 selectedChatId 만
  useEffect(() => {
    (async () => {
      if (!selectedChatId || !user?.id) {
        setRoomMeta(null);
        return;
      }
      const { data: chatRow } = await supabase
        .from('chats')
        .select('id, user1_id, user2_id')
        .eq('id', selectedChatId)
        .maybeSingle();

      if (!chatRow) {
        setRoomMeta(null);
        return;
      }
      const otherId = chatRow.user1_id === user.id ? chatRow.user2_id : chatRow.user1_id;

      const { data: prof } = await supabase
        .from('profiles')
        .select('nickname, avatar_url')
        .eq('id', otherId)
        .maybeSingle();

      setRoomMeta({
        title: prof?.nickname ?? '알 수 없음',
        avatarUrl: prof?.avatar_url ?? '/default-avatar.svg',
      });
    })();
  }, [selectedChatId, user?.id]);

  // 디버그
  useEffect(() => {
    console.log('[DMPage]selectedChatId : ', selectedChatId);
  }, [selectedChatId]);

  // 채팅목록 갱신용
  const handleAfterSend = (chatId: string, lastText: string, localTime: string) => {
    setChatList(prev =>
      prev.map(c =>
        c.id === chatId ? { ...c, lastMessage: lastText, time: localTime, unread: 0 } : c,
      ),
    );
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [selectedChatId]);

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full mt-2 mb-2 bg-white text-gray-900 mx-auto w-full max-w-[1200px] px-2 sm:px-4 lg:px-8 overflow-y-auto">
      <div className="flex flex-1 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        {/* 왼쪽: 채팅 목록 */}
        <aside className="hidden sm:flex sm:w-[260px] md:w-[300px] lg:w-[340px] border-r border-gray-200 bg-gray-50 flex-col overflow-y-auto transition-all duration-300">
          <DMList
            chats={chatList}
            selectedChatId={selectedChatId}
            onSelect={setSelectedChatId}
            onUpdateChat={() => {}}
          />
        </aside>

        {/* 오른쪽: DMRoom 또는 안내 */}
        <main className="flex-1 flex flex-col bg-white overflow-hidden">
          {selectedChatId ? (
            <DMRoom
              chatId={selectedChatId}
              title={roomMeta?.title || selectedChatId} // 상대 닉네임
              avatarUrl={roomMeta?.avatarUrl || '/default-avatar.svg'} // 상대 아바타
              onAfterSend={handleAfterSend}
              setSelectedChatId={setSelectedChatId}
            />
          ) : (
            <>
              <div className="sm:hidden flex-1 overflow-y-auto bg-gray-50">
                <DMList
                  chats={chatList}
                  selectedChatId={selectedChatId}
                  onSelect={setSelectedChatId}
                  onUpdateChat={() => {}}
                />
              </div>
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
