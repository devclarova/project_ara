// 1 : 1 채팅을 위한 타입

// 채팅 사용자 정보
export interface ChatUser {
  id: string; // 사용자 고유 식별자 (UUID)
  email: string; // 사용자 이메일 주소
  nickname: string; // 표시용 닉네임
  avatar_url?: string | null; // 프로필 이미지 URL (선택)
}

// 채팅 정보

export interface Chat {
  id: string; // 고유 ID
  name: string; // 상대 이름 또는 그룹명
  lastMessage?: string; // 마지막 메시지 내용 (없을 수도 있음)
  time?: string; // 마지막 메시지 시각
  unread?: number; // 읽지 않은 메시지 수
  avatarUrl?: string; // 프로필 이미지 URL
  pinned?: boolean; // 상단 고정 여부 (핀)
  alarmOff?: boolean; // 알림 끔 여부 (true면 mute 상태)
  lastUpdated?: string; // 최근 대화 여부 (정렬 시 사용 가능) ISO string 또는 "YYYY-MM-DD HH:mm"
  participantIds?: string[]; // 참여자 ID 목록 (1:1이면 두 개, 그룹이면 여러 개)
  isTempUpdated?: boolean; // 고정/읽음 등 상태 갱신용 로컬 플래그
  user1_id: string; // 채팅방 참여자 1 ID
  user2_id: string; // 채팅방 참여자 2 ID
  created_at: string; // 생성 시간 (ISO string 또는 "YYYY-MM-DD HH:mm")
  updated_at: string; // 마지막 업데이트 시간 (ISO string 또는 "YYYY-MM-DD HH:mm")
}

// 메시지 타입
export interface Message {
  id: string; // 메시지 고유 식별자
  chat_id: string; // 채팅방 ID
  author_id: string; // 'me' 또는 상대 id
  author_name: string;
  content: string; // 메시지 내용
  created_at: string; // 전송 시간
  isMe?: boolean;
}

// 메시지의 상세 추가 확장 정보
export interface MessageDetail extends Message {
  sender: ChatUser;
}

// 채팅방 목록 타입
export interface ChatListItem {
  id: string; // 채팅방 ID
  name: string; // 채팅방 이름
  last_message?: {
    // 마지막 메시지 정보(선택사항)
    content: string; // 내용
    created_at: string; // 작성시간
    sender_nickname: string; // 보낸사람 닉네임
  };
  other_user: ChatUser; // 상대방 사용자 정보
  unread_count: number; // 읽지 않은 메시지 수
  updated_at: string; // 마지막 업데이트 시간
}

// 채팅방 생성용
export interface CreateChatData {
  name: string; // 채팅방 이름
  participant_id: string; // 참여자 ID
}

// 메시지 전송용
export interface CreateMessageData {
  chat_id: string; // 채팅방 ID
  content: string; // 메시지 내용
}

// API 응답 래퍼
export interface ChatApiResponse<T> {
  success: boolean; // 성공 여부
  data?: T; // 응답 데이터 (제네릭타입-선택적)
  error?: string; // 에러메시지 (실패시-선택적)
}
