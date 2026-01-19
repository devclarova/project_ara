import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import NotificationCard from '@/pages/community/feature/NotificationCard';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'comment' | 'like' | 'mention' | 'follow' | 'reply' | 'system' | 'repost' | 'like_comment' | 'like_feed';
  content: string;
  is_read: boolean;
  created_at: string;
  tweet_id: string | null;
  comment_id: string | null;
  sender: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
    bio?: string | null;
  } | null;
}

export default function HNotificationsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'like' | 'comment' | 'follow' | 'system' | 'updates'>('like');

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

  // 초기 알림 불러오기
  useEffect(() => {
    if (!profileId) return;
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select(
          `
          id, type, content, is_read, created_at, tweet_id, comment_id,
          sender:sender_id (id, nickname, user_id, avatar_url, username, bio),
          tweet:tweets (content),
          reply:tweet_replies (content)
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
          // 피드 좋아요 혹은 멘션인 경우, 알림 자체 content가 비어있으면 원본 트윗 내용을 보여줌
          let contentToUse = n.content;

          if (n.type === 'like' && !n.comment_id && n.tweet?.content) {
            contentToUse = n.tweet.content;
          }

          if (
            n.type === 'mention' &&
            (!contentToUse || contentToUse.trim() === '') &&
            n.tweet?.content
          ) {
            contentToUse = n.tweet.content;
          }
          
          if (n.type === 'reply' && n.comment_id && n.reply?.content && !contentToUse) {
             contentToUse = n.reply.content;
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
                  id: n.sender.id,
                  name: n.sender.nickname,
                  username: n.sender.username || n.sender.nickname,
                  avatar: n.sender.avatar_url,
                  bio: n.sender.bio
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

          const { data: sender } = newItem.sender_id 
            ? await supabase
                .from('profiles')
                .select('id, nickname, user_id, avatar_url, username, bio')
                .eq('id', newItem.sender_id)
                .maybeSingle()
            : { data: null };

          let contentToUse = newItem.content;

          const needTweetContent =
            (newItem.type === 'like' && newItem.tweet_id && !newItem.comment_id) ||
            (newItem.type === 'mention' &&
              newItem.tweet_id &&
              (!contentToUse || contentToUse.trim() === ''));

          if (needTweetContent) {
            const { data: tweetData } = await supabase
              .from('tweets')
              .select('content')
              .eq('id', newItem.tweet_id)
              .maybeSingle();

            if (tweetData?.content) {
              contentToUse = tweetData.content;
            }
          }

          if (newItem.type === 'reply' && newItem.comment_id && !contentToUse) {
            const { data: replyData } = await supabase
              .from('tweet_replies')
              .select('content')
              .eq('id', newItem.comment_id)
              .maybeSingle();
            if (replyData?.content) {
              contentToUse = replyData.content;
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
                  id: sender.id,
                  name: sender.nickname,
                  username: sender.username || sender.nickname,
                  avatar: sender.avatar_url,
                  bio: sender.bio
                }
              : null,
          };

          setNotifications(prev => {
            if (prev.some(n => n.id === uiItem.id)) return prev;
            return [uiItem, ...prev];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId]);

  // 읽음 처리
  const markAsRead = async (id: string) => {
    const target = notifications.find(n => n.id === id);
    if (target && !target.is_read) {
      window.dispatchEvent(new Event('notification:deleted-one'));
    }
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
      <div className="flex flex-col w-full max-w-2xl lg:max-w-3xl border-x border-gray-200 dark:border-gray-700 min-h-[calc(100vh-73px)] sm:min-h-[calc(100vh-81px)] md:min-h-[calc(100vh-97px)]">
        {/* 상단 헤더 */}
        <div
          className="
            shrink-0 
            sticky top-[57px] sm:top-[73px] lg:top-[81px] xl:top-[97px]
            bg-white/80 dark:bg-background/80 
            backdrop-blur-md 
            border-b border-gray-200 dark:border-gray-700 
            px-4 py-3 z-30
            flex items-center justify-between
          "
        >
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {t('nav.notifications')}
          </h1>

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

        {/* 알림 탭 */}
        <div className="sticky top-[110px] sm:top-[126px] lg:top-[134px] xl:top-[150px] bg-white/80 dark:bg-background/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 z-20">
          <div className="flex">
            {[
              { key: 'like' as const, label: t('notification.tab_likes') },
              { key: 'comment' as const, label: t('notification.tab_comments') },
              { key: 'follow' as const, label: t('notification.tab_follow') },
              { key: 'updates' as const, label: t('notification.tab_updates') },
              { key: 'system' as const, label: t('notification.tab_system', '시스템') },
            ].map(tab => {
              const isCommentsTab = tab.key === 'comment';
              const isLikesTab = tab.key === 'like';
              
              const filteredForCount = notifications.filter(n => {
                if (isCommentsTab) return (['comment', 'reply', 'mention'] as string[]).includes(n.type);
                if (isLikesTab) return (['like', 'like_comment', 'like_feed'] as string[]).includes(n.type);
                return n.type === tab.key;
              });
              
              const unreadCount = filteredForCount.filter(n => !n.is_read).length;
              
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 py-3 text-sm font-medium transition-all relative ${
                    activeTab === tab.key
                      ? 'text-primary'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    {tab.label}
                    {unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-primary rounded-full">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </span>
                  {activeTab === tab.key && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#00dbaa] to-[#009e89]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 알림 리스트 */}
        <div className="flex-1 divide-y divide-gray-100 dark:divide-gray-900">
          {(() => {
            const filteredNotifications = notifications.filter(n => {
              if (activeTab === 'comment') return (['comment', 'reply', 'mention'] as string[]).includes(n.type);
              if (activeTab === 'like') return (['like', 'like_comment', 'like_feed'] as string[]).includes(n.type);
              return n.type === activeTab;
            });
            
            return filteredNotifications.length > 0 ? (
            <>
              {filteredNotifications.map(n => (
                <NotificationCard
                  key={n.id}
                  notification={{
                    id: n.id,
                    type: n.type as any, // Alignment with card props
                    user: {
                      id: n.sender?.id || '',
                      name: n.type === 'system' ? t('common.ara_team') : (n.sender?.name || 'Unknown'),
                      username: n.type === 'system' ? 'ara_admin' : (n.sender?.username || 'anonymous'),
                      avatar: n.type === 'system' ? '/images/sample_font_logo.png' : (n.sender?.avatar || '/default-avatar.svg'),
                      bio: n.sender?.bio
                    },
                    action:
                      n.type === 'comment' || n.type === 'reply' || n.type === 'mention'
                        ? t('notification.action_comment')
                        : n.type === 'like' || n.type === 'like_comment' || n.type === 'like_feed'
                          ? n.comment_id
                            ? t('notification.action_like_comment')
                            : t('notification.action_like_feed')
                          : n.type === 'system'
                            ? '' // 시스템 알림은 본문이 길어서 action 칸은 비웁니다
                            : n.content,
                    content: n.content,
                    timestamp: n.created_at,
                    isRead: n.is_read,
                    tweetId: n.tweet_id,
                    replyId: n.comment_id, // null 가능
                  }}
                  onMarkAsRead={markAsRead}
                  onDelete={handleRequestDelete}
                  onSilentDelete={async id => {
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
          );
          })()}
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowDeleteModal(false)}
        >
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
