// DMPage.tsx — 정리/최적화 버전
// - 역할별 함수 분리(getMyProfile, getChats, getRoomMeta)
// - 의존성 명확화 및 가드 추가
// - 주석 보강(데이터 흐름/의도/오류 처리 위치)
// - UI 구조는 동일, 스타일은 최소 수정

import { useEffect, useState, useCallback } from 'react';
import type { MessagesRow, Profile } from '../../../types/database';
import type { Chat } from '../../../types/dm';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import DMList from './DMList';
import DMRoom from './DMRoom';
// import SidebarLeft from '@/components/layout/SidebarLeft';

type RoomMeta = { title: string; avatarUrl: string };

const DEFAULT_AVATAR = '/default-avatar.svg';

function DMPage() {
  const { user } = useAuth();

  // UI 상태
  const [messages, setMessages] = useState<MessagesRow[]>([]); // 현재 파일에서는 직접 사용 X (DMRoom에서 소비될 수 있으니 유지)
  const [chatList, setChatList] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  // 데이터 상태
  const [profile, setProfile] = useState<Profile | null>(null); // 내 프로필
  const [roomMeta, setRoomMeta] = useState<RoomMeta | null>(null); // 선택된 방의 상대 정보(닉네임/아바타)

  // 로딩/에러 상태
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingRoomMeta, setLoadingRoomMeta] = useState(false);

  // 내 프로필 조회
  const getMyProfile = useCallback(async (userId: string) => {
    setLoadingProfile(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, nickname, avatar_url')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setProfile(data as Profile);
    } catch (err) {
      console.error('[DMPage] 프로필 데이터 로드 실패:', err);
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  // 내가 속한 채팅 목록 조회
  const getChats = useCallback(async () => {
    setLoadingChats(true);
    try {
      const { data, error } = await supabase.from('chats').select('*');
      if (error) throw error;
      setChatList((data ?? []) as Chat[]);
    } catch (err) {
      console.log('[DMPage] 채팅 목록 패칭 에러:', err);
      setChatList([]);
    } finally {
      setLoadingChats(false);
    }
  }, []);

  // 특정 채팅방의 상대 프로필 메타(닉네임/아바타) 조회
  const getRoomMeta = useCallback(async (chatId: string, me?: { id?: string | null }) => {
    if (!chatId || !me?.id) {
      setRoomMeta(null);
      return;
    }

    setLoadingRoomMeta(true);
    try {
      // 채팅 행에서 상대 user id 추출
      const { data: chatRow, error: chatErr } = await supabase
        .from('chats')
        .select('id, user1_id, user2_id')
        .eq('id', chatId)
        .maybeSingle();

      if (chatErr) throw chatErr;
      if (!chatRow) {
        setRoomMeta(null);
        return;
      }

      const otherUserId = chatRow.user1_id === me.id ? chatRow.user2_id : chatRow.user1_id;

      // 상대의 프로필 조회
      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('nickname, avatar_url')
        .eq('id', otherUserId)
        .maybeSingle();

      if (profErr) throw profErr;

      setRoomMeta({
        title: prof?.nickname ?? '알 수 없음',
        avatarUrl: prof?.avatar_url ?? DEFAULT_AVATAR,
      });
    } catch (err) {
      console.error('[DMPage] 룸 메타 로드 실패:', err);
      setRoomMeta({
        title: chatId, // 최소 fallback
        avatarUrl: DEFAULT_AVATAR,
      });
    } finally {
      setLoadingRoomMeta(false);
    }
  }, []);

  // 내 프로필
  useEffect(() => {
    if (!user?.id) return;
    getMyProfile(user.id);
  }, [user?.id, getMyProfile]);

  // 채팅 목록
  useEffect(() => {
    getChats();
  }, [getChats]);

  // 선택 방 메타 (선택 변경 시마다)
  useEffect(() => {
    if (!selectedChatId || !user?.id) {
      setRoomMeta(null);
      return;
    }
    getRoomMeta(selectedChatId, { id: user.id });
  }, [selectedChatId, user?.id, getRoomMeta]);

  // 페이지 전환 시 스크롤 상단 고정
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [selectedChatId]);

  // 콜백: 메시지 전송 후 목록 갱신(미리보기, 시간, 뱃지)
  const handleAfterSend = (chatId: string, lastText: string, localTime: string) => {
    setChatList(prev =>
      prev.map(c =>
        c.id === chatId ? { ...c, lastMessage: lastText, time: localTime, unread: 0 } : c,
      ),
    );
  };

  return (
    <div className="min-h-screen flex max-w-7xl  mx-auto">
      {/* <SidebarLeft /> */}
      <div className="flex flex-col flex-1 min-h-0 h-full mt-2 mb-2 bg-white text-gray-900 mx-auto w-full max-w-[1200px] px-2 sm:px-4 lg:px-8 overflow-y-auto">
        <div className="flex flex-1 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          {/* 좌측: 채팅 목록(데스크톱 이상) */}
          <aside className="hidden sm:flex sm:w-[260px] md:w-[300px] lg:w-[340px] border-r border-gray-200 bg-gray-50 flex-col overflow-y-auto transition-all duration-300">
            <DMList
              // chats={chatList}
              selectedChatId={selectedChatId}
              onSelect={setSelectedChatId}
              // onUpdateChat={() => {}}
              // 필요시 로딩 표시 전달: loading={loadingChats}
            />
          </aside>

          {/* 우측: 채팅룸 or 안내 */}
          <main className="flex-1 flex flex-col bg-white overflow-hidden">
            {selectedChatId ? (
              <DMRoom
                chatId={selectedChatId}
                title={roomMeta?.title || selectedChatId} // 상대 닉네임(Fallback: ID)
                avatarUrl={roomMeta?.avatarUrl || DEFAULT_AVATAR} // 상대 아바타(Fallback)
                onAfterSend={handleAfterSend}
                setSelectedChatId={setSelectedChatId}
              />
            ) : (
              <>
                {/* 모바일: 목록 먼저 노출 */}
                <div className="sm:hidden flex-1 overflow-y-auto bg-gray-50">
                  <DMList
                    // chats={chatList}
                    selectedChatId={selectedChatId}
                    onSelect={setSelectedChatId}
                    // onUpdateChat={() => {}}
                  />
                </div>

                {/* 데스크톱: 빈 상태 안내 */}
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
    </div>
  );
}

export default DMPage;
