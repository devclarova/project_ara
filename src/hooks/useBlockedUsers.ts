import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { type PostgrestError } from '@supabase/supabase-js';

export interface BlockedUser {
  id: string; // pofile id
  user_id: string; // auth id (username)
  nickname: string;
  avatar_url: string;
}

/**
 * 전역 차단 사용자 동기화 엔진(Global Blocked User Sync Engine):
 * - 목적(Why): 현재 사용자가 차단한 전체 유저 리스트 및 ID 셋(Set)을 관리하여 서비스 전역의 콘텐츠 필터링 데이터를 제공함
 * - 방법(How): 차단 해제 시 연관 채팅방의 타임라인을 재설정하여 차단 기간 내 유입된 데이터의 가시성을 제어함
 */
export function useBlockedUsers() {
  const { user } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchBlockedUsers = useCallback(async () => {
    if (!user) {
      setBlockedUsers([]);
      setBlockedIds([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // 1. Get my profile ID first
      const { data: myProfile } = await (supabase.from('profiles') as any)
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!myProfile) {
        setBlockedUsers([]);
        setBlockedIds([]);
        return;
      }

      // 2. Query blocks using profile ID
      const { data, error } = await (supabase.from('user_blocks') as any)
        .select(`
          blocked_id,
          profiles:blocked_id (
            id,
            user_id,
            nickname,
            avatar_url
          )
        `)
        .eq('blocker_id', myProfile.id)
        .is('ended_at', null);

      if (error) {
        throw error;
      }

      // Supabase join 응답 row 타입 — profiles가 단일 객체로 반환됨
      type BlockRow = {
        blocked_id: string;
        profiles: { id: string; user_id: string; nickname: string; avatar_url: string } | null;
      };
      const mappedUsers = (data as BlockRow[] || []).map((row) => ({
        id: row.profiles?.id,
        user_id: row.profiles?.user_id,
        nickname: row.profiles?.nickname,
        avatar_url: row.profiles?.avatar_url,
      })).filter((u: any) => u.id && u.user_id) as BlockedUser[];

      setBlockedUsers(mappedUsers);
      setBlockedIds(mappedUsers.map((u: any) => u.id));
      setError(null);
    } catch (err: unknown) {
      console.error('Error fetching blocked users:', err);
      // PostgrestError 구조를 가진 경우만 setError에 전달
      if (err && typeof err === 'object' && 'code' in err) {
        setError(err as PostgrestError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBlockedUsers();

    const handleRefresh = () => fetchBlockedUsers();
    window.addEventListener('REFRESH_BLOCKED_USERS', handleRefresh);
    
    return () => {
        window.removeEventListener('REFRESH_BLOCKED_USERS', handleRefresh);
    };
  }, [fetchBlockedUsers]);

  const unblockMutation = {
    mutate: async (targetId: string) => {
      if (!user) return;
      
      // Need profile ID for mutation too, but we can rely on fetch reload or fetch it again
      // Easier to fetch profile ID inside mutation or store it in state
      // For now let's just fetch it again to be safe
      const { data: myProfile } = await (supabase.from('profiles') as any)
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (!myProfile) return;

      const { error } = await (supabase.from('user_blocks') as any)
        .update({ ended_at: new Date().toISOString() })
        .eq('blocker_id', myProfile.id)
        .eq('blocked_id', targetId);

      if (error) {
        console.error('Error unblocking user:', error);
      } else {
        // ✅ 차단 해제 시 해당 유저와의 채팅방이 있다면, 
        // 내 '나간 시점(left_at)'을 지금으로 갱신하여 차단 기간 중 쌓인 메시지를 보지 않도록 함.
        const { data: chatData } = await (supabase.from('direct_chats') as any)
          .select('id, user1_id, user2_id')
          .or(`and(user1_id.eq.${myProfile.id},user2_id.eq.${targetId}),and(user1_id.eq.${targetId},user2_id.eq.${myProfile.id})`)
          .maybeSingle();

        if (chatData) {
          const isUser1 = chatData.user1_id === myProfile.id;
          await (supabase.from('direct_chats') as any)
            .update({ 
               [isUser1 ? 'user1_left_at' : 'user2_left_at']: new Date().toISOString() 
            })
            .eq('id', chatData.id);
        }

        // Refresh list
        fetchBlockedUsers();
        // 채팅 목록도 갱신하도록 이벤트 발생
        window.dispatchEvent(new CustomEvent('REFRESH_BLOCKED_USERS'));
      }
    }
  };

  return {
    blockedIds,
    blockedUsers,
    isLoading,
    unblockMutation
  };
}
