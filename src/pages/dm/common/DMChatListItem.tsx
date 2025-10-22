// 개별채팅

import React, { useCallback, useEffect, useState } from 'react';
import DMAvatar from './DMAvatar';
import DMContextMenu, { type ContextMenuItem } from './DMContextMenu';
import { supabase } from '../../../lib/supabase';
import type { Chat } from '../../../types/dm';
import { useAuth } from '../../../contexts/AuthContext';

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
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 상대방 프로필 상태
  const [otherAvatar, setOtherAvatar] = useState<string | null>(null);
  const [otherNickname, setOtherNickname] = useState<string>('');
  const otherUserId = chat.user1_id === user?.id ? chat.user2_id : chat.user1_id;

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setMenuOpen(true);
  }, []);

  // 컨텍스트 메뉴
  const items: ContextMenuItem[] = [
    {
      key: 'pin',
      label: chat.pinned ? '상단 고정 해제' : '상단에 고정',
      onSelect: () => onTogglePin?.(chat.id, !chat.pinned),
      shortcut: 'P',
    },
    {
      key: 'alarm',
      label: chat.alarm ? '알림 끄기' : '알림 켜기',
      onSelect: () => onToggleAlarm?.(chat.id, !chat.alarm),
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
    if (!otherUserId) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_url')
        .eq('id', otherUserId)
        .maybeSingle();
      setOtherAvatar(data?.avatar_url ?? null);
      setOtherNickname(data?.nickname ?? '');
    })();
  }, [otherUserId]);

  // lastMessage 필드 이름 통일 (로그가 lastmessage면 여기서 변환해 사용)
  const lastMessage = (chat as any).lastMessage ?? (chat as any).lastmessage ?? null;

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
        {/* DMAvatar에는 바로 otherAvatar를 넘기고, 불가하면 내부 fallback */}
        <DMAvatar userId={otherUserId} unread={chat.unread ?? 0} />

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1">
            <div className="font-semibold text-[#333] text-sm">{otherNickname || '알 수 없음'}</div>
            <div className="text-xs text-[#666]">{chat.time}</div>
          </div>

          <div className="text-[13px] text-[#666] whitespace-nowrap overflow-hidden text-ellipsis">
            {lastMessage ? (
              <span
                className={(chat.unread ?? 0) > 0 ? 'font-semibold text-[#333]' : 'text-[#666]'}
              >
                {lastMessage}
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
