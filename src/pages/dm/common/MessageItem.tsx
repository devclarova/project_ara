// 개별 메시지 버블(내/상대 구분 + 시간/프로필 + 읽지 않은 메시지 배지 표시)
// - 메시지 버블(내/상대 구분), 시간 라벨, 아바타 표시

import type { Message } from '../../../types/dm';
import DMAvatar from './DMAvatar';

type HighlightRange = { start: number; end: number };

type MessageItemProps = {
  msg: Message;
  myId: string; // 현재 사용자 id (msg.sender_id와 동일 축: profiles.id 또는 auth.id)
  showTime?: boolean;
  showAvatar?: boolean;
  unread?: number; // 아바타 배지(읽지 않음) 카운트
  highlightRanges?: HighlightRange[]; // 메시지 내 하이라이트 구간
};

/**
 * 하이라이트 안전 처리
 * - 범위를 시작순으로 정렬
 * - [0, text.length]로 클램프
 * - 중첩/연속 구간 병합
 */

function normalizeRanges(text: string, ranges: HighlightRange[] = []): HighlightRange[] {
  const n = text.length;
  const cleaned = ranges
    .map(r => ({
      start: Math.max(0, Math.min(n, r.start)),
      end: Math.max(0, Math.min(n, r.end)),
    }))
    .filter(r => r.end > r.start)
    .sort((a, b) => a.start - b.start);

  const merged: HighlightRange[] = [];
  for (const r of cleaned) {
    if (!merged.length) {
      merged.push(r);
    } else {
      const last = merged[merged.length - 1];
      if (r.start <= last.end) {
        // 중첩/연속 → 병합
        last.end = Math.max(last.end, r.end);
      } else {
        merged.push(r);
      }
    }
  }
  return merged;
}

// 하이라이트 렌더러
function renderHighlighted(text: string, ranges: HighlightRange[] = []) {
  const normalized = normalizeRanges(text, ranges);
  if (!normalized.length) return text;

  const parts: JSX.Element[] = [];
  let cursor = 0;

  normalized.forEach((r, idx) => {
    if (cursor < r.start) {
      parts.push(<span key={`n-${idx}-${cursor}`}>{text.slice(cursor, r.start)}</span>);
    }
    parts.push(
      <mark key={`h-${idx}`} className="bg-yellow-200 rounded-[2px] px-[2px]">
        {text.slice(r.start, r.end)}
      </mark>,
    );
    cursor = r.end;
  });

  if (cursor < text.length) {
    parts.push(<span key={`tail-${cursor}`}>{text.slice(cursor)}</span>);
  }
  return parts;
}

function formatTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

function MessageItem({
  msg,
  myId,
  showTime = true,
  showAvatar = true,
  unread = 0,
  highlightRanges = [],
}: MessageItemProps) {
  // "내 메시지" 판별: 스키마에 맞춰 sender_id와 같은 축의 myId를 넘김
  const mine = msg.sender_id === myId;
  const timeLabel = formatTime(msg.created_at);

  // DMAvatar는 userId 기반(프로필 조회) — 상대 메시지는 sender_id, 내 메시지는 myId
  const avatarUserId = mine ? myId : msg.sender_id;

  return (
    <div className={`w-full flex items-end ${mine ? 'justify-end' : 'justify-start'} mb-1 gap-2`}>
      {/* 상대 메시지면 왼쪽 아바타 */}
      {!mine && showAvatar && <DMAvatar userId={String(avatarUserId)} size={32} unread={unread} />}

      {/* 말풍선 + 시간 */}
      <div className="max-w-[70%] flex flex-col min-h-[32px]">
        <div
          className={[
            'relative px-3 py-2 text-sm leading-5 whitespace-pre-wrap break-words',
            mine
              ? 'bg-emerald-50 text-gray-800 self-end rounded-xl rounded-br-[3px]'
              : 'bg-gray-100 text-gray-800 self-start rounded-xl rounded-bl-[3px]',
          ].join(' ')}
        >
          {renderHighlighted(msg.content ?? '', highlightRanges)}
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

      {/* 내 메시지면 오른쪽 아바타 */}
      {mine && showAvatar && <DMAvatar userId={String(avatarUserId)} size={32} unread={unread} />}
    </div>
  );
}

export default MessageItem;
