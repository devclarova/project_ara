// 메시지 목록(날짜 구분/연속 메시지 묶기/읽음표시)

import { useEffect, useRef } from 'react';
import type { Message } from '../../../types/dm';
import MessageItem from './MessageItem';

function MessageList({ messages }: { messages: Message[] }) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-white">
      {messages.map(m => (
        <MessageItem key={m.id} msg={m} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

export default MessageList;
