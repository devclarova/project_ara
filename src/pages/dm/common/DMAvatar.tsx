// 아바타+배지
// - Supabase에서 userId에 해당하는 프로필(닉네임, 아바타)을 불러옴
// - 아바타 이미지를 표시하고, 읽지 않은 메시지(unread)가 있으면 빨간 배지 표시
// - 아바타가 없을 경우 Dicebear(랜덤 캐릭터 생성기) 이미지로 대체

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

// Props 정의
// userId: 프로필을 가져올 대상 ID
// size: 아바타 크기 (기본값 50px)
// unread: 읽지 않은 메시지 개수 (배지 표시용)
type Props = {
  userId: string;
  size?: number;
  unread?: number;
};

const DMAvatar: React.FC<Props> = ({ userId, size = 50, unread = 0 }) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string>('');

  /**
   * useEffect — 유저 정보(fetch) 로직
   * userId가 바뀔 때마다 Supabase에서 해당 프로필을 가저옴
   * 데이터가 없거나 오류가 나면 기본 이미지 '/default-avatar.svg' 를 사용
   */
  useEffect(() => {
    if (!userId) return;

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url, nickname')
          .eq('id', userId)
          .maybeSingle();

        if (error) throw error;

        setAvatarUrl(data?.avatar_url ?? null);
        setNickname(data?.nickname ?? '');
      } catch (err) {
        console.error('[DMAvatar] 프로필 로드 실패:', err);
        setAvatarUrl(null);
        setNickname('');
      }
    };

    fetchProfile();
  }, [userId]);

  return (
    <div className="relative mr-4">
      {/* 아바타 이미지 */}
      <img
        src={avatarUrl || '/default-avatar.svg'}
        alt={nickname || userId}
        className="rounded-full object-cover border-2 border-gray-100"
        style={{ width: size, height: size }}
      />

      {/* 🔴 읽지 않은 메시지 배지 */}
      {unread > 0 && (
        <div
          className="
            absolute -top-[2px] -right-[2px]
            bg-red-500 text-white rounded-full
            w-5 h-5 flex items-center justify-center
            text-[12px] font-semibold
            shadow-sm
          "
        >
          {unread}
        </div>
      )}
    </div>
  );
};

export default DMAvatar;
