import type { Chat, Message } from '../../types/dm';

export async function fetchMessages(chat_id: string): Promise<Message[]> {
  // TODO: API 연결
  return [
    {
      id: 'm1',
      chat_id,
      author_id: 'me',
      author_name: '나',
      content: '안녕!',
      created_at: new Date().toISOString(),
      isMe: true,
    },
    {
      id: 'm2',
      chat_id,
      author_id: 'u1',
      author_name: '상대',
      content: 'ㅎㅇ',
      created_at: new Date().toISOString(),
    },
  ];
}

export async function sendMessage(chat_id: string, text: string): Promise<Message> {
  // TODO: API 연결
  return {
    id: crypto.randomUUID(),
    chat_id,
    author_id: 'me',
    author_name: '나',
    content: text,
    created_at: new Date().toISOString(),
    isMe: true,
  };
}

export const mockChatData: Chat = {
  id: 1, // 고유 ID (string)
  name: '재현님', // 상대 이름
  lastMessage: '죄송합니다........', // 마지막 메시지 내용
  time: '오후 2:30', // 마지막 메시지 시각
  unread: 2, // 읽지 않은 메시지 수
  avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=재현님`, // 아바타 URL
  pinned: false, // 상단 고정 여부
  alarmOff: false, // 알림 끄기 여부
  lastUpdated: '2025-10-20 14:30', // 최근 대화 여부 (ISO string)
  participantIds: ['user1', 'user2'], // 참여자 ID 목록 (1:1 채팅이면 두 개, 그룹이면 여러 개)
  user1_id: 'user1', // 채팅방 참여자 1 ID
  user2_id: 'user2', // 채팅방 참여자 2 ID
  created_at: '2025-10-19 10:00', // 채팅방 생성 시간 (ISO string)
  updated_at: '2025-10-20 14:30', // 마지막 업데이트 시간 (ISO string)
};
