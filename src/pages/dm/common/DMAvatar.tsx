import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

// 아바타+배지(읽지않음)
type Props = {
  name: string;
  src?: string;
  size?: number; // px
  unread?: number;
};

const DMAvatar: React.FC<Props> = ({ name, src, size = 50, unread = 0 }) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('nickname', name)
        .single();

      if (error) {
        console.log('프로필 정보 가져오기 실패', error);
      } else {
        setAvatarUrl(data?.avatar_url ?? null);
      }
    };
    fetchProfile();
  }, [name]);

  return (
    <div className="relative mr-4">
      <img
        src={
          src ??
          avatarUrl ??
          `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`
        }
        alt={name}
        // 확인용 임시 테두리 / 테스트 후 지우기
        className="rounded-full object-cover border-2 border-[#f0f0f0]"
        style={{ width: size, height: size }}
      />
      {unread > 0 && (
        <div className="absolute -top-[2px] -right-[2px] bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[12px] font-semibold">
          {unread}
        </div>
      )}
    </div>
  );
};

export default DMAvatar;
