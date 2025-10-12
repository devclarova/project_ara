// 개별 메시지 버블(내/상대 구분)

import type { Message } from '../../../types/dm';

function MessageItem({ msg }: { msg: Message }) {
  const mine = msg.isMe ?? msg.author_id === 'me';
  return (
    <div className={`w-full flex ${mine ? 'justify-end' : 'justify-start'} mb-1`}>
      <div
        className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm leading-5 ${mine ? 'bg-[#e3f2fd] text-gray-800' : 'bg-gray-100 text-gray-800'}`}
      >
        {msg.content}
      </div>
    </div>
  );
}

export default MessageItem;
