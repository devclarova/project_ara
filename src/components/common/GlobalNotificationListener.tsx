import React, { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { NotificationToast } from './NotificationToast';

export const GlobalNotificationListener: React.FC = () => {
  const { user } = useAuth();

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
        console.log('GlobalNotificationListener: Subscribing to notifications for profile', profile.id);
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
              console.log('GlobalNotificationListener: Received notification payload', payload);
              const newNotif = payload.new;
              
              const { data: senderProfile } = await supabase
                .from('profiles')
                .select('nickname, avatar_url')
                .eq('id', newNotif.sender_id)
                .maybeSingle();

              // 프로필이 없어도 알림은 띄움 (Fallback)
              toast.custom((_t) => (
                <NotificationToast
                  type={newNotif.type}
                  sender={{
                    nickname: senderProfile?.nickname ?? '알 수 없는 사용자',
                    avatar_url: senderProfile?.avatar_url ?? null,
                  }}
                  content={newNotif.content}
                  timestamp={newNotif.created_at}
                />
              ), {
                id: `notif-${newNotif.id}`,
                duration: 4000,
                position: 'bottom-right'
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
              duration: 4000,
              position: 'bottom-right'
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
