import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useBlockedUsers } from '@/contexts/BlockedUsersContext';

interface UseFollowReturn {
  isFollowing: boolean;
  isLoading: boolean;
  followersCount: number;
  followingCount: number;
  toggleFollow: () => Promise<void>;
  refreshCounts: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

/**
 * 팔로우 관계 트랜잭션 엔진(Follow Relationship Transaction Engine):
 * - 목적(Why): 상호 팔로우 상태의 Soft Delete 관리 및 실시간 팔로워/팔로잉 카운트 분석을 수행함
 * - 방법(How): 팔로우 유입 시 비즈니스 알림 생성 및 전역 상태 전파를 통한 컴포넌트 간 일관성을 유지함
 */
export function useFollow(targetProfileId: string): UseFollowReturn {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { blockedIds, blockingMeIds } = useBlockedUsers();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);

  // Get current user's profile ID
  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      const { data } = await (supabase.from('profiles') as any)
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) setMyProfileId(data.id);
    };

    loadProfile();
  }, [user]);

  // Sync follow status across different components/cards
  useEffect(() => {
    const handleStatusChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ targetProfileId: string; isFollowing: boolean }>;
      if (customEvent.detail.targetProfileId === targetProfileId) {
        setIsFollowing(customEvent.detail.isFollowing);
      }
    };
    window.addEventListener('followStatusChanged', handleStatusChange);
    return () => window.removeEventListener('followStatusChanged', handleStatusChange);
  }, [targetProfileId]);

  // Check follow status
  const checkFollowStatus = useCallback(async () => {
    if (!myProfileId || !targetProfileId || myProfileId === targetProfileId) {
      setIsFollowing(false);
      return;
    }

    const { data } = await (supabase.from('user_follows') as any)
      .select('id')
      .eq('follower_id', myProfileId)
      .eq('following_id', targetProfileId)
      .is('ended_at', null)
      .maybeSingle();

    setIsFollowing(!!data);
  }, [myProfileId, targetProfileId]);

  // Load follow counts
  const refreshCounts = useCallback(async () => {
    if (!targetProfileId) return;

    const { count: followers } = await (supabase.from('user_follows') as any)
      .select('*', { count: 'exact', head: true })
      .eq('following_id', targetProfileId)
      .is('ended_at', null);

    const { count: following } = await (supabase.from('user_follows') as any)
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', targetProfileId)
      .is('ended_at', null);

    setFollowersCount(followers || 0);
    setFollowingCount(following || 0);
  }, [targetProfileId]);

  // block/unblock 같은 외부 변화가 있을 때 카운트 갱신
  useEffect(() => {
    const handler = () => {
      refreshCounts();
      setTimeout(refreshCounts, 150);
      setTimeout(refreshCounts, 400);
    };

    window.addEventListener('REFRESH_FOLLOW_COUNTS', handler);
    return () => window.removeEventListener('REFRESH_FOLLOW_COUNTS', handler);
  }, [refreshCounts]);

  // Initial load
  useEffect(() => {
    checkFollowStatus();
    refreshCounts();
  }, [checkFollowStatus, refreshCounts]);

  // Initial load
  useEffect(() => {
    checkFollowStatus();
    refreshCounts();
  }, [checkFollowStatus, refreshCounts]);

  // 팔로우 상태 원자적 전환 및 알림 파이프라인 — 관계 설정 시 Soft Delete 데이터 재활용 또는 신규 삽입 및 실시간 알림 이벤트 유발
  const toggleFollow = async () => {
    if (!user) {
      toast.error(t('auth.login_needed', '로그인이 필요합니다'));
      return;
    }

    if (!myProfileId || !targetProfileId) {
      toast.error(t('common.error', '오류가 발생했습니다'));
      return;
    }

    if (myProfileId === targetProfileId) {
      toast.error(t('profile.cannot_follow_self', '자기 자신을 팔로우할 수 없습니다'));
      return;
    }

    setIsLoading(true);

    try {
      if (isFollowing) {
        // Unfollow: Soft delete (set ended_at)
        const { error } = await (supabase.from('user_follows') as any)
          .update({ ended_at: new Date().toISOString() })
          .eq('follower_id', myProfileId)
          .eq('following_id', targetProfileId);

        if (error) throw error;

        setIsFollowing(false);
        window.dispatchEvent(
          new CustomEvent('followStatusChanged', {
            detail: { targetProfileId, isFollowing: false },
          }),
        );
        setFollowersCount(prev => Math.max(0, prev - 1));
        toast.success(t('profile.unfollowed', '언팔로우'));
      } else {
        // Follow: Check if soft-deleted row exists first
        const { data: existing } = await (supabase.from('user_follows') as any)
          .select('id, ended_at')
          .eq('follower_id', myProfileId)
          .eq('following_id', targetProfileId)
          .maybeSingle();

        let error;

        if (existing && existing.ended_at !== null) {
          // Reactivate soft-deleted follow
          ({ error } = await (supabase.from('user_follows') as any)
            .update({ ended_at: null })
            .eq('follower_id', myProfileId)
            .eq('following_id', targetProfileId));
        } else if (!existing) {
          // Create new follow
          ({ error } = await (supabase.from('user_follows') as any).insert({
            follower_id: myProfileId,
            following_id: targetProfileId,
            ended_at: null,
          }));
        } else {
          // Already following (ended_at is null)
          toast.info(t('profile.already_following', '이미 팔로우 중입니다'));
          await checkFollowStatus();
          return;
        }

        if (error) throw error;

        // Add follow notification
        const notificationPayload = {
          type: 'follow',
          content: '당신을 팔로우했습니다.',
          is_read: false,
          sender_id: myProfileId,
          receiver_id: targetProfileId,
          tweet_id: null,
          comment_id: null,
        };

        // 상호 차단 관계인 경우 알림 생성을 스킵함
        const isBlockedRelation = blockedIds.includes(targetProfileId) || blockingMeIds.includes(targetProfileId);

        if (!isBlockedRelation) {
          await (supabase.from('notifications') as any).insert(notificationPayload);
        }

        setIsFollowing(true);
        window.dispatchEvent(
          new CustomEvent('followStatusChanged', {
            detail: { targetProfileId, isFollowing: true },
          }),
        );
        setFollowersCount(prev => prev + 1);
        toast.success(t('profile.followed', '팔로우'));
      }
    } catch (error) {
      console.error('Follow toggle error:', error);
      toast.error(t('common.error', '오류가 발생했습니다'));
      // Revert optimistic update
      await checkFollowStatus();
      await refreshCounts();
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isFollowing,
    isLoading,
    followersCount,
    followingCount,
    toggleFollow,
    refreshCounts,
    refreshStatus: checkFollowStatus,
  };
}
