import React, { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useDirectChat } from '@/contexts/DirectChatContext';
import { toast } from 'sonner';
import { NotificationToast } from './NotificationToast';

export const GlobalNotificationListener: React.FC = () => {
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
              toast.custom((_t) => (
                <NotificationToast
                  type={newNotif.type}
                  sender={{
                    nickname: senderProfile?.nickname ?? '알 수 없는 사용자',
                    avatar_url: senderProfile?.avatar_url ?? null,
                  }}
                  content={newNotif.content?.replace(/<[^>]*>/g, '') || ''}
                  timestamp={newNotif.created_at}
                  replyId={newNotif.comment_id}
                />
              ), {
                id: `notif-${newNotif.id}`,
                duration: 4000
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
            // ⚠️ direct_messages에는 receiver_id가 없음 -> 필터 불가능 (RLS로 막혀있지 않다면 전체 수신됨)
            // 따라서 클라이언트 레벨에서 "내가 속한 채팅방인지" 확인해야 함.
          },
          async (payload: any) => {
            const newMessage = payload.new;
            if (newMessage.sender_id === user.id) return;

            // 1. 내가 참여 중인 채팅방인지 확인 (sender가 아니므로 receiver여야 함)
            // direct_chats 조회: user1_id, user2_id 확인
            // 이때 profile.id가 필요함. (상단에서 이미 fetched)
            if (!profile?.id) return;

            // ⚠️ [추가] 현재 이 채팅방을 보고 있다면 알림 띄우지 않음
            if (currentChatRef.current === newMessage.chat_id) {
               return; 
            }

            const { data: chatInfo, error: chatError } = await supabase
               .from('direct_chats')
               .select('user1_id, user2_id')
               .eq('id', newMessage.chat_id)
               .single();
            
            if (chatError || !chatInfo) return;

            // 내가 참여자가 아니면 무시 (다른 사람들의 대화)
            const isMyChat = (chatInfo.user1_id === profile.id) || (chatInfo.user2_id === profile.id);
            if (!isMyChat) return;

            // 2. 보낸 사람 정보 조회
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('nickname, avatar_url')
              .eq('user_id', newMessage.sender_id)
              .maybeSingle();

            toast.custom((_t) => (
              <NotificationToast
                type="chat"
                sender={{
                  nickname: senderProfile?.nickname ?? '알 수 없는 사용자',
                  avatar_url: senderProfile?.avatar_url ?? null,
                }}
                content={newMessage.content}
                timestamp={newMessage.created_at}
              />
            ), {
              id: `chat-${newMessage.id}`,
              duration: 4000
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
