// 채팅 목록
// - 전달받은 chats 배열을 기반으로 채팅 목록을 렌더링
// - chats가 비어 있으면 "빈 상태 안내"를 표시
// - 각 채팅 항목은 DMChatListItem 컴포넌트로 렌더링

import type { ReactNode } from 'react';
import type { Chat } from '../../../types/dm';
import DMChatListItem from './DMChatListItem';

type Props = {
  chats: Chat[]; // 채팅 목록 데이터
  selectedChatId: string | null; // 현재 선택된 채팅방 ID
  onSelect: (id: string) => void; // 채팅방 클릭 시 실행되는 콜백
  emptyNode?: ReactNode; // 채팅이 없을 때 대신 표시할 노드(선택적)
};

const DMChatList = ({ chats, selectedChatId, onSelect, emptyNode }: Props) => {
  /**
   * 채팅방이 하나도 없는 경우
   * - 안내 메시지를 보여주거나, 상위에서 전달된 `emptyNode`를 대신 렌더링
   */
  if (chats.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-gray-600">
        {emptyNode ?? (
          <>
            <p className="font-semibold text-gray-700">아직 채팅방이 없습니다.</p>
            <p className="text-sm text-gray-500 mt-1">새 채팅 버튼을 눌러 대화를 시작하세요!</p>
          </>
        )}
      </div>
    );
  }

  /**
   * 채팅 목록이 있는 경우
   * - 각 채팅방 정보를 DMChatListItem으로 전달
   * - 선택된 방(selectedChatId)은 시각적으로 강조
   */
  return (
    <div className="flex-1 overflow-y-auto max-h-full divide-y divide-gray-100">
      {chats.map(chat => (
        <DMChatListItem
          key={chat.id}
          chat={chat}
          selected={selectedChatId === chat.id} // 현재 선택된 채팅 강조 표시
          onClick={() => onSelect(chat.id)} // 클릭 시 상위로 chat.id 전달
        />
      ))}
    </div>
  );
};

export default DMChatList;
