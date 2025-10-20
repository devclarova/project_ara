// 메시지 목록(날짜 구분/연속 메시지 묶기/읽음표시)

import { useEffect, useRef } from 'react';
import type { Message } from '../../../types/dm';
import MessageItem from './MessageItem';

type Props = {
  messages: Message[];
  /** 'never' | 'onSend' | 'always' */
  autoScrollMode?: 'never' | 'onSend' | 'always';
  /** 내가 방금 보냈다면 true */
  justSent?: boolean;
};

function sameMinute(a: Date, b: Date) {
  return a.getHours() === b.getHours() && a.getMinutes() === b.getMinutes();
}
function sameDate(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function authorKey(m: Message) {
  // isMe가 있으면 그걸 우선, 없으면 author_id로 구분
  return m.isMe !== undefined ? String(m.isMe) : String(m.author_id);
}

function MessageList({ messages, autoScrollMode = 'onSend', justSent = false }: Props) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // 자동 스크롤
  useEffect(() => {
    if (autoScrollMode === 'always' || (autoScrollMode === 'onSend' && justSent)) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScrollMode, justSent]);

  // 날짜를 최상단에 고정하려면 메시지 배열의 첫 번째 요소로 날짜를 미리 설정
  const messageDate = new Date(messages[0]?.created_at);
  const showDate = true; // 날짜는 항상 맨 위에 보여줘야 하므로 항상 true로 설정

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-white">
      {/* 날짜 표시 */}
      {showDate && (
        <div className="relative text-center text-gray-500 my-2 text-sm px-2 w-full">
          <span className="absolute top-[10px] left-0 right-0 border-t-2 border-gray-300 w-1/3"></span>
          <span className="absolute top-[10px] left-auto right-0 border-t-2 border-gray-300 w-1/3"></span>
          {messageDate.toLocaleDateString()}
        </div>
      )}
      {/* 메시지 목록 */}
      {messages.map((m, i) => {
        const nextMsg = messages[i + 1];
        const current = new Date(m.created_at);
        // 같은 사람의 연속 메시지면서 같은 분이면 숨기고, 작성자가 바뀌거나(내→상대/상대→내), 분이 바뀌거나, 마지막 메시지면 표시
        const showTime =
          !nextMsg ||
          authorKey(m) !== authorKey(nextMsg) ||
          !sameMinute(current, new Date(nextMsg.created_at));

        return (
          <div key={m.id}>
            <MessageItem key={m.id} msg={m} showTime={showTime} />
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

export default MessageList;
