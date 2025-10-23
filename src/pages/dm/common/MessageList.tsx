// 메시지 목록(날짜 구분/연속 메시지 묶기/읽음표시)
// - 날짜별로 메시지를 그룹핑하여 날짜 구분선과 함께 렌더링
// - 같은 작성자의 연속 메시지에서 "같은 분(minute)"이면 시간표시 생략
// - autoScroll: 'always' | 'onSend' | 'never' 지원 (onSend는 justSent=true 일 때만)
// - 특정 메시지로 스크롤(activeMessageId) 보장
// - 빈 배열/초기 렌더 안전 가드
// - 하이라이트 범위 전달

import { useEffect, useMemo, useRef } from 'react';
import type { Message } from '../../../types/dm';
import MessageItem from './MessageItem';

type HighlightRange = { start: number; end: number };

type Props = {
  messages: Message[];
  myId: string; // 현재 사용자 id (MessageItem에 전달)
  autoScrollMode?: 'never' | 'onSend' | 'always';
  justSent?: boolean; // 내가 방금 보냈다면 true
  highlightMap?: Record<string | number, HighlightRange[]>;
  activeMessageId?: string | number;
};

// 같은 "분"인지 비교(시:분 단위)
function sameMinute(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate() &&
    a.getHours() === b.getHours() &&
    a.getMinutes() === b.getMinutes()
  );
}

// 메시지 작성자 키(연속 여부 판단용)
function authorKey(m: Message) {
  return m.sender_id;
}

// 날짜 키(그룹핑)
function dateKey(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 사용자에게 보여줄 날짜 라벨
function formatDateLabel(d: Date) {
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

function MessageList({
  messages,
  myId,
  autoScrollMode = 'onSend',
  justSent = false,
  highlightMap = {},
  activeMessageId,
}: Props) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string | number, HTMLDivElement | null>>({});

  // 날짜별 그룹핑 (메시지는 시간 오름차순이라고 가정)
  const groups = useMemo(() => {
    const byDate: Record<string, { label: string; date: Date; items: Message[] }> = {};
    for (const m of messages) {
      const dt = new Date(m.created_at);
      const key = dateKey(dt);
      if (!byDate[key]) byDate[key] = { label: formatDateLabel(dt), date: dt, items: [] };
      byDate[key].items.push(m);
    }
    return Object.values(byDate).sort((a, b) => +a.date - +b.date);
  }, [messages]);

  // 자동 스크롤
  useEffect(() => {
    if (autoScrollMode === 'always' || (autoScrollMode === 'onSend' && justSent)) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, autoScrollMode, justSent]);

  // 특정 메시지로 스크롤
  useEffect(() => {
    if (!activeMessageId) return;
    const el = itemRefs.current[activeMessageId];
    if (!el) return;
    const timer = window.setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
    return () => window.clearTimeout(timer);
  }, [activeMessageId, messages.length]);

  // 빈 상태 가드
  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto p-6 bg-white text-gray-500 flex items-center justify-center">
        아직 메시지가 없습니다.
        <div ref={bottomRef} />
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-white">
      {groups.map(group => (
        <section key={group.label} className="mb-4">
          {/* 날짜 구분선 */}
          <div className="relative text-center my-3">
            <span className="inline-block bg-white px-3 text-xs text-gray-500 relative z-10">
              {group.label}
            </span>
            <span className="absolute left-0 right-0 top-1/2 -translate-y-1/2 border-t border-gray-200" />
          </div>

          {/* 그룹 내 메시지 */}
          {group.items.map((m, i) => {
            const nextMsg = group.items[i + 1];
            const current = new Date(m.created_at);

            // 같은 작성자의 연속 메시지 & 같은 "분"이면 시간 생략
            // 작성자 변경/분 변경/마지막이면 시간 표시
            const showTime =
              !nextMsg ||
              authorKey(m) !== authorKey(nextMsg) ||
              !sameMinute(current, new Date(nextMsg?.created_at));

            // 아바타는 "연속 묶음의 마지막 버블"에만 표시(작성자 변경 or 마지막)
            const showAvatar = !nextMsg || authorKey(m) !== authorKey(nextMsg);

            return (
              <div
                key={m.id}
                ref={el => {
                  itemRefs.current[m.id] = el; // 스크롤 타깃 저장(검색 이동용)
                }}
              >
                <MessageItem
                  msg={m}
                  myId={myId}
                  showTime={showTime}
                  showAvatar={showAvatar} // 묶음 마지막 버블에서만 표시
                  highlightRanges={highlightMap[m.id] || []}
                />
              </div>
            );
          })}
        </section>
      ))}

      {/* 스크롤 바텀 앵커 */}
      <div ref={bottomRef} />
    </div>
  );
}

export default MessageList;
