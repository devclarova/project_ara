// 1 : 1 채팅을 위한 타입

import type { Profile } from './database';

// chats (1:1 대화방)
export interface Chat {
  id: string; // 고유 ID (UUID)
  user1_id: string; // 사용자 1 ID
  user2_id: string; // 사용자 2 ID
  user1: Profile; // 사용자 1 정보
  user2: Profile; // 사용자 2 정보
  lastMessage: string; // 마지막 메시지 내용
  time?: string; // 마지막 메시지 시간 (옵션)
  unread?: number; // 읽지 않은 메시지 수 (옵션)
  avatar_url?: string; // 프로필 이미지 URL (옵션)
  pinned?: boolean; // 고정 여부 (옵션)
  alarm?: boolean; // 알림 여부 (옵션)
  lastUpdated: string; // 최근 업데이트 시간 (ISO 형식)
  participantIds: string[]; // 참여자 ID 목록
  created_at: string; // 생성 시간
  updated_at: string; // 마지막 업데이트 시간
}

// messages (메시지)
export interface Message {
  id: string; // 메시지 고유 ID (UUID)
  chat_id: string; // 채팅방 ID
  auth_id: string; // 사용자 인증 ID
  sender_id: string; // 보낸 사람 ID
  type: 'text' | 'image' | 'file' | 'system'; // 메시지 유형
  content?: string; // 메시지 내용 (텍스트 메시지일 경우)
  translated_text?: string; // 번역된 메시지 (옵션)
  translated_lang?: string; // 번역된 언어 코드 (옵션)
  created_at: string; // 메시지 생성 시간
}

// message_files (첨부파일)
export interface MessageFile {
  id: string; // 파일 ID (UUID)
  message_id: string; // 메시지 ID
  file_url: string; // 파일 URL
  file_type?: string; // 파일 MIME 타입 (옵션)
  file_name?: string; // 파일 이름 (옵션)
  file_size?: number; // 파일 크기 (옵션)
  width?: number; // 이미지 너비 (옵션)
  height?: number; // 이미지 높이 (옵션)
  created_at: string; // 생성 시간
}

// message_receipts (읽음 표시)
export interface MessageReceipt {
  message_id: string; // 메시지 ID
  user_id: string; // 사용자 ID
  read_at: string; // 읽음 시간
}

// user_blocks (차단)
export interface UserBlock {
  id: string; // 차단 ID (UUID)
  blocker_id: string; // 차단한 사용자 ID
  blocked_id: string; // 차단된 사용자 ID
  created_at: string; // 생성 시간
}

// user_reports (신고)
export interface UserReport {
  id: string; // 신고 ID (UUID)
  reporter_id: string; // 신고자 ID
  reported_id: string; // 신고된 사용자 ID
  reason?: string; // 신고 이유 (옵션)
  created_at: string; // 신고 시간
}

// chat_user_state (개인별 방 상태)
export interface ChatUserState {
  chat_id: string; // 채팅방 ID
  user_id: string; // 사용자 ID
  left_at?: string; // 나간 시간 (옵션)
  is_archived: boolean; // 보관 여부
  is_pinned: boolean; // 고정 여부
  muted_until?: string; // 뮤트 종료 시간 (옵션)
  updated_at: string; // 마지막 업데이트 시간
}
