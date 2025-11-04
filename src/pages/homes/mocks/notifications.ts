// src/mocks/notifications.ts
export type NotificationType = 'like' | 'comment' | 'repost' | 'mention' | 'follow';

export const mockNotifications: {
  id: string;
  type: NotificationType; // 유니언 타입으로 제한
  user: {
    name: string;
    username: string;
    avatar: string;
  };
  action: string;
  content: string | null;
  timestamp: string;
  isRead: boolean;
  tweetId: string | null;
}[] = [
  {
    id: '1',
    type: 'like',
    user: {
      name: '수하',
      username: 'suha20',
      avatar: '/default-avatar.svg',
    },
    action: '님이 회원님의 글을 좋아합니다',
    content: '샘플 게시글입니다.',
    timestamp: '2시간 전',
    isRead: false,
    tweetId: 'abc123',
  },
  {
    id: '2',
    type: 'comment',
    user: {
      name: '알렉스',
      username: 'alex123',
      avatar: '/default-avatar.svg',
    },
    action: '님이 회원님의 글에 댓글을 남겼습니다',
    content: '좋은 글이네요!',
    timestamp: '3시간 전',
    isRead: true,
    tweetId: 'def456',
  },
  {
    id: '3',
    type: 'mention',
    user: {
      name: '지민',
      username: 'jimin_k',
      avatar: '/default-avatar.svg',
    },
    action: '님이 회원님을 멘션했습니다',
    content: '@suha20 이 부분 정말 공감돼요!',
    timestamp: '5시간 전',
    isRead: false,
    tweetId: 'ghi789',
  },
  {
    id: '4',
    type: 'follow',
    user: {
      name: '민지',
      username: 'minji_02',
      avatar: '/default-avatar.svg',
    },
    action: '님이 회원님을 팔로우하기 시작했습니다',
    content: null,
    timestamp: '1일 전',
    isRead: true,
    tweetId: null,
  },
  {
    id: '5',
    type: 'repost',
    user: {
      name: '테오',
      username: 'taeoh_dev',
      avatar: '/default-avatar.svg',
    },
    action: '님이 회원님의 글을 리포스트했습니다',
    content: '프론트엔드 공부법에 대한 좋은 글이에요!',
    timestamp: '2일 전',
    isRead: false,
    tweetId: 'xyz321',
  },
];
