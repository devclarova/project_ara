// 개별채팅

import React from 'react';
import type { Chat } from '../../../types/dm';
import DMAvatar from './DMAvatar';

type Props = {
  chat: Chat;
  selected?: boolean;
  onClick?: (id: number) => void;
  className?: string;
};

const DMChatListItem: React.FC<Props> = ({ chat, selected = false, onClick, className = '' }) => {
  return (
    <button
      type="button"
      aria-selected={selected}
      data-selected={selected}
      onClick={() => onClick?.(chat.id)}
      className={[
        'w-full text-left outline-none',
        'flex items-center py-[18px] px-5 cursor-pointer border-b border-[#f5f5f5]',
        'transition-all duration-200 ease-in-out bg-white hover:bg-[#f7f7f7]',
        // selected state (data-variant)
        'data-[selected=true]:bg-[#00BFA5] data-[selected=true]:bg-opacity-15',
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
            <span className={(chat.unread ?? 0) > 0 ? 'font-semibold text-[#333]' : 'text-[#666]'}>
              {chat.lastMessage}
            </span>
          ) : (
            <span className="italic text-[#999]">메시지가 없습니다.</span>
          )}
        </div>
      </div>
    </button>
  );
};

export default DMChatListItem;
