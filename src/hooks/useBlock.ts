import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface UseBlockReturn {
  isBlocked: boolean;
  isLoading: boolean;
  toggleBlock: () => Promise<void>;
  checkBlockStatus: () => Promise<void>;
}

/**
 * Hook for managing user blocks with Supabase
 * Uses soft delete pattern (ended_at) - same as follows
 */
export function useBlock(targetProfileId: string): UseBlockReturn {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);

  // Get current user's profile ID
  useEffect(() => {
    if (!user) return;
    
    const loadProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) setMyProfileId(data.id);
    };
    
    loadProfile();
  }, [user]);

  // Check block status
  const checkBlockStatus = useCallback(async () => {
    if (!myProfileId || !targetProfileId || myProfileId === targetProfileId) {
      setIsBlocked(false);
      return;
    }

    const { data } = await supabase
      .from('user_blocks')
      .select('id')
      .eq('blocker_id', myProfileId)
      .eq('blocked_id', targetProfileId)
      .is('ended_at', null) // Only active blocks
      .maybeSingle();

    setIsBlocked(!!data);
  }, [myProfileId, targetProfileId]);

  // Initial load
  useEffect(() => {
    checkBlockStatus();
  }, [checkBlockStatus]);

  // Toggle block/unblock
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
        const { error } = await supabase
          .from('user_blocks')
          .update({ ended_at: new Date().toISOString() })
          .eq('blocker_id', myProfileId)
          .eq('blocked_id', targetProfileId);

        if (error) throw error;

        setIsBlocked(false);
        toast.success(t('profile.unblocked', '차단 해제'));
      } else {
        // Block: Check if soft-deleted row exists
        const { data: existing } = await supabase
          .from('user_blocks')
          .select('id, ended_at')
          .eq('blocker_id', myProfileId)
          .eq('blocked_id', targetProfileId)
          .maybeSingle();

        let error;
        
        if (existing && existing.ended_at !== null) {
          // Reactivate soft-deleted block
          ({ error } = await supabase
            .from('user_blocks')
            .update({ ended_at: null })
            .eq('blocker_id', myProfileId)
            .eq('blocked_id', targetProfileId));
        } else if (!existing) {
          // Create new block
          ({ error } = await supabase
            .from('user_blocks')
            .insert({
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

        setIsBlocked(true);
        toast.success(t('profile.blocked', '차단 완료'));

        // 1:1 채팅방 나가기 처리 및 기존 미읽음 메시지/알림 읽음 처리 (자동화)
        try {
          // 1-1. 미읽음 메시지 읽음 처리
          const { data: targetProfile } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('id', targetProfileId)
            .maybeSingle();

          if (targetProfile?.user_id) {
            await supabase
              .from('direct_messages')
              .update({ is_read: true, read_at: new Date().toISOString() })
              .eq('sender_id', targetProfile.user_id)
              .eq('is_read', false);
          }

          // 1-2. 미읽음 알림 읽음 처리
          await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('sender_id', targetProfileId)
            .eq('receiver_id', myProfileId)
            .eq('is_read', false);

          // 1-3. 상대방과의 채팅방 찾기 및 나가기
          const { data: chat } = await supabase
            .from('direct_chats')
            .select('id, user1_id, user2_id, user1_active, user2_active')
            .or(`and(user1_id.eq.${myProfileId},user2_id.eq.${targetProfileId}),and(user1_id.eq.${targetProfileId},user2_id.eq.${myProfileId})`)
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
      window.dispatchEvent(new Event('REFRESH_BLOCKED_USERS'));

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
