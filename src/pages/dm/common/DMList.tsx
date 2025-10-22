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
import { useAuth } from '../../../contexts/AuthContext';
import { ensureMyProfileId } from '../../../lib/ensureMyProfileId';

type UserItem = {
  id: string;
  user_id: string;
  nickname: string;
  avatar_url?: string;
};

type DMListProps = {
  chats: Chat[];
  selectedChatId: string | null;
  onSelect: (id: string) => void;
  onUpdateChat: (id: string, patch: Partial<Chat>) => void;
  onSearchToggle?: () => void;
};

const DMList: React.FC<DMListProps> = ({ selectedChatId, onSelect }) => {
  const { user } = useAuth();
  const [chatList, setChatList] = useState<Chat[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [busy, setBusy] = useState(false);

  // 사용자/채팅 목록 가져오기
  useEffect(() => {
    (async () => {
      const [{ data: usersData, error: usersError }, { data: chatsData, error: chatError }] =
        await Promise.all([
          supabase.from('profiles').select('user_id, nickname, avatar_url'),
          supabase.from('chats').select('*'),
        ]);

      if (usersError) console.log('사용자 에러 패칭:', usersError.message);
      else setUsers((usersData ?? []) as UserItem[]);

      if (chatError) console.log('채팅 에러 패칭:', chatError.message);
      else setChatList((chatsData ?? []) as Chat[]);
    })();
  }, []);

  // (선택) chats 테이블 실시간 구독
  useEffect(() => {
    const channel = supabase
      .channel('chats-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, payload => {
        if (payload.eventType === 'INSERT') {
          setChatList(prev => [payload.new as Chat, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setChatList(prev =>
            prev.map(c => (c.id === (payload.new as Chat).id ? (payload.new as Chat) : c)),
          );
        } else if (payload.eventType === 'DELETE') {
          setChatList(prev => prev.filter(c => c.id !== (payload.old as Chat).id));
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleNewChatClick = () => setIsSearchOpen(true);

  // 선택 유저와의 1:1 채팅 열기(있으면 열고 없으면 생성)
  const handleSelectUser = async (u: UserItem) => {
    console.log('[DMList] 선택한 유저:', u);

    const myProfileId = await ensureMyProfileId(); // ✅ 내 profiles.id 확보

    if (u.user_id === myProfileId) {
      alert('본인과의 채팅은 생성할 수 없습니다.');
      return;
    }

    if (busy) return;
    setBusy(true);

    try {
      // profiles.id 기준으로 정렬
      const u1 = myProfileId < u.user_id ? myProfileId : u.user_id;
      const u2 = myProfileId < u.user_id ? u.user_id : myProfileId;

      // 기존 방 조회
      const { data: exists } = await supabase
        .from('chats')
        .select('id')
        .eq('user1_id', u1)
        .eq('user2_id', u2)
        .maybeSingle();

      if (exists?.id) {
        onSelect(exists.id);
        setIsSearchOpen(false);
        return;
      }

      // 없으면 생성
      const {
        data: created,
        error: insErr,
        status,
      } = await supabase
        .from('chats')
        .insert([{ user1_id: u1, user2_id: u2 }]) // ✅ FK: profiles.id
        .select('id')
        .single();

      if (!insErr && created?.id) {
        setChatList(prev => [created as Chat, ...prev]);
        onSelect(created.id);
        setIsSearchOpen(false);
        return;
      }

      // 경쟁(409) 처리
      if (status === 409 || (insErr && `${insErr.message}`.includes('duplicate'))) {
        const { data: again } = await supabase
          .from('chats')
          .select('id')
          .eq('user1_id', u1)
          .eq('user2_id', u2)
          .maybeSingle();
        if (again?.id) {
          onSelect(again.id);
          setIsSearchOpen(false);
          return;
        }
      }

      if (insErr) throw insErr;
      alert('채팅방 생성/열기에 실패했습니다.');
    } catch (e) {
      console.error('open/select chat error', e);
      alert('채팅방 처리 중 오류가 발생했습니다.');
    } finally {
      setBusy(false);
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
            // (선택) busy 내려서 클릭 잠그기
            // disabled={busy}
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
