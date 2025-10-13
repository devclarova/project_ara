// 개별 메시지 버블(내/상대 구분 + 시간 표시)

import type { Message } from '../../../types/dm';

function formatTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

function MessageItem({ msg, showTime = true }: { msg: Message; showTime?: boolean }) {
  const mine = msg.isMe ?? msg.author_id === 'me';
  const timeLabel = formatTime(msg.created_at);

  return (
    <div className={`w-full flex ${mine ? 'justify-end' : 'justify-start'} mb-1`}>
      <div className="max-w-[70%] flex flex-col">
        <div
          className={`rounded-2xl px-3 py-2 text-sm leading-5 ${
            mine ? 'bg-[#e3f2fd] text-gray-800 self-end' : 'bg-gray-100 text-gray-800 self-start'
          }`}
        >
          {msg.content}
        </div>

        {/* 같은 시간대의 마지막 메시지만 시간 표시 */}
        {showTime && (
          <div
            className={`mt-1 text-[11px] leading-4 text-gray-400 ${
              mine ? 'self-end pr-1' : 'self-start pl-1'
            }`}
          >
            {timeLabel}
          </div>
        )}
      </div>
    </div>
  );
}

export default MessageItem;
