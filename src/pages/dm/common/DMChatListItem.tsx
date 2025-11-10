// 개별채팅
// - 채팅 목록의 "한 줄"을 렌더링
// - 아바타(읽지않음 배지 포함), 상대 닉네임, 마지막 메시지, 시간, 우클릭 컨텍스트 메뉴 제공
// - 선택 상태(selected) 시 배경/보더 강조

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DMAvatar from './DMAvatar';
import DMContextMenu, { type ContextMenuItem } from './DMContextMenu';
import { supabase } from '../../../lib/supabase';
import type { Chat } from '../../../types/dm';
import { useAuth } from '../../../contexts/AuthContext';

type Props = {
  chat: Chat;
  selected?: boolean;
  onClick?: (id: string) => void;
  className?: string;
  // 컨텍스트 메뉴 액션 콜백들(선택 사항)
  onTogglePin?: (chatId: string, nextPinned: boolean) => void;
  onToggleAlarm?: (chatId: string, nextAlarmOn: boolean) => void; // mute/unmute
  onMarkAsRead?: (chatId: string) => void;
  onDelete?: (chatId: string) => void;
};

const DMChatListItem: React.FC<Props> = ({
  chat,
  selected = false,
  onClick,
  className = '',
  onTogglePin,
  onToggleAlarm,
  onMarkAsRead,
  onDelete,
}) => {
  const { user } = useAuth();

  // 상대 유저 id 계산 (user1/user2 중 나를 제외한 쪽)
  const otherUserId = useMemo(() => {
    if (!user?.id) return null;
    return chat.user1_id === user.id ? chat.user2_id : chat.user1_id;
  }, [chat.user1_id, chat.user2_id, user?.id]);

  // 상대 닉네임만 필요 (아바타는 DMAvatar가 처리하므로 중복 패칭 불필요)
  const [otherNickname, setOtherNickname] = useState<string>('');

  // 컨텍스트 메뉴 상태
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // lastMessage 필드 보정(스키마 차이에 대비)
  const lastMessage: string | null = (chat as any).lastMessage ?? (chat as any).lastmessage ?? null;

  // 데이터 패칭: 상대 닉네임
  useEffect(() => {
    if (!otherUserId) {
      setOtherNickname('');
      return;
    }
    const fetchOtherNickname = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('nickname')
          .eq('id', otherUserId)
          .maybeSingle();
        if (error) throw error;
        setOtherNickname(data?.nickname ?? '');
      } catch (err) {
        console.error('[DMChatListItem] 상대 닉네임 로드 실패:', err);
        setOtherNickname('');
      }
    };
    fetchOtherNickname();
  }, [otherUserId]);

  // 컨텍스트 메뉴
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setMenuOpen(true);
  }, []);

  const menuItems: ContextMenuItem[] = useMemo(
    () => [
      {
        key: 'pin',
        label: chat.pinned ? '상단 고정 해제' : '상단에 고정',
        onSelect: () => onTogglePin?.(chat.id, !chat.pinned),
        shortcut: 'P',
      },
      {
        key: 'alarm',
        label: chat.alarm ? '알림 끄기' : '알림 켜기',
        onSelect: () => onToggleAlarm?.(chat.id, !chat.alarm),
        shortcut: 'M',
      },
      {
        key: 'read',
        label: '읽음 처리',
        onSelect: () => onMarkAsRead?.(chat.id),
        shortcut: 'R',
      },
      {
        key: 'delete',
        label: '대화 삭제…',
        danger: true,
        onSelect: () => onDelete?.(chat.id),
      },
    ],
    [chat.alarm, chat.id, chat.pinned, onDelete, onMarkAsRead, onToggleAlarm, onTogglePin],
  );

  return (
    <>
      <button
        type="button"
        // 접근성: 선택 상태를 보조기기에 알려줌
        aria-selected={selected}
        // data-속성으로 Tailwind의 상태 스타일링에 활용
        data-selected={selected}
        onClick={() => onClick?.(chat.id)}
        onContextMenu={handleContextMenu}
        className={[
          'w-full text-left outline-none',
          'flex items-center py-[18px] px-5 cursor-pointer border-b border-gray-100',
          'transition-colors duration-200 ease-in-out bg-white hover:bg-gray-50',
          // 선택 상태 강조: 얇은 우측 보더 + 살짝 색상 강조
          'data-[selected=true]:bg-emerald-50 data-[selected=true]:border-r-4 data-[selected=true]:border-emerald-500',
          className,
        ].join(' ')}
      >
        {/* 아바타(내부에서 fallback과 unread 배지 처리) */}
        {otherUserId && <DMAvatar userId={otherUserId} unread={chat.unread ?? 0} />}

        {/* 본문(상대 닉네임 / 시간 / 마지막 메시지) */}
        <div className="flex-1 min-w-0">
          <div className="mb-1 flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-800">
              {otherNickname || '알 수 없음'}
            </div>
            <div className="text-xs text-gray-500">{chat.time}</div>
          </div>

          <div className="truncate text-[13px] text-gray-600">
            {lastMessage ? (
              <span className={(chat.unread ?? 0) > 0 ? 'font-semibold text-gray-800' : ''}>
                {lastMessage}
              </span>
            ) : (
              <span className="italic text-gray-400">메시지가 없습니다.</span>
            )}
          </div>
        </div>
      </button>

      {/* 우클릭 컨텍스트 메뉴 */}
      {menuOpen && (
        <DMContextMenu
          open={menuOpen}
          x={menuPos.x}
          y={menuPos.y}
          onClose={() => setMenuOpen(false)}
          items={menuItems}
        />
      )}
    </>
  );
};

export default DMChatListItem;
