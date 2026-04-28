/**
 * 전역 차단 사용자 관리 컨텍스트(Global Blocked Users Context):
 * - 목적(Why): 서비스 전역에서 차단된 사용자 목록을 중앙 집중식으로 관리하여 중복 API 호출을 방지하고 필터링 일관성을 유지함
 * - 방법(How): 단일 Supabase 쿼리로 목록을 로드하고, REFRESH_BLOCKED_USERS 이벤트를 통해 실시간 동기화를 수행함
 */
import { createContext, useContext, useState, useEffect, useCallback, useMemo, type PropsWithChildren } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { type PostgrestError } from '@supabase/supabase-js';

export interface BlockedUser {
  id: string; // profile id
  user_id: string; // auth id (UUID)
  username: string; // handle (e.g. user_123)
  nickname: string;
  avatar_url: string;
}

interface BlockedUsersContextType {
  blockedIds: string[];
  blockingMeIds: string[]; // 나를 차단한 유저 목록 추가
  blockedUsers: BlockedUser[];
  isLoading: boolean;
  error: PostgrestError | null;
  refresh: () => Promise<void>;
  unblock: (targetId: string) => Promise<void>;
}

const BlockedUsersContext = createContext<BlockedUsersContextType | null>(null);

export function BlockedUsersProvider({ children }: PropsWithChildren) {
  const { user, profileId } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [blockingMeIds, setBlockingMeIds] = useState<string[]>([]); // 상태 추가
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchBlockedUsers = useCallback(async () => {
    if (!user || !profileId) {
      setBlockedUsers([]);
      setBlockedIds([]);
      setBlockingMeIds([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // 1. 내가 차단한 유저 및 2. 나를 차단한 유저 목록을 병렬로 조회
      const [blockedRes, blockingMeRes] = await Promise.all([
        (supabase.from('user_blocks') as any)
          .select(`
            blocked_id,
            profiles:blocked_id (
              id,
              user_id,
              username,
              nickname,
              avatar_url
            )
          `)
          .eq('blocker_id', profileId)
          .is('ended_at', null),
        (supabase.from('user_blocks') as any)
          .select('blocker_id')
          .eq('blocked_id', profileId)
          .is('ended_at', null)
      ]);

      if (blockedRes.error) throw blockedRes.error;
      if (blockingMeRes.error) throw blockingMeRes.error;

      type BlockRow = {
        blocked_id: string;
        profiles: { id: string; user_id: string; username: string | null; nickname: string; avatar_url: string } | null;
      };
      
      const mapped = (blockedRes.data as BlockRow[] || [])
        .map(row => ({
          id: row.profiles?.id,
          user_id: row.profiles?.user_id,
          username: row.profiles?.username || row.profiles?.nickname || 'unknown',
          nickname: row.profiles?.nickname,
          avatar_url: row.profiles?.avatar_url,
        }))
        .filter((u): u is BlockedUser => !!u.id && !!u.user_id);

      setBlockedUsers(mapped);
      
      // 1. 내가 차단한 유저 ID 세트 (Profile ID + Auth ID)
      const allBlockedIds = new Set<string>();
      mapped.forEach(u => {
        if (u.id) allBlockedIds.add(u.id);
        if (u.user_id) allBlockedIds.add(u.user_id);
      });
      setBlockedIds(Array.from(allBlockedIds));

      // 2. 나를 차단한 유저 ID 목록 (Profile ID만 저장해도 판별 가능)
      const allBlockingMeIds = (blockingMeRes.data as { blocker_id: string }[] || []).map(row => row.blocker_id);
      setBlockingMeIds(allBlockingMeIds);

      setError(null);
    } catch (err: any) {
      console.error('[BlockedUsersContext] fetch error:', err);
      if (err?.code) setError(err as PostgrestError);
    } finally {
      setIsLoading(false);
    }
  }, [user, profileId]);

  useEffect(() => {
    fetchBlockedUsers();
    
    const handleRefresh = () => fetchBlockedUsers();
    window.addEventListener('REFRESH_BLOCKED_USERS', handleRefresh);
    return () => window.removeEventListener('REFRESH_BLOCKED_USERS', handleRefresh);
  }, [fetchBlockedUsers]);

  const unblock = async (targetId: string) => {
    if (!profileId) return;

    const { error: unblockErr } = await (supabase.from('user_blocks') as any)
      .update({ ended_at: new Date().toISOString() })
      .eq('blocker_id', profileId)
      .eq('blocked_id', targetId);

    if (unblockErr) {
      console.error('[BlockedUsersContext] unblock error:', unblockErr);
      return;
    }

    // 1:1 채팅방 상태 갱신 (선택적)
    try {
      const { data: chatData } = await (supabase.from('direct_chats') as any)
        .select('id, user1_id, user2_id')
        .or(`and(user1_id.eq.${profileId},user2_id.eq.${targetId}),and(user1_id.eq.${targetId},user2_id.eq.${profileId})`)
        .maybeSingle();

      if (chatData) {
        const isUser1 = chatData.user1_id === profileId;
        await (supabase.from('direct_chats') as any).update({
          [isUser1 ? 'user1_left_at' : 'user2_left_at']: new Date().toISOString()
        }).eq('id', chatData.id);
      }
    } catch (e) {}

    await fetchBlockedUsers();
    window.dispatchEvent(new CustomEvent('REFRESH_BLOCKED_USERS'));
  };

  const value = useMemo(() => ({
    blockedIds,
    blockingMeIds, // 추가
    blockedUsers,
    isLoading,
    error,
    refresh: fetchBlockedUsers,
    unblock,
  }), [blockedIds, blockingMeIds, blockedUsers, isLoading, error, fetchBlockedUsers]);

  return (
    <BlockedUsersContext.Provider value={value}>
      {children}
    </BlockedUsersContext.Provider>
  );
}

export function useBlockedUsers() {
  const ctx = useContext(BlockedUsersContext);
  if (!ctx) throw new Error('useBlockedUsers must be used within BlockedUsersProvider');
  return ctx;
}

// 기존 코드 호환성을 위한 별칭
export const useBlockedUsersContext = useBlockedUsers;
