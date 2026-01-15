/**
 * 1 : 1 채팅 서비스 (Supabase 연동 버전)
 *  - 실제 Supabase API를 사용한 채팅 서비스
 *  - 데이터베이스 연동을 통한 실시간 채팅 기능
 *
 * 주요기능
 *  - 채팅방 생성 및 조회
 *  - 메시지 전송 및 조회
 *  - 사용자 검색
 *  - 실시간 메시지 동기화
 *
 * Supabase 테이블 구조
 *  - direct_chats: 1:1 채팅방 정보
 *  - direct_messages: 메시지 정보
 *  - auth.users: 사용자 인증 정보
 */

import { supabase } from '../../lib/supabase';
import { ensureMyProfileId } from '../../lib/ensureMyProfileId';
import type {
  DirectChat,
  ChatApiResponse,
  ChatListItem,
  ChatUser,
  CreateMessageData,
  DirectMessage,
  SendMessagePayload,
} from '../../types/ChatType';

/**
 * 현재 사용자 정보 가져오기 (profiles.id 포함)
 */
async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('사용자가 로그인되지 않았습니다.');
  }

  // profiles 테이블의 ID를 가져오기
  const profileId = await ensureMyProfileId();

  return {
    ...user,
    profileId, // profiles.id
  };
}

/**
 * 사용자 프로필 정보 조회 (디버깅용)
 */
