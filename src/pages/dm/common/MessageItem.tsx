// 개별 메시지 버블(내/상대 구분 + 시간/프로필 + 읽지 않은 메시지 배지 표시)
import type { Message } from '../../../types/dm';
import DMAvatar from './DMAvatar';

type MessageItemProps = {
  msg: Message;
  showTime?: boolean;
  showAvatar?: boolean;
  myAvatarUrl?: string;
  otherAvatarUrl?: string;
  unread?: number; // 읽지 않은 메시지 수
};

function formatTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

function MessageItem({
  msg,
  showTime = true,
  showAvatar = true,
  myAvatarUrl,
  otherAvatarUrl,
  unread = 0,
}: MessageItemProps) {
  const mine = msg.isMe ?? msg.author_id === 'me';
  const timeLabel = formatTime(msg.created_at);

  // 메시지 작성자 이름/아바타 정보
  const authorName =
    (msg as any).author_name ?? (msg as any).author?.name ?? (mine ? 'Me' : 'User');
  const authorAvatar =
    (msg as any).author_avatar ??
    (msg as any).author?.avatar_url ??
    (mine ? myAvatarUrl : otherAvatarUrl);

  return (
    <div className={`w-full flex items-end ${mine ? 'justify-end' : 'justify-start'} mb-1 gap-2`}>
      {/* 상대 메시지는 왼쪽에 아바타 */}
      {!mine && showAvatar && (
        <DMAvatar name={authorName} src={authorAvatar} size={32} unread={unread} />
      )}

      <div className="max-w-[70%] flex flex-col">
        <div
          className={[
            'relative px-3 py-2 text-sm leading-5 whitespace-pre-wrap break-words',
            mine
              ? 'bg-primary/15 text-[#333] self-end rounded-xl rounded-br-[3px]'
              : 'bg-[#f1f3f4] text-[#333] self-start rounded-xl rounded-bl-[3px]',
          ].join(' ')}
        >
          {msg.content}
        </div>

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

      {/* 내 메시지는 오른쪽에 아바타 */}
      {mine && showAvatar && (
        <DMAvatar name={authorName} src={authorAvatar} size={32} unread={unread} />
      )}
    </div>
  );
}

export default MessageItem;
