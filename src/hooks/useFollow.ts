import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

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
 * Hook for managing follow relationships with Supabase
 * Uses soft delete pattern (ended_at) - NEVER hard deletes
 */
export function useFollow(targetProfileId: string): UseFollowReturn {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
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

  // Sync follow status across different components/cards
  useEffect(() => {
    const handleStatusChange = (e: any) => {
      if (e.detail.targetProfileId === targetProfileId) {
        setIsFollowing(e.detail.isFollowing);
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

    const { data } = await supabase
      .from('user_follows')
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

    const { count: followers } = await supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', targetProfileId)
      .is('ended_at', null);

    const { count: following } = await supabase
      .from('user_follows')
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

  // Toggle follow/unfollow
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
        const { error } = await supabase
          .from('user_follows')
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
        const { data: existing } = await supabase
          .from('user_follows')
          .select('id, ended_at')
          .eq('follower_id', myProfileId)
          .eq('following_id', targetProfileId)
          .maybeSingle();

        let error;

        if (existing && existing.ended_at !== null) {
          // Reactivate soft-deleted follow
          ({ error } = await supabase
            .from('user_follows')
            .update({ ended_at: null })
            .eq('follower_id', myProfileId)
            .eq('following_id', targetProfileId));
        } else if (!existing) {
          // Create new follow
          ({ error } = await supabase.from('user_follows').insert({
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

        await supabase.from('notifications').insert(notificationPayload);

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
