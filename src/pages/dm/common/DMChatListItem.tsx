// 개별채팅

import React, { useCallback, useState } from 'react';
import type { Chat } from '../../../types/dm';
import DMAvatar from './DMAvatar';
import DMContextMenu, { type ContextMenuItem } from './DMContextMenu';

type Props = {
  chat: Chat;
  selected?: boolean;
  onClick?: (id: number) => void;
  className?: string;
  // 우클릭 메뉴 액션 콜백들
  onTogglePin?: (chatId: number, nextPinned: boolean) => void;
  onToggleAlarm?: (chatId: number, nextAlarmOn: boolean) => void; // mute/unmute
  onMarkAsRead?: (chatId: number) => void;
  onDelete?: (chatId: number) => void;
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
