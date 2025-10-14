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

function authorKey(m: Message) {
  // isMe가 있으면 그걸 우선, 없으면 author_id로 구분
  return m.isMe !== undefined ? String(m.isMe) : String(m.author_id);
}

function MessageList({ messages, autoScrollMode = 'onSend', justSent = false }: Props) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // 자동 스크롤
  useEffect(() => {
    if (autoScrollMode === 'always') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (autoScrollMode === 'onSend' && justSent) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    // 'never'면 아무것도 하지 않음
  }, [messages, autoScrollMode, justSent]);

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-white">
      {messages.map((m, i) => {
        const nextMsg = messages[i + 1];
        const current = new Date(m.created_at);

        // 같은 사람의 연속 메시지면서 같은 분이면 숨기고,
        // 작성자가 바뀌거나(내→상대/상대→내), 분이 바뀌거나, 마지막 메시지면 표시
        const showTime =
          !nextMsg ||
          authorKey(m) !== authorKey(nextMsg) ||
          !sameMinute(current, new Date(nextMsg.created_at));

        return <MessageItem key={m.id} msg={m} showTime={showTime} />;
      })}
      <div ref={bottomRef} />
    </div>
  );
}

export default MessageList;
