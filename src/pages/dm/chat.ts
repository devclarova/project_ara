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

export const mockChats: Chat[] = [
  {
    id: 1,
    name: '재현님',
    lastMessage: '죄송합니다........',
    time: '오후 2:30',
    unread: 2,
    avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=재현님`,
  },
  {
    id: 2,
    name: '수하님',
    lastMessage: '집가요~~',
    time: '오전 11:15',
    unread: 0,
    avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=수하님`,
  },
  {
    id: 3,
    name: '아악',
    lastMessage: '자고싶어요',
    time: '오후 12:25',
    unread: 1,
    avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=아악`,
  },
  {
    id: 4,
    name: 'aaa',
    lastMessage: 'Hello',
    time: '오전 09:05',
    unread: 0,
    avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=aaa`,
  },
];
