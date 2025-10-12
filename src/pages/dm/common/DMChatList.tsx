// 채팅 목록

import type { ReactNode } from 'react';
import type { Chat } from '../../../types/dm';
import DMChatListItem from './DMChatListItem';

type Props = {
  chats: Chat[];
  selectedChatId: number | null;
  onSelect: (id: number) => void;
  emptyNode?: ReactNode;
};

const DMChatList = ({ chats, selectedChatId, onSelect, emptyNode }: Props) => {
  if (chats.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-[#666]">
        {emptyNode ?? (
          <>
            <p>아직 채팅방이 없습니다.</p>
            <p>새 채팅 버튼을 눌러 대화를 시작하세요!</p>
          </>
        )}
      </div>
    );
  }
  return (
    <div className="flex-1 overflow-y-auto">
      {chats.map(c => (
        <DMChatListItem key={c.id} chat={c} selected={selectedChatId === c.id} onClick={onSelect} />
      ))}
    </div>
  );
};

export default DMChatList;
