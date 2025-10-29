import type { ProfileData } from '@/types/profile';

export function toProfileData(raw: any, prev: ProfileData): ProfileData {
  if (!raw) return prev;

  const joined = raw?.created_at
    ? new Date(raw.created_at).toISOString().slice(0, 7).replace('-', '.')
    : prev.joined;

  const handle =
    raw?.nickname_normalized ??
    (raw?.nickname ? String(raw.nickname).replace(/\s+/g, '').toLowerCase() : prev.handle);

  return {
    ...prev, // prev 값 유지(coverUrl/follow/following 등)
    nickname: raw?.nickname ?? prev.nickname,
    handle,
    bio: raw?.bio ?? prev.bio,
    location: raw?.country ?? prev.location,
    joined,
    birth: raw?.birthday ?? prev.birth,
    avatarUrl: raw?.avatar_url ?? prev.avatarUrl,
  };
}

// 비로그인/초기 표시용
export const defaultProfile: ProfileData = {
  nickname: '닉네임',
  handle: 'user',
  bio: '',
  location: '',
  joined: '',
  birth: '',
  followingCount: 0,
  followerCount: 0,
  coverUrl: '',
  avatarUrl: '/default-avatar.svg',
};
