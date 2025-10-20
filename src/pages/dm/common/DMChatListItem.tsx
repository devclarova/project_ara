// 개별채팅

import React, { useCallback, useEffect, useState } from 'react';
import DMAvatar from './DMAvatar';
import DMContextMenu, { type ContextMenuItem } from './DMContextMenu';
import { supabase } from '../../../lib/supabase';
import type { Chat } from '../../../types/dm';

type Props = {
  chat: Chat;
  selected?: boolean;
  onClick?: (id: string) => void;
  className?: string;
  // 우클릭 메뉴 액션 콜백들
  onTogglePin?: (chatId: string, nextPinned: boolean) => void;
  onToggleAlarm?: (chatId: string, nextAlarmOn: boolean) => void; // mute/unmute
  onMarkAsRead?: (chatId: string) => void;
  onDelete?: (chatId: string) => void;
};

const DMChatListItem: React.FC<Props> = ({
  chat,
  selected = false,
  onClick,
  className = '',
  onTogglePin,
  onToggleAlarm,
  onMarkAsRead,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null); // 상대방 아바타 URL
  const [nickname, setNickname] = useState<string>(''); // 상대방 닉네임

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setMenuOpen(true);
  }, []);

  const items: ContextMenuItem[] = [
    {
      key: 'pin',
      label: chat.pinned ? '상단 고정 해제' : '상단에 고정',
      onSelect: () => onTogglePin?.(chat.id, !chat.pinned),
      shortcut: 'P',
    },
    {
      key: 'alarm',
      label: chat.alarmOff ? '알림 켜기' : '알림 끄기',
      onSelect: () =>
        onToggleAlarm?.(chat.id, !!chat.alarmOff ? true /* turn on */ : false /* turn off */),
      shortcut: 'M',
    },
    {
      key: 'read',
      label: '읽음 처리',
      onSelect: () => onMarkAsRead?.(chat.id),
      shortcut: 'R',
    },
    {
      key: 'delete',
      label: '대화 삭제…',
      danger: true,
      onSelect: () => onDelete?.(chat.id),
    },
  ];

  // 채팅방 사용자 정보 불러오기 (닉네임, 아바타)
  useEffect(() => {
    const fetchChatUserInfo = async () => {
      // 채팅방 참여자 ID로 상대방 프로필을 불러옵니다.
      const userId = chat.user1_id === 'me' ? chat.user2_id : chat.user1_id;

      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url, nickname')
        .eq('id', userId)
        .single(); // 프로필 정보 가져오기

      if (error) {
        console.log('사용자 프로필 정보 불러오기 실패', error);
      } else {
        setAvatarUrl(data?.avatar_url ?? null); // 아바타 URL 설정
        setNickname(data?.nickname ?? ''); // 닉네임 설정
      }
    };

    fetchChatUserInfo(); // 채팅방이 변경될 때마다 호출
  }, [chat]); // `chat`이 바뀔 때마다 실행

  return (
    <>
      <button
        type="button"
        aria-selected={selected}
        data-selected={selected}
        onClick={() => onClick?.(chat.id)}
        onContextMenu={handleContextMenu}
        className={[
          'w-full text-left outline-none',
          'flex items-center py-[18px] px-5 cursor-pointer border-b border-[#f5f5f5]',
          'transition-all duration-200 ease-in-out bg-white hover:bg-[#f7f7f7]',
          // selected state (data-variant)
          'data-[selected=true]:bg-[#00BFA5] data-[selected=true]:bg-opacity-15 data-[selected=true]:border-r-4 data-[selected=true]:border-primary',
          className,
        ].join(' ')}
      >
        <DMAvatar name={chat.name} src={chat.avatarUrl} unread={chat.unread ?? 0} />

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1">
            <div className="font-semibold text-[#333] text-sm">{chat.name}</div>
            <div className="text-xs text-[#666]">{chat.time}</div>
          </div>

          <div className="text-[13px] text-[#666] whitespace-nowrap overflow-hidden text-ellipsis">
            {chat.lastMessage ? (
              <span
                className={(chat.unread ?? 0) > 0 ? 'font-semibold text-[#333]' : 'text-[#666]'}
              >
                {chat.lastMessage}
              </span>
            ) : (
              <span className="italic text-[#999]">메시지가 없습니다.</span>
            )}
          </div>
        </div>
      </button>
      {/* 우클릭 메뉴 (컨텍스트 메뉴) */}
      {menuOpen && (
        <DMContextMenu
          open={menuOpen}
          x={menuPos.x}
          y={menuPos.y}
          onClose={() => setMenuOpen(false)}
          items={items}
        />
      )}
    </>
  );
};

export default DMChatListItem;
