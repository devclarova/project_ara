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
  id: number;
  name: string;
  lastMessage?: string;
  time?: string;
  unread?: number;
  avatarUrl?: string;
}

// export interface Chat {
//   id: string; // 채팅방 고유 식별자
//   name: string; // 채팅방 이름
//   type: 'direct'; // 채팅방 타입 (direct | group) : 현재는 1:1 만 지원
//   created_by: string; // 채팅방 생성한 유저의 ID
//   created_at: string; // 생성시간
//   updated_at: string; // 마지막 업데이트 시간
// }

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
