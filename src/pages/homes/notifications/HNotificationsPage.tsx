import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import NotificationCard from '../feature/NotificationCard';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'comment' | 'like' | 'mention';
  content: string;
  is_read: boolean;
  created_at: string;
  tweet_id: string | null;
  comment_id: string | null; // DB 컬럼명은 그대로 유지
  sender: {
    name: string;
    username: string;
    avatar: string | null;
  } | null;
}

export default function HNotificationsPage() {
  const { user } = useAuth();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

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
          sender:sender_id (nickname, user_id, avatar_url)
        `,
        )
        .eq('receiver_id', profileId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(error.message);
        return;
      }

      setNotifications(
        (data ?? []).map((n: any) => ({
          id: n.id,
          type: n.type,
          content: n.content,
          is_read: n.is_read,
          created_at: n.created_at,
          tweet_id: n.tweet_id,
          comment_id: n.comment_id,
          sender: n.sender
            ? {
                name: n.sender.nickname,
                username: n.sender.user_id,
                avatar: n.sender.avatar_url,
              }
            : null,
        })),
      );
      setLoading(false);
    };
    fetchNotifications();
  }, [profileId]);

  // ✅ 실시간 알림 구독
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

          const uiItem: Notification = {
            id: newItem.id,
            type: newItem.type,
            content: newItem.content,
            is_read: newItem.is_read,
            created_at: newItem.created_at,
            tweet_id: newItem.tweet_id,
            comment_id: newItem.comment_id,
            sender: sender
              ? {
                  name: sender.nickname,
                  username: sender.user_id,
                  avatar: sender.avatar_url,
                }
              : null,
          };

          setNotifications(prev => [uiItem, ...prev]);
          toast.info('💬 새 댓글 알림이 도착했습니다!');
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

  // ✅ 전체 비우기
  const handleClearAll = async () => {
    if (!profileId) return;

    try {
      const { error } = await supabase.from('notifications').delete().eq('receiver_id', profileId);

      if (error) {
        console.error('❌ 알림 비우기 실패:', error.message);
        toast.error('알림을 비우는 중 오류가 발생했습니다.');
        return;
      }

      setNotifications([]);

      window.dispatchEvent(new Event('notifications:cleared'));

      toast.success('알림을 모두 비웠습니다.');
    } catch (err: any) {
      console.error('❌ 알림 비우기 예외:', err.message);
      toast.error('알림을 비우는 중 오류가 발생했습니다.');
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
        {/* 상단 헤더 + 비우기 버튼 */}
        <div
          className="
            shrink-0 
            sticky top-0 
            bg-white/90 dark:bg-background/90 
            backdrop-blur-md 
            border-b border-gray-200 dark:border-gray-700 
            px-4 py-3 z-10
            flex items-center justify-between
          "
        >
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">알림</h1>

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs sm:text-sm px-2 py-1 rounded-full
                         border border-gray-300 text-gray-600 hover:bg-gray-100
                         dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800
                         transition-colors"
            >
              비우기
            </button>
          )}
        </div>

        {/* 콘텐츠 */}
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
                        ? '당신의 피드에 댓글을 남겼습니다.'
                        : n.type === 'like'
                          ? n.comment_id
                            ? '당신의 댓글을 좋아합니다.' // 🔥 댓글 좋아요
                            : '당신의 피드를 좋아합니다.' // 🔥 피드 좋아요
                          : n.content,
                    content: n.content,
                    timestamp: new Date(n.created_at).toLocaleString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                    isRead: n.is_read,
                    tweetId: n.tweet_id,
                    replyId: n.comment_id, // ✅ 여기서 replyId로 맞춰서 전달 (댓글 id / 없으면 null)
                  }}
                  onMarkAsRead={markAsRead}
                />
              ))}

              {/* 리스트 맨 아래 보더라인 */}
              <div className="h-px bg-gray-100 dark:bg-gray-900" />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <i className="ri-notification-3-line text-3xl mb-2" />
              아직 새로운 알림이 없습니다
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
