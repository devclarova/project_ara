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
          id, type, content, is_read, created_at, tweet_id,
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

  if (loading)
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );

  return (
    <div className="min-h-screen bg-white dark:bg-background">
      {/* 헤더 */}
      <div className="sticky top-0 bg-white/80 dark:bg-background/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 z-10 px-4 py-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">알림</h1>
      </div>

      {/* 리스트 */}
      <div className="divide-y divide-gray-100 dark:divide-gray-900">
        {notifications.length > 0 ? (
          notifications.map(n => (
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
                      ? '당신의 피드를 좋아합니다.'
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
              }}
              onMarkAsRead={markAsRead}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
            <i className="ri-notification-3-line text-3xl mb-2" />
            아직 새로운 알림이 없습니다
          </div>
        )}
      </div>
    </div>
  );
}
