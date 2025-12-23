import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import NotificationCard from '@/pages/community/feature/NotificationCard';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'comment' | 'like' | 'mention';
  content: string;
  is_read: boolean;
  created_at: string;
  tweet_id: string | null;
  comment_id: string | null;
  sender: {
    name: string;
    username: string;
    avatar: string | null;
  } | null;
}

export default function HNotificationsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // 삭제 모달 상태
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 내 profile id 로드
  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) setProfileId(data.id);
    };
    loadProfile();
  }, [user]);

  // ... (기존 useEffect들 생략 가능하지만 안전하게 전체 구조 잡기 위해 유지하거나, 위쪽은 건드리지 않고 중간부터 수정)
  // 여기서는 replace 범위가 전체가 아니므로 로직 삽입 위치를 잘 잡아야 함.
  // 30라인부터 다시 씀.

  // 초기 알림 불러오기
  useEffect(() => {
    if (!profileId) return;
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select(
          `
          id, type, content, is_read, created_at, tweet_id, comment_id,
          sender:sender_id (nickname, user_id, avatar_url),
          tweet:tweets (content)
        `,
        )
        .eq('receiver_id', profileId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(error.message);
        return;
      }

      setNotifications(
        (data ?? []).map((n: any) => {
          // 피드 좋아요인 경우, 알림 자체 content가 비어있으면 원본 트윗 내용을 보여줌
          let contentToUse = n.content;
          if (n.type === 'like' && !n.comment_id && n.tweet?.content) {
             contentToUse = n.tweet.content;
          }

          return {
            id: n.id,
            type: n.type,
            content: contentToUse,
            is_read: n.is_read,
            created_at: n.created_at,
            tweet_id: n.tweet_id,
            comment_id: n.comment_id,
            sender: n.sender
                ? {
                    name: n.sender.nickname,
                    username: n.sender.nickname, 
                    avatar: n.sender.avatar_url,
                }
                : null,
          };
        }),
      );
      setLoading(false);
    };
    fetchNotifications();
  }, [profileId]);

  // 실시간 알림 구독
  useEffect(() => {
    if (!profileId) return;
    const channel = supabase
      .channel(`notifications-${profileId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `receiver_id=eq.${profileId}`,
        },
        async payload => {
          const newItem = payload.new as any;

          const { data: sender } = await supabase
            .from('profiles')
            .select('nickname, user_id, avatar_url')
            .eq('id', newItem.sender_id)
            .maybeSingle();

          // 피드 좋아요인 경우 트윗 내용 추가 fetch
          let contentToUse = newItem.content;
          if (newItem.type === 'like' && newItem.tweet_id && !newItem.comment_id) {
             const { data: tweetData } = await supabase
               .from('tweets')
               .select('content')
               .eq('id', newItem.tweet_id)
               .maybeSingle();
             if (tweetData?.content) {
               contentToUse = tweetData.content;
             }
          }

          const uiItem: Notification = {
            id: newItem.id,
            type: newItem.type,
            content: contentToUse,
            is_read: newItem.is_read,
            created_at: newItem.created_at,
            tweet_id: newItem.tweet_id,
            comment_id: newItem.comment_id,
            sender: sender
              ? {
                  name: sender.nickname,
                  username: sender.nickname,
                  avatar: sender.avatar_url,
                }
              : null,
          };

          setNotifications(prev => [uiItem, ...prev]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId]);

  // 읽음 처리
  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)));
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  };

  // 전체 비우기
  const handleClearAll = async () => {
    if (!profileId) return;

    try {
      const { error } = await supabase.from('notifications').delete().eq('receiver_id', profileId);

      if (error) {
        console.error('알림 비우기 실패:', error.message);
        toast.error(t('notification.error_clear_all'));
        return;
      }

      setNotifications([]);
      window.dispatchEvent(new Event('notifications:cleared'));

      toast.success(t('notification.success_clear_all'));
    } catch (err: any) {
      console.error('알림 비우기 예외:', err.message);
      toast.error(t('notification.error_clear_all'));
    }
  };

  // 삭제 요청 핸들러 (모달 열기)
  const handleRequestDelete = (id: string) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  // 삭제 확정 핸들러
  const handleConfirmDelete = async () => {
    if (!deleteId) return;

    try {
      // 삭제 대상 알림 정보 찾기 (읽지 않은 알림인지 확인용)
      const targetNotification = notifications.find(n => n.id === deleteId);
      
      // UI에서 선제거
      setNotifications(prev => prev.filter(n => n.id !== deleteId));
      setShowDeleteModal(false);

      // 읽지 않은 알림을 삭제한 경우 → 헤더 뱃지 즉시 차감 이벤트 발송
      if (targetNotification && !targetNotification.is_read) {
        window.dispatchEvent(new Event('notification:deleted-one'));
      }
      
      // DB 삭제
      const { error } = await supabase.from('notifications').delete().eq('id', deleteId);
      if (error) throw error;
      
      toast.success(t('common.success_delete'));
    } catch (err: any) {
      console.error('알림 삭제 실패:', err.message);
      toast.error(t('common.error_delete'));
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center bg-white dark:bg-background">
        <div
          className="
            flex flex-col 
            w-full max-w-2xl lg:max-w-3xl
            border-x border-gray-200 dark:border-gray-700
            min-h-[calc(100vh-73px)]
            sm:min-h-[calc(100vh-81px)]
            md:min-h-[calc(100vh-97px)]
          "
        >
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center bg-white dark:bg-background">
      <div
        className="
        flex flex-col 
        w-full max-w-2xl lg:max-w-3xl
        border-x border-gray-200 dark:border-gray-700
        min-h-[calc(100vh-73px)]
        sm:min-h-[calc(100vh-81px)]
        md:min-h-[calc(100vh-97px)]
      "
      >
        {/* 상단 헤더 */}
        <div
          className="
            shrink-0 
            sticky top-0 
            bg-white/80 dark:bg-background/80 
            backdrop-blur-md 
            border-b border-gray-200 dark:border-gray-700 
            px-4 py-3 z-10
            flex items-center justify-between
          "
        >
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('nav.notifications')}</h1>

            {notifications.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs sm:text-sm px-2 py-1 rounded-full
                         border border-gray-300 text-gray-600 hover:bg-gray-100
                         dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800
                         transition-colors"
            >
              {t('notification.clear_all')}
            </button>
          )}
        </div>

        {/* 알림 리스트 */}
        <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-900">
          {notifications.length > 0 ? (
            <>
              {notifications.map(n => (
                <NotificationCard
                  key={n.id}
                  notification={{
                    id: n.id,
                    type: n.type,
                    user: {
                      name: n.sender?.name || 'Unknown',
                      username: n.sender?.username || 'anonymous',
                      avatar: n.sender?.avatar || '/default-avatar.svg',
                    },
                    action:
                      n.type === 'comment'
                        ? t('notification.action_comment')
                        : n.type === 'like'
                          ? n.comment_id
                            ? t('notification.action_like_comment')
                            : t('notification.action_like_feed')
                          : n.content,
                    content: n.content,
                    timestamp: n.created_at,
                    isRead: n.is_read,
                    tweetId: n.tweet_id,
                    replyId: n.comment_id, // null 가능
                  }}
                  onMarkAsRead={markAsRead}
                  onDelete={handleRequestDelete}
                  onSilentDelete={async (id) => {
                    // 직접 삭제 (모달 없이) - 삭제된 컨텐츠 클릭 시 사용
                    try {
                      // UI 선반영
                      const target = notifications.find(n => n.id === id);
                      setNotifications(prev => prev.filter(n => n.id !== id));
                      
                      // 뱃지 업데이트
                      if (target && !target.is_read) {
                        window.dispatchEvent(new Event('notification:deleted-one'));
                      }

                      // DB 삭제
                      await supabase.from('notifications').delete().eq('id', id);
                    } catch (err) {
                      console.error('알림 자동 삭제 실패:', err);
                    }
                  }}
                />
              ))}

              <div className="h-px bg-gray-100 dark:bg-gray-900" />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <i className="ri-notification-3-line text-3xl mb-2" />
              {t('notification.no_notifications')}
            </div>
          )}
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowDeleteModal(false)}>
          <div 
            className="bg-white dark:bg-secondary w-full max-w-sm rounded-xl p-6 shadow-xl relative animate-in fade-in zoom-in duration-200"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
              {t('notification.delete_confirm_title')}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {t('notification.delete_confirm_desc')}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
