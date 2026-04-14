/**
 * 전역 알림 및 실시간 상호작용 브로드캐스트 엔진(Global Notification & Real-time Interaction Broadcast Engine):
 * - 목적(Why): 서비스 전반에서 발생하는 소셜 활동(팔로우, 댓글, 좋아요) 및 채팅 메시지를 사용자에게 즉각 피드백함
 * - 방법(How): 다중 Supabase Realtime 채널 구독, 수신 거부(차단) 필터링, 그리고 고유한 알림 키 기반의 디바운싱(Debouncing) 처리를 통해 고사양의 실시간 푸시 경험을 제공함
 */
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { useDirectChat } from '@/contexts/DirectChatContext';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { NotificationToast } from './NotificationToast';

export const GlobalNotificationListener: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currentChat, blockedUserIds } = useDirectChat();
  
  // Active Context Tracking: Tracks the current chat room ID to suppress redundant push notifications while the user is in-view.
  const currentChatRef = useRef<string | null>(null);
  // Event Deduplication: Implements a short-term buffer to filter out rapid, identical notification spikes (debouncing).
  const recentNotificationsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    currentChatRef.current = currentChat?.id || null;
  }, [currentChat]);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    let notifChannel: any = null;
    let chatChannel: any = null;

    const setupSubscriptions = async () => {
      // 1. Fetch profile ID
      const { data: profile } = await (supabase.from('profiles') as any)
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
            async (payload: import('@supabase/supabase-js').RealtimePostgresInsertPayload<import('../../types/database').Database['public']['Tables']['notifications']['Row']>) => {
              const newNotif = payload.new;

              // Inbound Blacklist Filter: Suppresses notification propagation if the sender is present in the blocklist.
              if (blockedUserIds.has(newNotif.sender_id as string)) {
                return;
              }
              
              const { data: senderProfile } = await (supabase.from('profiles') as any)
                .select('id, nickname, avatar_url, username, bio')
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
              
              // Cache Maintenance: Performs manual garbage collection on the tracking map after a 5-second TTL to prevent memory bloat.
              for (const [key, timestamp] of recentNotificationsRef.current.entries()) {
                if (now - timestamp > 5000) {
                  recentNotificationsRef.current.delete(key);
                }
              }

              // 프로필이 없어도 알림은 띄움 (Fallback)
              toast.custom((t) => (
                <NotificationToast
                  type={newNotif.type as any}
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
                    } else if (newNotif.type === 'follow' && senderProfile?.nickname) {
                       navigate(`/profile/${encodeURIComponent(senderProfile.nickname)}`);
                    } else {
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
          async (payload: import('@supabase/supabase-js').RealtimePostgresInsertPayload<import('../../types/database').Database['public']['Tables']['direct_messages']['Row']>) => {
            const newMessage = payload.new;

            // Shadow Block Check
            if (blockedUserIds.has(newMessage.sender_id)) {
              return;
            }

            if (newMessage.sender_id === user.id) return;
            // 시스템 메시지(예: 나가기 알림 등)는 글로벌 토스트 띄우지 않음
            if ((newMessage as any).is_system_message) return;
            if (!profile?.id) return;
            if (currentChatRef.current === newMessage.chat_id) return;

            // 채팅 알림 설정 확인 (토스트용)
            try {
              const { data: chatSettings } = await (supabase.from('profiles') as any)
                .select('notify_chat')
                .eq('user_id', user.id)
                .single();
              
              // 채팅 알림이 비활성화되어 있으면 토스트 띄우지 않음 (헤더 알림은 DirectChatContext에서 처리)
              if (chatSettings?.notify_chat === false) {
                return;
              }
            } catch (err) {
              // 에러 시 기본값(true)으로 동작
              console.warn('[GlobalNotificationListener] Error checking chat notification settings:', err);
            }

            // active 상태도 같이 조회하여, 내가 나간 채팅방인지 확인
            const { data: chatInfo, error: chatError } = await (supabase.from('direct_chats') as any)
               .select('user1_id, user2_id, user1_active, user2_active')
               .eq('id', newMessage.chat_id)
               .single();
            
            if (chatError || !chatInfo) return;

            // 내가 참여중이고(active=true), 내 채팅방인 경우만 알림
            const isUser1 = chatInfo.user1_id === profile?.id;
            const isUser2 = chatInfo.user2_id === profile?.id;

            if (isUser1) {
              if (!chatInfo.user1_active) return; // 내가 나갔으면 알림 X
            } else if (isUser2) {
              if (!chatInfo.user2_active) return; // 내가 나갔으면 알림 X
            } else {
              return; // 내 채팅방 아님
            }

            const { data: senderProfile } = await (supabase.from('profiles') as any)
              .select('nickname, avatar_url')
              .eq('user_id', newMessage.sender_id)
              .maybeSingle();

            // Realtime Payload에는 Relation 데이터(attachments 등)가 포함되지 않음.
            // 따라서 첨부파일이 있는 메시지일 경우, 별도로 전체 데이터를 조회해야 함.
            let contentWithMedia = newMessage.content || '';
            const { data: fullMessage } = await (supabase.from('direct_messages') as any)
              .select(`*, attachments:direct_message_attachments(*)`)
              .eq('id', newMessage.id)
              .maybeSingle();

            if ((fullMessage as any)?.attachments && (fullMessage as any).attachments.length > 0) {
              const types = ((fullMessage as any).attachments || []).map((a: any) => a.type);
              let prefix = '';
              if (types.includes('video')) prefix = `[${t('notification.media_video', '동영상')}] `;
              else if (types.includes('file')) prefix = `[${t('notification.media_file', '파일')}] `;
              else if (types.includes('image')) prefix = `[${t('notification.media_photo', '사진')}] `;
              
              contentWithMedia = `${prefix}${contentWithMedia}`.trim();
            } else if (!contentWithMedia) {
              // 첨부파일 표시 시도 (fullMessage fetch 실패 시 등 방어 로직)
              contentWithMedia = t('chat.new_message_received', '새 메시지가 도착했습니다.');
            }

            toast.custom((t) => (
              <NotificationToast
                type="chat"
                sender={{
                  nickname: senderProfile?.nickname ?? '알 수 없는 사용자',
                  avatar_url: senderProfile?.avatar_url ?? null,
                }}
                content={contentWithMedia}
                timestamp={newMessage.created_at ?? ''}
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
