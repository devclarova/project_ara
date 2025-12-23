import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useDirectChat } from '@/contexts/DirectChatContext';
import { toast } from 'sonner';
import { NotificationToast } from './NotificationToast';

export const GlobalNotificationListener: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentChat } = useDirectChat();
  
  // 현재 보고 있는 채팅방 ID를 ref로 추적 (의존성 배열 영향 없이 콜백 내부에서 접근)
  const currentChatRef = useRef<string | null>(null);
  // 최근 알림 추적 (0.5초 이내 동일 알림 = 중복, 그 이후는 새 알림)
  const recentNotificationsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    currentChatRef.current = currentChat?.id || null;
  }, [currentChat]);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    let notifChannel: ReturnType<typeof supabase.channel> | null = null;
    let chatChannel: ReturnType<typeof supabase.channel> | null = null;

    const setupSubscriptions = async () => {
      // 1. Fetch profile ID for notifications
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!isMounted) return;

      if (profile) {
        // 2. Setup Notification Subscription
        notifChannel = supabase
          .channel(`global-notif-${profile.id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `receiver_id=eq.${profile.id}`,
            },
            async (payload: any) => {
              const newNotif = payload.new;
              
              const { data: senderProfile } = await supabase
                .from('profiles')
                .select('nickname, avatar_url')
                .eq('id', newNotif.sender_id)
                .maybeSingle();

              // ID가 없으면 무시
              if (!newNotif.id) return;

              // 짧은 시간(0.5초) 내 동일 알림만 차단 (한 번의 이벤트로 중복 생성된 경우만)
              const notifKey = `${newNotif.sender_id}-${newNotif.receiver_id}-${newNotif.type}-${newNotif.comment_id || ''}-${newNotif.tweet_id || ''}`;
              const now = Date.now();
              const lastSeen = recentNotificationsRef.current.get(notifKey);
              
              // 0.5초 이내 같은 알림이면 중복으로 간주하고 무시
              if (lastSeen && (now - lastSeen) < 500) {
                return;
              }
              
              // 새 타임스탬프 기록
              recentNotificationsRef.current.set(notifKey, now);
              
              // 메모리 관리: 5초 이상 지난 항목 제거
              for (const [key, timestamp] of recentNotificationsRef.current.entries()) {
                if (now - timestamp > 5000) {
                  recentNotificationsRef.current.delete(key);
                }
              }

              // 프로필이 없어도 알림은 띄움 (Fallback)
              toast.custom((t) => (
                <NotificationToast
                  type={newNotif.type}
                  sender={{
                    nickname: senderProfile?.nickname ?? '알 수 없는 사용자',
                    avatar_url: senderProfile?.avatar_url ?? null,
                  }}
                  content={newNotif.content?.replace(/<[^>]*>/g, '') || ''}
                  timestamp={newNotif.created_at}
                  replyId={newNotif.comment_id}
                  onClick={() => {
                    toast.dismiss(t);
                    if (newNotif.tweet_id) {
                      navigate(`/sns/${newNotif.tweet_id}`, { 
                        state: { 
                          highlightCommentId: newNotif.comment_id,
                          scrollKey: Date.now() // 강제 스크롤 트리거
                        } 
                      });
                    } else if (newNotif.type === 'follow' && newNotif.sender_id) {
                       // tweet_id가 없는 경우 /sns로 fallback
                       navigate('/sns');
                    }
                  }}
                  toastId={t}
                />
              ), {
                id: `notif-${newNotif.id}`,
                duration: Infinity // 개별 타이머가 제어
              });
            }
          )
          .subscribe();
      }

      // 3. Setup Chat Subscription
      chatChannel = supabase
        .channel(`global-chat-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'direct_messages',
          },
          async (payload: any) => {
            const newMessage = payload.new;
            if (newMessage.sender_id === user.id) return;
            if (!profile?.id) return;
            if (currentChatRef.current === newMessage.chat_id) return;

            const { data: chatInfo, error: chatError } = await supabase
               .from('direct_chats')
               .select('user1_id, user2_id')
               .eq('id', newMessage.chat_id)
               .single();
            
            if (chatError || !chatInfo) return;

            const isMyChat = (chatInfo.user1_id === profile.id) || (chatInfo.user2_id === profile.id);
            if (!isMyChat) return;

            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('nickname, avatar_url')
              .eq('user_id', newMessage.sender_id)
              .maybeSingle();

            toast.custom((t) => (
              <NotificationToast
                type="chat"
                sender={{
                  nickname: senderProfile?.nickname ?? '알 수 없는 사용자',
                  avatar_url: senderProfile?.avatar_url ?? null,
                }}
                content={newMessage.content}
                timestamp={newMessage.created_at}
                onClick={() => {
                   toast.dismiss(t);
                   navigate('/chat', { 
                     state: { 
                       roomId: newMessage.chat_id
                     } 
                   });
                }}
                toastId={t}
              />
            ), {
              id: `chat-${newMessage.id}`,
              duration: Infinity // 개별 타이머가 제어
            });
          }
        )
        .subscribe();
    };

    setupSubscriptions();

    return () => {
      isMounted = false;
      if (notifChannel) supabase.removeChannel(notifChannel);
      if (chatChannel) supabase.removeChannel(chatChannel);
    };
  }, [user]);

  return null;
};
