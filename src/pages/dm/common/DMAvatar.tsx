// 아바타+배지(읽지않음)

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

type Props = { userId: string; size?: number; unread?: number };
const DMAvatar: React.FC<Props> = ({ userId, size = 50, unread = 0 }) => {
  const [src, setSrc] = useState<string | null>(null);
  const [name, setName] = useState<string>('');

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url, nickname')
        .eq('id', userId)
        .maybeSingle();
      setSrc(data?.avatar_url ?? null);
      setName(data?.nickname ?? '');
    })();
  }, [userId]);

  const fallback = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name || userId)}`;
  return (
    <div className="relative mr-4">
      <img
        src={src || fallback}
        alt={name || userId}
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
