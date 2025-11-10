// 채팅리스트 (왼쪽 - 검색 + 목록)
// - 왼쪽 패널: 헤더 + 사용자 검색 + 채팅 목록
// - 검색에서 유저를 선택하면 기존 DM 방을 열고, 없으면 새로 생성
// - chats 실시간 구독으로 변경사항 반영

import { useEffect, useState, useCallback } from 'react';
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
  selectedChatId: string | null;
  onSelect: (id: string) => void;
};

const DMList: React.FC<DMListProps> = ({ selectedChatId, onSelect }) => {
  const { user } = useAuth();

  const [chatList, setChatList] = useState<Chat[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [busy, setBusy] = useState(false);

  // 유틸: 내 profiles.id (chats FK와 동일한 축)
  const getMyId = useCallback(async () => {
    // ensureMyProfileId는 "profiles.id"를 반환하도록 구현되어 있다고 가정
    return ensureMyProfileId();
  }, []);

  // 사용자 / 채팅 목록 초기 로드
  useEffect(() => {
    (async () => {
      const myProfileId = await getMyId().catch(() => null);

      // 1) 사용자 목록: DMUserSearch용 (반드시 'id' 포함)
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, user_id, nickname, avatar_url');

      if (usersError) {
        console.error('[DMList] 사용자 패칭 에러:', usersError.message);
      } else {
        setUsers((usersData ?? []) as UserItem[]);
      }

      // 2) 채팅 목록: (선택) RLS 켜진 상황 고려 → 내 profiles.id가 멤버인 채팅만 조회
      //    RLS가 꺼져 있다면 전체가 오지만, UX/보안상 내 것만 필터링하는 편이 안전
      if (myProfileId) {
        const { data: chatsData, error: chatError } = await supabase
          .from('chats')
          .select('*')
          .or(`user1_id.eq.${myProfileId},user2_id.eq.${myProfileId}`)
          .order('created_at', { ascending: false }); // 정렬 컬럼은 스키마에 맞게 조정

        if (chatError) {
          console.error('[DMList] 채팅 패칭 에러:', chatError.message);
        } else {
          setChatList((chatsData ?? []) as Chat[]);
        }
      } else {
        // myProfileId가 없다면(로그인 이슈/프로필 미생성) 빈 목록
        setChatList([]);
      }
    })();
  }, [getMyId]);

  // chats 테이블 실시간 구독
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

  // 새 채팅 버튼 → 검색창 열기
  const handleNewChatClick = () => setIsSearchOpen(true);

  // 검색 결과에서 유저 선택 → 1:1 채팅 열기 (기존 방 재사용, 없으면 생성)
  const handleSelectUser = async (u: UserItem) => {
    if (busy) return;

    try {
      setBusy(true);

      const myProfileId = await getMyId();
      if (!myProfileId) throw new Error('내 프로필을 확인할 수 없습니다.');

      // "본인과의 채팅" 방지: profiles.id 기준으로 비교 (user_id 아님)
      if (u.id === myProfileId) {
        alert('본인과의 채팅은 생성할 수 없습니다.');
        return;
      }

      // 항상 profiles.id 기준으로 쌍 정렬 (중복 방 생성 방지)
      const u1 = myProfileId < u.id ? myProfileId : u.id;
      const u2 = myProfileId < u.id ? u.id : myProfileId;

      // 1) 기존 방 존재 여부 확인
      const { data: exists, error: selErr } = await supabase
        .from('chats')
        .select('id')
        .eq('user1_id', u1)
        .eq('user2_id', u2)
        .maybeSingle();

      if (selErr) throw selErr;

      if (exists?.id) {
        onSelect(exists.id);
        setIsSearchOpen(false);
        return;
      }

      // 2) 없으면 생성
      const {
        data: created,
        error: insErr,
        status,
      } = await supabase
        .from('chats')
        .insert([{ user1_id: u1, user2_id: u2 }])
        .select('id')
        .single();

      if (!insErr && created?.id) {
        setChatList(prev => [created as Chat, ...prev]);
        onSelect(created.id);
        setIsSearchOpen(false);
        return;
      }

      // 3) 경쟁 상태(이미 다른 클라이언트가 먼저 생성) 처리
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
      alert('채팅방 생성/열기에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } catch (e) {
      console.log('[DMList] open/select chat error:', e);
      alert('채팅방 처리 중 오류가 발생했습니다.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex flex-col h-dvh sm:h-[calc(100vh-120px)] overscroll-contain">
      {/* 상단 헤더 + (옵션) 검색 패널 */}
      <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
        <DMHeader onNewChatClick={handleNewChatClick} />
        {isSearchOpen && (
          <DMUserSearch
            users={users}
            onSelectUser={handleSelectUser}
            onClose={() => setIsSearchOpen(false)}
            // disabled={busy}  // 필요 시 클릭 잠금
          />
        )}
      </div>

      {/* 채팅 목록 */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-white">
        <DMChatList chats={chatList} selectedChatId={selectedChatId} onSelect={onSelect} />
      </div>
    </div>
  );
};

export default DMList;