export async function getUserProfile(userId: string): Promise<ChatApiResponse<ChatUser>> {
  try {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, nickname, avatar_url, username')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError || !profileData) {
      return {
        success: false,
        error: `프로필 조회 실패: ${profileError?.message || '데이터 없음'}`,
      };
    }

    const userInfo: ChatUser = {
      id: profileData.id,
      email: `user-${profileData.id}@example.com`,
      nickname: profileData.nickname,
      username: profileData.username,
      avatar_url: profileData.avatar_url,
    };

    return { success: true, data: userInfo };
  } catch (error) {
    console.error('getUserProfile 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
}

/**
 * 1 : 1 채팅방 생성 또는 찾기
 * - 사용자가 특정 사용자와 채팅을 시작하려고 할 때 호출
 * - 기존 채팅방이 있으면 재사용, 없으면 새로 생성함.
 * - 중복 채팅방이 생성되지 않도록
 *
 * @param participantId - 채팅방에 참여할 상대방 ID
 */
export async function findOrCreateDirectChat(
  participantId: string,
): Promise<ChatApiResponse<DirectChat>> {
  try {
    const currentUser = await getCurrentUser();

    // 1단계: 기존 채팅방 찾기 (활성/비활성 모두 포함)
    const { data: existingChats, error: findError } = await supabase
      .from('direct_chats')
      .select('*')
      .or(
        `and(user1_id.eq.${currentUser.profileId},user2_id.eq.${participantId}),and(user1_id.eq.${participantId},user2_id.eq.${currentUser.profileId})`,
      )
      .limit(1);

    if (findError) {
      console.error('채팅방 검색 오류:', findError);
      return { success: false, error: '채팅방을 찾을 수 없습니다.' };
    }

    if (existingChats && existingChats.length > 0) {
      const existingChat = existingChats[0];

      // 비활성화된 채팅방이면 다시 활성화
      const isCurrentUserUser1 = existingChat.user1_id === currentUser.profileId;
      const isCurrentUserActive = isCurrentUserUser1
        ? existingChat.user1_active
        : existingChat.user2_active;

      if (!isCurrentUserActive) {
        // 사용자가 다시 들어올 때 나간 시점을 초기화
        const updateData = isCurrentUserUser1
          ? { user1_active: true, user1_left_at: null }
          : { user2_active: true, user2_left_at: null };

        const { data: reactivatedChat, error: reactivateError } = await supabase
          .from('direct_chats')
          .update(updateData)
          .eq('id', existingChat.id)
          .select()
          .single();

        if (reactivateError) {
          console.error('채팅방 재활성화 오류:', reactivateError);
          return { success: false, error: '채팅방을 재활성화할 수 없습니다.' };
        }

        return { success: true, data: reactivatedChat };
      }

      // 활성화된 채팅방 발견
      return { success: true, data: existingChat };
    }

    // 2단계: 새 채팅방 생성 (상대방에게 알림 설정)

    // // users 테이블에 profiles.id와 일치하는 레코드 생성 (외래키 제약 조건 해결)
    // try {
    //   // 현재 사용자의 profiles.id를 users 테이블에 추가
    //   const { data: currentUserResult, error: currentUserError } = await supabase
    //     .from('users')
    //     .upsert(
    //       {
    //         id: currentUser.profileId, // profiles.id를 users.id로 사용
    //         auth_user_id: currentUser.id,
    //         email: currentUser.email,
    //         created_at: new Date().toISOString(),
    //         last_login: new Date().toISOString(),
    //       },
    //       { onConflict: 'id' },
    //     );

    //   // 상대방 사용자의 profiles.id를 users 테이블에 추가
    //   const { data: participantResult, error: participantError } = await supabase
    //     .from('users')
    //     .upsert(
    //       {
    //         id: participantId, // profiles.id를 users.id로 사용
    //         auth_user_id: participantId, // 임시로 같은 값 사용
    //         email: `user-${participantId}@example.com`,
    //         created_at: new Date().toISOString(),
    //         last_login: new Date().toISOString(),
    //       },
    //       { onConflict: 'id' },
    //     );
    // } catch (userError) {
    //   console.warn('users 테이블 업서트 실패:', userError);
    // }

    const { data: newChat, error: createError } = await supabase
      .from('direct_chats')
      .insert({
        user1_id: currentUser.profileId,
        user2_id: participantId,
        user1_active: true,
        user2_active: true,
        user1_notified: false, // 생성자는 알림 불필요
        user2_notified: true, // 상대방에게 새 채팅방 알림
      })
      .select()
      .single();

    if (createError) {
      // 중복 에러인 경우 기존 채팅방 다시 찾기
      if (createError.code === '23505') {
        const { data: existingChat } = await supabase
          .from('direct_chats')
          .select('*')
          .or(
            `and(user1_id.eq.${currentUser.profileId},user2_id.eq.${participantId}),and(user1_id.eq.${participantId},user2_id.eq.${currentUser.profileId})`,
          )
          .single();

        // 기존 채팅방이 비활성화되어 있다면 활성화
        if (existingChat) {
          const isCurrentUserUser1 = existingChat.user1_id === currentUser.profileId;
          const isCurrentUserActive = isCurrentUserUser1
            ? existingChat.user1_active
            : existingChat.user2_active;

          if (!isCurrentUserActive) {
            const updateData = isCurrentUserUser1 ? { user1_active: true } : { user2_active: true };

            const { data: reactivatedChat } = await supabase
              .from('direct_chats')
              .update(updateData)
              .eq('id', existingChat.id)
              .select()
              .single();
            return { success: true, data: reactivatedChat || existingChat };
          }
        }

        return { success: true, data: existingChat };
      }

      console.error('채팅방 생성 오류:', createError);
      return { success: false, error: '채팅방을 생성할 수 없습니다.' };
    }

    return { success: true, data: newChat };
  } catch (error) {
    console.error('findOrCreateDirectChat 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
}

/**
 * 채팅방 목록 조회
 */
export async function getChatList(): Promise<ChatApiResponse<ChatListItem[]>> {
  try {
    const currentUser = await getCurrentUser();

    // 사용자의 활성화된 채팅방 목록 조회 (최신 메시지 순)
    const { data: chats, error: chatsError } = await supabase
      .from('direct_chats')
      .select('*')
      .or(
        `and(user1_id.eq.${currentUser.profileId},user1_active.eq.true),and(user2_id.eq.${currentUser.profileId},user2_active.eq.true)`,
      )
      .order('last_message_at', { ascending: false });

    if (chatsError) {
      console.error('채팅방 목록 조회 오류:', chatsError);
      return { success: false, error: '채팅방 목록을 불러올 수 없습니다.' };
    }

    if (!chats || chats.length === 0) {
      return { success: true, data: [] };
    }

    // 1단계: 모든 채팅방의 상대방 ID 수집
    const otherUserIds = Array.from(
      new Set(
        chats.map(chat =>
          chat.user1_id === currentUser.profileId ? chat.user2_id : chat.user1_id,
        ),
      ),
    );

    // 2단계: 상대방 프로필 일괄 조회 (Batch Fetch)
    let profileMap = new Map<string, ChatUser>();
    if (otherUserIds.length > 0) {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_url, username, banned_until')
        .in('id', otherUserIds);

      if (!profileError && profiles) {
        profiles.forEach(p => {
          profileMap.set(p.id, {
            id: p.id,
            email: `user-${p.id}@example.com`,
            nickname: p.nickname,
            username: p.username,
            avatar_url: p.avatar_url,
            banned_until: p.banned_until,
          });
        });
      }
    }

    // 3단계: 각 채팅방 정보 조립 (병렬 처리)
    // - 메시지 조회는 각 채팅방마다 최신 1개만 필요하므로, 복잡한 쿼리 대신 병렬 실행 유지
    //   (Batch로 하려면 window function이 필요한데, 현재 Supabase 클라이언트로는 복잡함)
    const chatListItems: ChatListItem[] = await Promise.all(
      chats.map(async chat => {
        // 상대방 사용자 ID
        const otherUserId = chat.user1_id === currentUser.profileId ? chat.user2_id : chat.user1_id;

        // Map에서 프로필 조회 (없으면 기본값)
        const otherUserInfo: ChatUser = profileMap.get(otherUserId) || {
          id: otherUserId,
          email: `user-${otherUserId}@example.com`,
          nickname: `User ${otherUserId.slice(0, 8)}`,
          avatar_url: null,
        };

        // 마지막 메시지 조회
        let lastMessage = null;
        try {
          const { data: lastMessageData } = await supabase
            .from('direct_messages')
            .select('content, created_at, sender_id, attachments:direct_message_attachments(type)')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (lastMessageData && lastMessageData.length > 0) {
            lastMessage = lastMessageData[0];
          }
        } catch (error) {
          // ignore
        }

        // 읽지 않은 메시지 수 조회
        let unreadCount = 0;
        try {
          // count만 빠르게 가져오도록 최적화
          const { count } = await supabase
            .from('direct_messages')
            .select('*', { count: 'exact', head: true })
            .eq('chat_id', chat.id)
            .eq('is_read', false)
            .neq('sender_id', currentUser.id);

          if (count !== null) {
            unreadCount = count;
          }
        } catch (error) {
          // ignore
        }

        // 새 채팅방 알림 상태 확인
        const isCurrentUserUser1 = chat.user1_id === currentUser.profileId;
        const isNewChat = isCurrentUserUser1 ? chat.user1_notified : chat.user2_notified;

        return {
          id: chat.id,
          other_user: otherUserInfo,
          last_message: lastMessage
            ? {
                content: lastMessage.content,
                created_at: lastMessage.created_at,
                sender_nickname:
                  lastMessage.sender_id === currentUser.id ? '나' : otherUserInfo.nickname,
                sender_id: lastMessage.sender_id,
                attachments: lastMessage.attachments || [],
              }
            : undefined,
          unread_count: unreadCount || 0,
          is_new_chat: isNewChat || false,
          last_message_at: chat.last_message_at,
        };
      }),
    );

    return { success: true, data: chatListItems };
  } catch (error) {
    console.error('getChatList 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
}

/**
 * 단일 채팅방 정보 조회 (ChatListItem 형태)
 * - 채팅방 목록에 없는 경우(새로 생성 직후 등) 상세 정보를 조회하기 위함
 */
export async function getDirectChat(chatId: string): Promise<ChatApiResponse<ChatListItem>> {
  try {
    const currentUser = await getCurrentUser();

    // 채팅방 정보 조회
    const { data: chat, error: chatError } = await supabase
      .from('direct_chats')
      .select('*')
      .eq('id', chatId)
      .single();

    if (chatError || !chat) {
      return { success: false, error: '채팅방을 찾을 수 없습니다.' };
    }

    // 상대방 ID 확인
    const otherUserId = chat.user1_id === currentUser.profileId ? chat.user2_id : chat.user1_id;

    // 상대방 프로필 조회
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, nickname, avatar_url, username, banned_until')
      .eq('id', otherUserId)
      .single();

    const otherUserInfo: ChatUser = profile
      ? {
          id: profile.id,
          email: `user-${profile.id}@example.com`,
          nickname: profile.nickname,
          username: profile.username,
          avatar_url: profile.avatar_url,
          banned_until: profile.banned_until,
        }
      : {
          id: otherUserId,
          email: `user-${otherUserId}@example.com`,
          nickname: `User ${otherUserId.slice(0, 8)}`,
          avatar_url: null,
        };

    // 마지막 메시지 조회
    let lastMessage = null;
    try {
      const { data: lastMessageData } = await supabase
        .from('direct_messages')
        .select('content, created_at, sender_id, attachments:direct_message_attachments(type)')
        .eq('chat_id', chat.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (lastMessageData && lastMessageData.length > 0) {
        lastMessage = lastMessageData[0];
      }
    } catch (error) {
      // ignore
    }

    // 읽지 않은 메시지 수 조회
    let unreadCount = 0;
    try {
      const { count } = await supabase
        .from('direct_messages')
        .select('*', { count: 'exact', head: true })
        .eq('chat_id', chat.id)
        .eq('is_read', false)
        .neq('sender_id', currentUser.id);

      if (count !== null) {
        unreadCount = count;
      }
    } catch (error) {
      // ignore
    }

    // 새 채팅방 알림 상태 확인
    const isCurrentUserUser1 = chat.user1_id === currentUser.profileId;
    const isNewChat = isCurrentUserUser1 ? chat.user1_notified : chat.user2_notified;

    const chatItem: ChatListItem = {
      id: chat.id,
      other_user: otherUserInfo,
      last_message: lastMessage
        ? {
            content: lastMessage.content,
            created_at: lastMessage.created_at,
            sender_nickname:
              lastMessage.sender_id === currentUser.id ? '나' : otherUserInfo.nickname,
            sender_id: lastMessage.sender_id,
            attachments: lastMessage.attachments || [],
          }
        : undefined,
      unread_count: unreadCount || 0,
      is_new_chat: isNewChat || false,
      last_message_at: chat.last_message_at,
    };

    return { success: true, data: chatItem };
  } catch (error) {
    console.error('getDirectChat 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
}

// 업로드 함수
// 업로드 함수 (이미지, 동영상, 파일 통합 지원)
async function uploadAttachments(files: File[], chatId: string) {
  const uploads: { url: string; type: 'image' | 'video' | 'file'; name: string }[] = [];

  for (const file of files) {
    const ext = file.name.split('.').pop();
    const path = `direct/${chatId}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from('chat_attachments')
      .upload(path, file, { upsert: false });

    if (error) {
      console.error('UPLOAD ERROR', error);
      throw error;
    }

    const { data } = supabase.storage.from('chat_attachments').getPublicUrl(path);

    // MIME 타입 기반 타입 결정
    let type: 'image' | 'video' | 'file' = 'file';
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type.startsWith('video/')) type = 'video';

    uploads.push({
      url: data.publicUrl,
      type,
      name: file.name,
    });
  }

  return uploads;
}

/**
 * 메세지 전송
 *
 * @param messageData - 전송할 메시지 데이터
 */
export async function sendMessage(
  messageData: SendMessagePayload,
): Promise<ChatApiResponse<DirectMessage>> {
  try {
    const currentUser = await getCurrentUser();

    // 0단계: 채팅방 존재 여부 확인 및 상대방 정보 조회
    const { data: chat, error: chatError } = await supabase
      .from('direct_chats')
      .select('id, user1_id, user2_id, user1_active, user2_active, user1_notified, user2_notified')
      .eq('id', messageData.chat_id)
      .single();

    if (chatError || !chat) {
      console.error('채팅방 조회 오류:', chatError);
      return { success: false, error: '채팅방을 찾을 수 없습니다.' };
    }

    // 상대방 ID 식별
    const otherUserId = chat.user1_id === currentUser.profileId ? chat.user2_id : chat.user1_id;

    // 2. 상대방이 나를 차단했는지
    let isBlockedByOther = false;

    if (otherUserId) {
        // active block only (ended_at is null)
        const { data: blockData } = await supabase
            .from('user_blocks')
            .select('id, blocker_id')
            .or(`and(blocker_id.eq.${currentUser.profileId},blocked_id.eq.${otherUserId}),and(blocker_id.eq.${otherUserId},blocked_id.eq.${currentUser.profileId})`)
            .is('ended_at', null)
            .maybeSingle();

        if (blockData) {
            // Case 1: 내가 상대를 차단함 -> 전송 불가 (에러)
            if (blockData.blocker_id === currentUser.profileId) {
                return { success: false, error: '차단한 사용자에게는 메시지를 보낼 수 없습니다.' };
            } 
            // Case 2: 상대가 나를 차단함 -> 전송 성공 처리하되, 알림은 가지 않음 (Shadow Block)
            else {
                isBlockedByOther = true;
            }
        }
    }

    // 상대방의 active 상태를 true로 변경하고 알림 설정
    // 단, 상대방이 나를 차단했다면 알림/활성화를 강제하지 않음 (Shadow Block)
    if (!isBlockedByOther) {
        const isCurrentUserUser1 = chat.user1_id === currentUser.profileId;
        const otherUserActiveField = isCurrentUserUser1 ? 'user2_active' : 'user1_active';
        const otherUserNotifiedField = isCurrentUserUser1 ? 'user2_notified' : 'user1_notified';

        // 상대방이 나간 상태에서 메시지를 받으면 알림 설정
        if (!chat[otherUserActiveField]) {
            const updateData = {
                [otherUserActiveField]: true,
                [otherUserNotifiedField]: true, // 새 메시지 알림 설정
            };

            const { error: activateError } = await supabase
                .from('direct_chats')
                .update(updateData)
                .eq('id', messageData.chat_id);

            if (activateError) {
                console.error('상대방 활성화 및 알림 설정 오류:', activateError);
            }
        }
    }

    // 1단계: 메시지 저장
    const { data: newMessage, error: messageError } = await supabase
      .from('direct_messages')
      .insert({
        chat_id: messageData.chat_id,
        sender_id: currentUser.id,
        content: messageData.content,
        is_read: isBlockedByOther,
        read_at: isBlockedByOther ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (messageError) {
      console.error('메시지 전송 오류:', messageError);
      console.error('오류 코드:', messageError.code);
      console.error('오류 메시지:', messageError.message);
      console.error('오류 세부사항:', messageError.details);
      console.error('오류 힌트:', messageError.hint);
      return { success: false, error: `메시지를 전송할 수 없습니다: ${messageError.message}` };
    }

    // 파일 업로드 + attachment insert
    if (messageData.attachments?.length) {
      const uploadedFiles = await uploadAttachments(messageData.attachments, messageData.chat_id);

      const rows = uploadedFiles.map(file => ({
        message_id: newMessage.id,
        type: file.type,
        url: file.url,
        name: file.name, // 파일명 저장
      }));

      const { error: attachError } = await supabase.from('direct_message_attachments').insert(rows);

      if (attachError) {
        console.error('attachment 저장 실패', attachError);
      }
    }

    // 2단계: 채팅방의 마지막 메시지 시간 업데이트
    const { error: updateError } = await supabase
      .from('direct_chats')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', messageData.chat_id);

    if (updateError) {
      console.error('채팅방 업데이트 오류:', updateError);
      // 메시지는 전송되었으므로 성공으로 처리
    }

    // attachment 조회
    const { data: attachments } = await supabase
      .from('direct_message_attachments')
      .select('id, type, url, width, height, name')
      .eq('message_id', newMessage.id);

    return {
      success: true,
      data: {
        ...newMessage,
        attachments: attachments || [],
      },
    };
  } catch (error) {
    console.error('sendMessage 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
}

/**
 * 메시지 목록 조회
 *
 * @param chatId - 채팅방의 ID
 */
/**
 * 메시지 목록 조회 (페이지네이션 지원)
 *
 * @param chatId - 채팅방의 ID
 * @param limit - 조회할 메시지 개수 (기본값: 50)
 * @param beforeAt - 이 시간 이전의 메시지 조회 (무한 스크롤용 커서)
 */
export async function getMessages(
  chatId: string,
  limit: number = 50,
  beforeAt?: string,
  targetId?: string,
  afterAt?: string,
): Promise<ChatApiResponse<{ messages: DirectMessage[]; hasNext: boolean }>> {
  try {
    const currentUser = await getCurrentUser();

    // 0단계: 채팅방 정보 조회 (사용자가 나간 시점 확인)
    const { data: chatInfo, error: chatError } = await supabase
      .from('direct_chats')
      .select('user1_id, user2_id, user1_left_at, user2_left_at')
      .eq('id', chatId)
      .single();

    if (chatError || !chatInfo) {
      console.error('채팅방 정보 조회 오류:', chatError);
      return { success: false, error: '채팅방을 찾을 수 없습니다.' };
    }

    // 현재 사용자가 나간 시점 확인
    const isCurrentUserUser1 = chatInfo.user1_id === currentUser.profileId;
    const userLeftAt = isCurrentUserUser1 ? chatInfo.user1_left_at : chatInfo.user2_left_at;

    // 쿼리 구성 시작
    let query = supabase
      .from('direct_messages')
      .select(`*, attachments:direct_message_attachments (id, type, url, width, height, name)`)
      .eq('chat_id', chatId);

    // 사용자가 나간 시점이 있으면 그 이후의 메시지만 조회
    if (userLeftAt) {
      query = query.gte('created_at', userLeftAt);
    }

    // targetId가 있으면 해당 메시지 시점부터 조회 (Deep Linking)
    // with Context: 타겟 메시지 이전의 대화(맥락)도 일부 가져옴
    if (targetId) {
      // 1. 타겟 메시지의 시간 조회
      const { data: targetMsg, error: targetError } = await supabase
        .from('direct_messages')
        .select('created_at')
        .eq('id', targetId)
        .single();

      if (!targetError && targetMsg) {
        // 2-1. 이전 메시지 (Context) 조회 (예: 5개)
        const contextLimit = 5;
        const { data: prevMessages } = await supabase
          .from('direct_messages')
          .select(`*, attachments:direct_message_attachments ( id, type, url, width, height, name)`)
          .eq('chat_id', chatId)
          .lt('created_at', targetMsg.created_at) // 타겟보다 과거
          .order('created_at', { ascending: false }) // 최신순(타겟에 가까운 순)으로 가져옴
          .limit(contextLimit);

        // 2-2. 타겟 포함 이후 메시지 조회
        const nextLimit = limit - (prevMessages?.length || 0); // 나머지 개수만큼
        const { data: nextMessages, error: nextError } = await supabase
          .from('direct_messages')
          .select(`*, attachments:direct_message_attachments ( id, type, url, width, height, name)`)
          .eq('chat_id', chatId)
          .gte('created_at', targetMsg.created_at)
          .order('created_at', { ascending: true })
          .limit(nextLimit + 1); // hasNext 확인용

        if (nextError) {
          throw nextError;
        }

        // 3. 데이터 병합
        // prevMessages는 DESC(타겟에 가까운 과거 -> 먼 과거)로 왔으므로 뒤집어야 시간순(과거->타겟)이 됨
        const sortedPrev = (prevMessages || []).reverse();
        const combined = [...sortedPrev, ...(nextMessages || [])];

        // 쿼리 결과 덮어쓰기 (rawMessages 처럼 사용하기 위해)
        // 여기서 바로 return하거나, 아래의 공통 로직을 탈 수 있게 변수에 할당해야 함.
        // 하지만 아래 로직은 query 객체를 실행하는 구조이므로 구조가 안 맞음.
        // 따라서 여기서 바로 가공해서 리턴하거나, query 실행을 건너뛰게 해야 함.
        // -> 코드를 깔끔하게 하기 위해, 여기서 결과를 만들고 아래 로직을 통해 리턴하도록 rawMessages 대체 변수 사용?
        // -> 기존 코드 흐름상 query 실행 결과를 기다리므로, 여기서는 query를 null로 만들고 처리를 분기하는 게 좋음.

        // 리팩토링: 아래 query 실행 부분을 조건부로 변경하기보다는,
        // 여기서 조기 리턴(Early Return)하는 것이 안전하고 깔끔함.

        const rawNextMessages = nextMessages || [];
        const hasNext = rawNextMessages.length > nextLimit; // 정방향(미래) 데이터 더 있는지

        // 실제 반환 데이터 (limit 자르기 - nextMessages에서만 자르면 됨)
        const effectiveNextMessages = rawNextMessages.slice(0, nextLimit);
        const finalMessages = [...sortedPrev, ...effectiveNextMessages];

        // 최종 시간순 정렬 (이미 merge로 되어있지만 안전하게)
        finalMessages.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );

        // 읽음 처리 (비동기)
        (async () => {
          try {
            const unreadIds = finalMessages
              .filter(m => !m.is_read && m.sender_id !== currentUser.id)
              .map(m => m.id);

            if (unreadIds.length > 0) {
              await supabase
                .from('direct_messages')
                .update({ is_read: true, read_at: new Date().toISOString() })
                .in('id', unreadIds);
            }
          } catch (err) {
            console.error('읽음 처리 실패:', err);
          }
        })();

        return {
          success: true,
          data: {
            messages: finalMessages,
            // targetId 모드에서는 hasNext(미래) 여부만 체크.
            // hasMore(과거)는 UI에서 true로 가정하고 스크롤 시 로드 시도함.
            hasNext: hasNext,
          },
        };
      } else {
        return { success: false, error: '타겟 메시지를 찾을 수 없습니다.' };
      }
    }
    // 정방향 스크롤 (afterAt)
    else if (afterAt) {
      query = query
        .gt('created_at', afterAt)
        .order('created_at', { ascending: true }) // 정방향은 무조건 ASC
        .limit(limit + 1);
    }
    // 역방향 스크롤 (beforeAt) 또는 최신순 조회 (기본)
    else {
      if (beforeAt) {
        // Use lte instead of lt to handle messages with identical timestamps
        // We'll rely on deduplication in the context layer to handle any overlap
        query = query.lt('created_at', beforeAt);
      }
      query = query
        .order('created_at', { ascending: false }) // 기본 DESC
        .limit(limit + 1);
    }

    const { data: rawMessages, error: messagesError } = await query;

    if (messagesError) {
      console.error('메시지 목록 조회 오류:', messagesError);
      if (messagesError.code === 'PGRST301' || messagesError.message.includes('permission')) {
        return { success: true, data: { messages: [], hasNext: false } };
      }
      return {
        success: false,
        error: `메시지를 불러올 수 없습니다: ${messagesError.message}`,
      };
    }

    if (!rawMessages || rawMessages.length === 0) {
      return { success: true, data: { messages: [], hasNext: false } };
    }

    // 다음 페이지 존재 여부 확인
    const hasNext = rawMessages.length > limit;

    // 실제 반환할 메시지는 limit만큼 자름
    let messages = rawMessages.slice(0, limit);

    // 정렬 로직:
    // targetId/afterAt -> ASC (오래된 -> 최신) -> 그대로 둠 (or 다시 정렬해도 무방)
    // 기본/beforeAt -> DESC (최신 -> 오래된) -> 시간순(오래된 -> 최신) 정렬 필요
    if (!targetId && !afterAt) {
      messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }
    // targetId/afterAt의 경우 쿼리 단계에서 이미 ASC이므로 순서가 맞음 (가장 가까운 미래부터 limit개)

    // 상대방이 보낸 메시지를 읽음 처리 (가장 최신의 메시지들만 읽어도 됨)
    (async () => {
      try {
        const unreadIds = messages
          .filter(m => !m.is_read && m.sender_id !== currentUser.id)
          .map(m => m.id);

        if (unreadIds.length > 0) {
          await supabase
            .from('direct_messages')
            .update({
              is_read: true,
              read_at: new Date().toISOString(),
            })
            .in('id', unreadIds);
        }
      } catch (e) {
        console.error('읽음 처리 중 오류 (무시됨):', e);
      }
    })();

    // 2단계: 발신자 정보 일괄 조회 (Batch Fetching)
    const senderIds = Array.from(new Set(messages.map(m => m.sender_id)));

    // 프로필 정보 조회
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, nickname, avatar_url, user_id, username')
      .in('user_id', senderIds);

    const profileMap = new Map<string, ChatUser>();

    profileMap.set(currentUser.id, {
      id: currentUser.profileId,
      email: currentUser.email || '',
      nickname: '나',
      username: currentUser.user_metadata?.username, // user_metadata에서 가져오거나 undefined
      avatar_url: currentUser.user_metadata?.avatar_url || null,
    });

    if (profiles) {
      profiles.forEach(p => {
        profileMap.set(p.user_id, {
          id: p.id,
          email: `user-${p.id}@example.com`,
          nickname: p.nickname,
          username: p.username,
          avatar_url: p.avatar_url,
        });
      });
    }

    const messageDetails: DirectMessage[] = messages.map(message => {
      let senderInfo = profileMap.get(message.sender_id);

      if (!senderInfo) {
        senderInfo = {
          id: message.sender_id,
          email: '',
          nickname: message.sender_id === currentUser.id ? '나' : '알 수 없음',
          avatar_url: null,
        };
      }

      return {
        id: message.id,
        chat_id: message.chat_id,
        sender_id: message.sender_id,
        content: message.content,
        is_read: message.is_read,
        read_at: message.read_at,
        created_at: message.created_at,
        is_system_message: message.is_system_message || false,
        sender: senderInfo,
        attachments: message.attachments ?? [],
      };
    });

    return { success: true, data: { messages: messageDetails, hasNext } };
  } catch (error) {
    console.error('getMessages 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
}

/**
 * 전체 메시지 검색 (채팅방 내 검색이 아닌 전체 내역 검색)
 * - 사용자의 채팅 이력(참여 중인 채팅방) 내에서만 검색
 */
export async function searchMessagesGlobal(
  searchTerm: string,
): Promise<ChatApiResponse<DirectMessage[]>> {
  try {
    const currentUser = await getCurrentUser();

    if (!searchTerm.trim()) {
      return { success: true, data: [] };
    }

    // 1. 내가 참여 중인 채팅방 ID 목록 가져오기
    const { data: myChats, error: chatError } = await supabase
      .from('direct_chats')
      .select('id')
      .or(
        `and(user1_id.eq.${currentUser.profileId},user1_active.eq.true),and(user2_id.eq.${currentUser.profileId},user2_active.eq.true)`,
      );

    if (chatError) {
      console.error('채팅방 목록 조회 오류:', chatError);
      return { success: false, error: '채팅방 정보를 불러올 수 없습니다.' };
    }

    if (!myChats || myChats.length === 0) {
      return { success: true, data: [] };
    }

    const chatIds = myChats.map(c => c.id);

    // 2. 해당 채팅방들의 메시지 중에서 검색
    const { data: messages, error } = await supabase
      .from('direct_messages')
      .select(
        `
        *,
        chat:direct_chats!chat_id(id)
      `,
      )
      .in('chat_id', chatIds)
      .ilike('content', `%${searchTerm}%`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('메시지 전체 검색 오류:', error);
      return { success: false, error: '메시지 검색 중 오류가 발생했습니다.' };
    }

    // 3. 발신자 정보 수동 조회를 위한 sender_id 수집
    if (!messages || messages.length === 0) {
      return { success: true, data: [] };
    }

    const senderIds = Array.from(new Set(messages.map((msg: any) => msg.sender_id)));

    // 4. profiles 테이블에서 발신자 정보 일괄 조회
    let profilesMap = new Map<string, any>();
    if (senderIds.length > 0) {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_url, user_id, banned_until')
        .in('user_id', senderIds); // user_id 컬럼으로 검색 (auth.uid와 매핑)

      if (!profileError && profiles) {
        profiles.forEach(p => {
          // user_id를 키로 사용 (메시지의 sender_id가 auth.uid이므로)
          profilesMap.set(p.user_id, p);
        });
      }
    }

    // 5. 결과 매핑: 메시지 + 발신자 정보
    const results: DirectMessage[] = messages.map((msg: any) => {
      const profile = profilesMap.get(msg.sender_id);

      return {
        id: msg.id,
        chat_id: msg.chat_id,
        sender_id: msg.sender_id,
        content: msg.content,
        created_at: msg.created_at,
        is_read: msg.is_read,
        sender: profile
          ? {
              id: profile.id,
              nickname: profile.nickname,
              avatar_url: profile.avatar_url,
              banned_until: profile.banned_until,
              email: '',
            }
          : {
              // 프로필이 없는 경우 (또는 로드 실패) 기본값
              id: msg.sender_id,
              nickname: '알 수 없음',
              avatar_url: null,
              email: '',
            },
      };
    });

    return { success: true, data: results };
  } catch (error) {
    console.error('searchMessagesGlobal 오류:', error);
    return { success: false, error: '알 수 없는 오류가 발생했습니다.' };
  }
}

/**
 * 사용자 검색
 * - 대화 상대방 찾기
 *
 * @param searchTerm - 검색할 닉네임 또는 이메일
 */
export async function searchUsers(searchTerm: string): Promise<ChatApiResponse<ChatUser[]>> {
  try {
    if (!searchTerm.trim()) {
      return { success: true, data: [] };
    }

    // 현재 사용자 정보 가져오기
    const currentUser = await getCurrentUser();

    // 현재 사용자와 이미 채팅 중인 사용자들 조회
    const { data: existingChats, error: chatError } = await supabase
      .from('direct_chats')
      .select('user1_id, user2_id')
      .or(
        `and(user1_id.eq.${currentUser.profileId},user1_active.eq.true),and(user2_id.eq.${currentUser.profileId},user2_active.eq.true)`,
      );

    if (chatError) {
      console.error('기존 채팅방 조회 오류:', chatError);
      // 오류가 있어도 검색은 계속 진행
    }

    // 이미 채팅 중인 사용자 ID 목록 생성
    const existingUserIds = new Set<string>();
    if (existingChats) {
      existingChats.forEach(chat => {
        if (chat.user1_id === currentUser.profileId) {
          existingUserIds.add(chat.user2_id);
        } else {
          existingUserIds.add(chat.user1_id);
        }
      });
    }

    // 사용자 검색 (profiles 테이블에서 검색, 현재 사용자와 이미 채팅 중인 사용자 제외)
    const { data: profiles, error: searchError } = await supabase
      .from('profiles')
      .select('id, nickname, avatar_url, created_at, banned_until')
      .ilike('nickname', `%${searchTerm}%`)
      .neq('user_id', currentUser.id) // user_id로 현재 사용자 제외
      .limit(20);

    if (searchError) {
      console.error('사용자 검색 오류:', searchError);
      return {
        success: false,
        error: `사용자 검색 중 오류가 발생했습니다: ${searchError.message}`,
      };
    }

    if (!profiles || profiles.length === 0) {
      return { success: true, data: [] };
    }

    // 이미 채팅 중인 사용자들을 제외하고 필터링
    const filteredProfiles = profiles.filter(profile => !existingUserIds.has(profile.id));

    // 사용자 데이터를 ChatUser 형태로 변환 (최대 10명)
    const chatUsers: ChatUser[] = filteredProfiles.slice(0, 10).map(profile => ({
      id: profile.id,
      email: `user-${profile.id}@example.com`, // email 필드가 없으므로 기본값 사용
      nickname: profile.nickname,
      avatar_url: profile.avatar_url,
      banned_until: profile.banned_until,
    }));

    return { success: true, data: chatUsers };
  } catch (error) {
    console.error('searchUsers 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
}

/**
 * 비활성화된 채팅방 목록 조회 (나간 채팅방 복구용)
 * - 사용자가 나간 채팅방들을 조회하여 복구할 수 있도록 함
 */
/**
 * 채팅방 입장 시 새 채팅방 알림 해제
 */
export async function clearNewChatNotification(chatId: string): Promise<ChatApiResponse<boolean>> {
  try {
    const currentUser = await getCurrentUser();

    // 채팅방 정보 조회
    const { data: chat, error: chatError } = await supabase
      .from('direct_chats')
      .select('user1_id, user2_id')
      .eq('id', chatId)
      .single();

    if (chatError || !chat) {
      console.error('채팅방 조회 오류:', chatError);
      return { success: false, error: '채팅방을 찾을 수 없습니다.' };
    }

    // 현재 사용자의 알림 상태 해제
    const isCurrentUserUser1 = chat.user1_id === currentUser.profileId;
    const updateData = isCurrentUserUser1 ? { user1_notified: false } : { user2_notified: false };

    const { error: updateError } = await supabase
      .from('direct_chats')
      .update(updateData)
      .eq('id', chatId);

    if (updateError) {
      console.error('알림 해제 오류:', updateError);
      return { success: false, error: '알림을 해제할 수 없습니다.' };
    }

    return { success: true, data: true };
  } catch (error) {
    console.error('clearNewChatNotification 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
}

export async function getInactiveChatList(): Promise<ChatApiResponse<ChatListItem[]>> {
  try {
    const currentUser = await getCurrentUser();

    // 사용자의 비활성화된 채팅방 목록 조회
    // 현재 사용자만 나간 채팅방만 조회 (상대방은 아직 참여 중인 채팅방)
    const { data: chats, error: chatsError } = await supabase
      .from('direct_chats')
      .select('*')
      .or(
        `and(user1_id.eq.${currentUser.profileId},user1_active.eq.false),and(user2_id.eq.${currentUser.profileId},user2_active.eq.false)`,
      )
      .order('last_message_at', { ascending: false });

    if (chatsError) {
      console.error('비활성화된 채팅방 목록 조회 오류:', chatsError);
      return { success: false, error: '채팅방 목록을 불러올 수 없습니다.' };
    }

    if (!chats || chats.length === 0) {
      return { success: true, data: [] };
    }

    // 각 채팅방의 마지막 메시지와 읽지 않은 메시지 수 조회
    const chatListItems: ChatListItem[] = await Promise.all(
      chats.map(async chat => {
        // 상대방 사용자 ID
        const otherUserId = chat.user1_id === currentUser.profileId ? chat.user2_id : chat.user1_id;

        // 상대방 사용자 정보 조회 (profiles 테이블에서)
        let otherUserInfo: ChatUser;
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, nickname, avatar_url')
            .eq('id', otherUserId)
            .single();

          if (profileError || !profileData) {
            // 조회 실패 시 기본값 사용
            otherUserInfo = {
              id: otherUserId,
              email: `user-${otherUserId}@example.com`,
              nickname: `User ${otherUserId.slice(0, 8)}`,
              avatar_url: null,
            };
          } else {
            // 실제 사용자 정보 사용
            otherUserInfo = {
              id: profileData.id,
              email: `user-${profileData.id}@example.com`,
              nickname: profileData.nickname,
              avatar_url: profileData.avatar_url,
            };
          }
        } catch (error) {
          console.error('사용자 정보 조회 오류:', error);
          otherUserInfo = {
            id: otherUserId,
            email: `user-${otherUserId}@example.com`,
            nickname: `User ${otherUserId.slice(0, 8)}`,
            avatar_url: null,
          };
        }

        // 마지막 메시지 조회
        const { data: lastMessage } = await supabase
          .from('direct_messages')
          .select('*, attachments:direct_message_attachments(type)')
          .eq('chat_id', chat.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // 읽지 않은 메시지 수 조회
        const { count: unreadCount } = await supabase
          .from('direct_messages')
          .select('*', { count: 'exact', head: true })
          .eq('chat_id', chat.id)
          .eq('sender_id', otherUserId)
          .eq('is_read', false);

        return {
          id: chat.id,
          other_user: otherUserInfo,
          last_message: lastMessage || null,
          unread_count: unreadCount || 0,
          last_message_at: chat.last_message_at,
        };
      }),
    );

    return { success: true, data: chatListItems };
  } catch (error) {
    console.error('getInactiveChatList 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
}

/**
 * 1:1 채팅방 나가기
 * - 사용자가 특정 채팅방에서 나갈 때 호출
 * - 채팅방을 논리적 삭제 처리 (is_active = false)
 * - 다른 사용자가 아직 채팅방에 있으면 채팅방은 유지됨
 *
 * @param chatId - 나갈 채팅방 ID
 */
export async function exitDirectChat(chatId: string): Promise<ChatApiResponse<boolean>> {
  try {
    const currentUser = await getCurrentUser();

    // 1단계: 채팅방 소유권 확인
    const { data: chat, error: chatError } = await supabase
      .from('direct_chats')
      .select('*')
      .eq('id', chatId)
      .single();

    // 사용자가 채팅방에 참여했는지 확인
    if (
      chat &&
      chat.user1_id !== currentUser.profileId &&
      chat.user2_id !== currentUser.profileId
    ) {
      return { success: false, error: '채팅방에 접근할 수 없습니다.' };
    }

    if (chatError || !chat) {
      console.error('채팅방 조회 오류:', chatError);
      return { success: false, error: '채팅방을 찾을 수 없습니다.' };
    }



    /* [단체 대화방 구현을 위한 예약 코드 - 현재 비활성화]
    // 2단계: 상대방에게 시스템 메시지 전송
    const isCurrentUserUser1 = chat.user1_id === currentUser.profileId;
    const otherUserId = isCurrentUserUser1 ? chat.user2_id : chat.user1_id;

    // 현재 사용자의 닉네임 조회
    let currentUserNickname = '사용자';
    try {
      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('nickname')
        .eq('id', currentUser.profileId)
        .single();

      if (currentUserProfile?.nickname) {
        currentUserNickname = currentUserProfile.nickname;
      }
    } catch (error) {
      // 닉네임 조회 실패 시 기본값 사용
    }

    const systemMessage = `${currentUserNickname}님이 채팅방을 나갔습니다.`;

    // 상대방의 auth.users.id 조회 (시스템 메시지 전송용)
    let otherUserAuthId = null;
    try {
      const { data: otherUserProfile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('id', otherUserId)
        .single();

      if (otherUserProfile?.user_id) {
        otherUserAuthId = otherUserProfile.user_id;
      }
    } catch (error) {
      // 상대방 프로필 조회 실패 시 기본값 사용
    }

    // 시스템 메시지 전송 (상대방의 auth.users.id를 sender_id로 사용)
    const { data: systemMessageData, error: systemMessageError } = await supabase
      .from('direct_messages')
      .insert({
        chat_id: chatId,
        sender_id: otherUserAuthId || currentUser.id, // 상대방의 auth.users.id 사용, 없으면 현재 사용자 ID 사용
        content: systemMessage,
        is_read: false,
        // is_system_message 필드 제거 (테이블에 존재하지 않음)
      })
      .select()
      .single();

    if (systemMessageError) {
      console.error('시스템 메시지 전송 오류:', systemMessageError);
      // 시스템 메시지 실패해도 채팅방 나가기는 계속 진행
    }
    */

    // 3단계: 논리적 삭제 (현재 사용자의 active 상태를 false로 설정하고 나간 시점 기록)
    const currentTime = new Date().toISOString();
    const isCurrentUserUser1 = chat.user1_id === currentUser.profileId; // Define here as previous definition was removed
    const updateData = isCurrentUserUser1
      ? { user1_active: false, user1_left_at: currentTime }
      : { user2_active: false, user2_left_at: currentTime };

    const { error: updateError } = await supabase
      .from('direct_chats')
      .update(updateData)
      .eq('id', chatId);

    if (updateError) {
      console.error('채팅방 비활성화 오류:', updateError);
      return { success: false, error: '채팅방 나가기에 실패했습니다.' };
    }

    // 4단계: 두 사용자가 모두 나갔는지 확인하고 채팅방 완전 삭제
    const { data: updatedChat, error: checkError } = await supabase
      .from('direct_chats')
      .select('user1_active, user2_active')
      .eq('id', chatId)
      .single();

    if (!checkError && updatedChat) {
      // 두 사용자가 모두 나간 경우 (user1_active = false AND user2_active = false)
      if (!updatedChat.user1_active && !updatedChat.user2_active) {
        // 채팅방과 관련된 모든 메시지도 함께 삭제
        const { error: deleteMessagesError } = await supabase
          .from('direct_messages')
          .delete()
          .eq('chat_id', chatId);

        if (deleteMessagesError) {
          console.error('메시지 삭제 오류:', deleteMessagesError);
        }

        // 채팅방 삭제
        const { error: deleteChatError } = await supabase
          .from('direct_chats')
          .delete()
          .eq('id', chatId);

        if (deleteChatError) {
          console.error('채팅방 삭제 오류:', deleteChatError);
        }
      }
    }




    /* [단체 대화방 구현을 위한 예약 코드 - 현재 비활성화]
    // 4단계: 채팅방의 마지막 메시지 시간 업데이트
    const { error: timestampError } = await supabase
      .from('direct_chats')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', chatId);

    if (timestampError) {
      console.error('채팅방 타임스탬프 업데이트 오류:', timestampError);
      // 오류가 있어도 성공으로 처리
    }
    */

    return { success: true, data: true };
  } catch (error) {
    console.error('exitDirectChat 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
}

/**
 * 1:1 채팅방 복구 (재참여)
 * - 사용자가 나간 채팅방을 다시 활성화
 * - is_active를 true로 변경하여 채팅방 목록에 다시 표시
 *
 * @param chatId - 복구할 채팅방 ID
 */
export async function restoreDirectChat(chatId: string): Promise<ChatApiResponse<boolean>> {
  try {
    const currentUser = await getCurrentUser();

    // 1단계: 채팅방 소유권 확인
    const { data: chat, error: chatError } = await supabase
      .from('direct_chats')
      .select('*')
      .eq('id', chatId)
      .single();

    // 사용자가 채팅방에 참여했는지 확인
    if (
      chat &&
      chat.user1_id !== currentUser.profileId &&
      chat.user2_id !== currentUser.profileId
    ) {
      return { success: false, error: '채팅방에 접근할 수 없습니다.' };
    }

    if (chatError || !chat) {
      console.error('채팅방 조회 오류:', chatError);
      return { success: false, error: '채팅방을 찾을 수 없습니다.' };
    }

    // 2단계: 채팅방 재활성화 (현재 사용자의 active 상태를 true로 설정)
    const isCurrentUserUser1 = chat.user1_id === currentUser.profileId;
    const updateData = isCurrentUserUser1 ? { user1_active: true } : { user2_active: true };

    const { error: updateError } = await supabase
      .from('direct_chats')
      .update(updateData)
      .eq('id', chatId);

    if (updateError) {
      console.error('채팅방 재활성화 오류:', updateError);
      return { success: false, error: '채팅방 복구에 실패했습니다.' };
    }

    return { success: true, data: true };
  } catch (error) {
    console.error('restoreDirectChat 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
}

/**
 * 채팅방 내부 메시지 검색 (전체 내역)
 * - 특정 채팅방 내에서 검색어와 일치하는 메시지를 찾음
 * - 최신순 정렬
 */
export async function searchMessagesInChat(
  chatId: string,
  query: string,
): Promise<ChatApiResponse<DirectMessage[]>> {
  try {
    if (!query.trim()) {
      return { success: true, data: [] };
    }

    const { data: messages, error } = await supabase
      .from('direct_messages')
      .select('id, content, created_at, sender_id')
      .eq('chat_id', chatId)
      .ilike('content', `%${query}%`)
      .order('created_at', { ascending: false }) // 최신순 (화면에서 위아래 이동 시 편의상)
      .limit(50); // 너무 많이 가져오면 곤란하니 50개 제한

    if (error) {
      console.error('채팅방 내 메시지 검색 오류:', error);
      return { success: false, error: '메시지 검색 중 오류가 발생했습니다.' };
    }

    // 간단한 데이터 매핑 (필요한 필드만)
    const result: DirectMessage[] = messages.map((msg: any) => ({
      id: msg.id,
      chat_id: chatId,
      sender_id: msg.sender_id,
      content: msg.content,
      created_at: msg.created_at,
      is_read: true,
      is_system_message: false,
      read_at: undefined,
      sender: undefined, // 렌더링 시 보완되거나 필요한 곳에서만 쓰임
    }));

    return { success: true, data: result };
  } catch (error) {
    console.error('searchMessagesInChat 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
}

/**
 * 채팅방의 모든 미디어(이미지) 메시지 조회
 * - 미디어 갤러리에서 사용
 * @param chatId - 채팅방 ID
 */
export async function getMediaInChat(
  chatId: string,
): Promise<ChatApiResponse<DirectMessage[]>> {
  try {
    const currentUser = await getCurrentUser();

    // 채팅방 정보 조회 (사용자가 나간 시점 확인)
    const { data: chatInfo, error: chatError } = await supabase
      .from('direct_chats')
      .select('user1_id, user2_id, user1_left_at, user2_left_at')
      .eq('id', chatId)
      .single();

    if (chatError || !chatInfo) {
      console.error('채팅방 정보 조회 오류:', chatError);
      return { success: false, error: '채팅방을 찾을 수 없습니다.' };
    }

    // 현재 사용자가 나간 시점 확인
    const isCurrentUserUser1 = chatInfo.user1_id === currentUser.profileId;
    const userLeftAt = isCurrentUserUser1 ? chatInfo.user1_left_at : chatInfo.user2_left_at;

    // 미디어가 있는 메시지만 조회
    const { data: rawMessages, error } = await supabase
      .from('direct_messages')
      .select(`
        id,
        chat_id,
        sender_id,
        content,
        created_at,
        is_read,
        read_at,
        attachments:direct_message_attachments (
          id,
          type,
          url,
          width,
          height
        )
      `)
      .eq('chat_id', chatId)
      .gte('created_at', userLeftAt || '1970-01-01')
      .order('created_at', { ascending: false });



    if (error) {
      console.error('미디어 메시지 조회 오류:', error);
      return { success: false, error: '미디어를 불러올 수 없습니다.' };
    }

    // attachments가 실제로 있는 메시지만 필터링
    const messagesWithMedia = (rawMessages || []).filter(
      msg => msg.attachments && msg.attachments.length > 0,
    );

    if (messagesWithMedia.length === 0) {
      return { success: true, data: [] };
    }

    // 발신자 정보 일괄 조회 (Batch Fetching)
    const senderIds = Array.from(new Set(messagesWithMedia.map(m => m.sender_id)));

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, nickname, avatar_url, user_id')
      .in('user_id', senderIds);

    const profileMap = new Map<string, ChatUser>();

    if (profiles) {
      profiles.forEach(p => {
        profileMap.set(p.user_id, {
          id: p.id,
          email: `user-${p.id}@example.com`,
          nickname: p.nickname,
          avatar_url: p.avatar_url,
        });
      });
    }

    // 데이터 변환
    const messages: DirectMessage[] = messagesWithMedia.map(msg => {
      let senderInfo = profileMap.get(msg.sender_id);

      if (!senderInfo) {
        senderInfo = {
          id: msg.sender_id,
          email: `user-${msg.sender_id}@example.com`,
          nickname: '알 수 없음',
          avatar_url: null,
        };
      }

      return {
        id: msg.id,
        chat_id: msg.chat_id,
        sender_id: msg.sender_id,
        content: msg.content,
        created_at: msg.created_at,
        is_read: msg.is_read,
        read_at: msg.read_at,
        sender: senderInfo,
        attachments: msg.attachments || [],
      };
    });

    return { success: true, data: messages };
  } catch (err) {
    console.error('미디어 조회 중 오류:', err);
    return { success: false, error: '미디어 조회 중 오류가 발생했습니다.' };
  }
}

