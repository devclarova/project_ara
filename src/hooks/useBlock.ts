import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';

interface UseBlockReturn {
  isBlocked: boolean;
  isLoading: boolean;
  toggleBlock: () => Promise<void>;
  checkBlockStatus: () => Promise<void>;
}

/**
 * 사용자 차단 관계 관리 엔진(User Block Relationship Engine):
 * - 목적(Why): 유해 사용자로부터 회원을 보호하고 커뮤니티 정화 및 안전한 상호작용 환경을 보장함
 * - 방법(How): Supabase Soft Delete 패턴으로 차단 상태를 관리하며, 차단 시 채팅방 퇴장 및 알림 읽음 처리 등 연쇄적인 데이터 정량화(Cleanup) 프로세스를 오케스트레이션함
 */
export function useBlock(targetProfileId?: string): UseBlockReturn {
  const { user, profileId: myProfileId } = useAuth();
  const { blockedIds } = useBlockedUsers();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const isBlocked = useMemo(() => 
    targetProfileId ? blockedIds.includes(targetProfileId) : false,
    [blockedIds, targetProfileId]
  );



  // Check block status (no-op now as we use context)
  const checkBlockStatus = useCallback(async () => {
    // Rely on Context to handle state
  }, []);

  // Removed useEffect checkBlockStatus on mount to prevent 100+ DB queries

  // 전역 차단 갱신 이벤트를 받으면 재조회
  useEffect(() => {
    const handler = () => {
      // Logic for handling refresh if needed in local state
    };

    window.addEventListener('REFRESH_BLOCKED_USERS', handler);
    return () => window.removeEventListener('REFRESH_BLOCKED_USERS', handler);
  }, []);

  // 차단/해제 트랜잭션 오케스트레이션(Block Transaction Orchestration) — 관계 상태의 원자적(Atomic) 전환 및 실시간 전역 이벤트 전파를 통한 UI 동기화
  const toggleBlock = async () => {
    if (!user) {
      toast.error(t('auth.login_needed', '로그인이 필요합니다'));
      return;
    }

    if (!myProfileId || !targetProfileId) {
      toast.error(t('common.error', '오류가 발생했습니다'));
      return;
    }

    if (myProfileId === targetProfileId) {
      toast.error(t('profile.cannot_block_self', '자기 자신을 차단할 수 없습니다'));
      return;
    }

    setIsLoading(true);

    try {
      if (isBlocked) {
        // Unblock: Soft delete (set ended_at)
        const { error } = await (supabase.from('user_blocks') as any)
          .update({ ended_at: new Date().toISOString() })
          .eq('blocker_id', myProfileId)
          .eq('blocked_id', targetProfileId);

        if (error) throw error;

        toast.success(t('profile.unblocked', '차단 해제'));
      } else {
        // Block: Check if soft-deleted row exists
        const { data: existing } = await (supabase.from('user_blocks') as any)
          .select('id, ended_at')
          .eq('blocker_id', myProfileId)
          .eq('blocked_id', targetProfileId)
          .maybeSingle();

        let error;

        if (existing && existing.ended_at !== null) {
          // Reactivate soft-deleted block
          ({ error } = await (supabase.from('user_blocks') as any)
            .update({ ended_at: null })
            .eq('blocker_id', myProfileId)
            .eq('blocked_id', targetProfileId));
        } else if (!existing) {
          // Create new block
          ({ error } = await (supabase.from('user_blocks') as any).insert({
            blocker_id: myProfileId,
            blocked_id: targetProfileId,
            ended_at: null,
          }));
        } else {
          // Already blocked
          toast.info(t('profile.already_blocked', '이미 차단 중입니다'));
          await checkBlockStatus();
          return;
        }

        if (error) throw error;

        toast.success(t('profile.blocked', '차단 완료'));

        // 1:1 채팅방 나가기 처리 및 기존 미읽음 메시지/알림 읽음 처리 (자동화)
        try {
          // 1-1. 미읽음 메시지 읽음 처리
          const { data: targetProfile } = await (supabase.from('profiles') as any)
            .select('user_id')
            .eq('id', targetProfileId)
            .maybeSingle();

          if (targetProfile?.user_id) {
            await (supabase.from('direct_messages') as any)
              .update({ is_read: true, read_at: new Date().toISOString() })
              .eq('sender_id', targetProfile.user_id)
              .eq('is_read', false);
          }

          // 1-2. 미읽음 알림 읽음 처리
          await (supabase.from('notifications') as any)
            .update({ is_read: true })
            .eq('sender_id', targetProfileId)
            .eq('receiver_id', myProfileId)
            .eq('is_read', false);

          // 1-3. 상대방과의 채팅방 찾기 및 나가기
          const { data: chat } = await (supabase.from('direct_chats') as any)
            .select('id, user1_id, user2_id, user1_active, user2_active')
            .or(
              `and(user1_id.eq.${myProfileId},user2_id.eq.${targetProfileId}),and(user1_id.eq.${targetProfileId},user2_id.eq.${myProfileId})`,
            )
            .maybeSingle();

          if (chat) {
            const isUser1 = chat.user1_id === myProfileId;
            const isActive = isUser1 ? chat.user1_active : chat.user2_active;

            if (isActive) {
              const { exitDirectChat } = await import('@/services/chat/directChatService');
              await exitDirectChat(chat.id);
            }
          }
        } catch (cleanupErr) {
          console.error('Error during block cleanup:', cleanupErr);
        }

        // TODO: Add system notification in Phase 4
      }

      // 전역 차단 목록 갱신 트리거
      await checkBlockStatus(); // 마지막 동기화
      window.dispatchEvent(new Event('REFRESH_BLOCKED_USERS'));
      window.dispatchEvent(new Event('REFRESH_FOLLOW_COUNTS'));
    } catch (error) {
      console.error('Block toggle error:', error);
      toast.error(t('common.error', '오류가 발생했습니다'));
      // Revert optimistic update
      await checkBlockStatus();
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isBlocked,
    isLoading,
    toggleBlock,
    checkBlockStatus,
  };
}
