// - 마우스 우클릭 좌표(x, y)를 기준으로 컨텍스트 메뉴를 띄움
// - 화면 밖으로 삐져나가지 않도록 위치 보정
// - 외부 클릭 / 스크롤 / 리사이즈 / ESC 키로 닫힘
// - 키보드 내비게이션(↑/↓/Enter) 지원 및 초점 자동 이동
// - 간단한 a11y 속성(role, aria) 적용

import React, { useEffect, useMemo, useRef, useState } from 'react';

export type ContextMenuItem = {
  key: string;
  label: string;
  danger?: boolean;
  onSelect: () => void;
  shortcut?: string;
};

type Props = {
  open: boolean;
  x: number; // viewport X (MouseEvent.clientX)
  y: number; // viewport Y (MouseEvent.clientY)
  onClose: () => void; // 닫기 콜백
  items: ContextMenuItem[]; // 메뉴 항목 목록
};

// 스타일 상수 (Tailwind 고정폭과 맞춤)
const MENU_WIDTH = 220; // w-[220px]
const MENU_ITEM_H = 36; // h-[36px]
const MENU_PADDING_Y = 8; // py-2 (대략 8px*2)

const DMContextMenu: React.FC<Props> = ({ open, x, y, onClose, items }) => {
  const rootRef = useRef<HTMLDivElement | null>(null);

  // 키보드 포커스 관리: 현재 선택된(포커스된) 항목 인덱스
  const [activeIndex, setActiveIndex] = useState(0);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // 화면 경계 보정: 메뉴가 화면 밖으로 나가지 않도록 left/top 계산
  const { left, top } = useMemo(() => {
    if (typeof window === 'undefined') {
      return { left: x, top: y };
    }
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const height = MENU_PADDING_Y * 2 + items.length * MENU_ITEM_H;

    let lx = x;
    let ty = y;

    // 오른쪽 경계 보정
    if (lx + MENU_WIDTH > vw) lx = Math.max(8, vw - MENU_WIDTH - 8);
    // 아래쪽 경계 보정
    if (ty + height > vh) ty = Math.max(8, vh - height - 8);

    // 상단/좌측 최소 여백
    lx = Math.max(8, lx);
    ty = Math.max(8, ty);

    return { left: lx, top: ty };
  }, [x, y, items.length]);

  // 메뉴가 열릴 때 첫 항목에 포커스
  useEffect(() => {
    if (!open) return;
    setActiveIndex(0);
    const t = setTimeout(() => {
      itemRefs.current[0]?.focus();
    }, 0);
    return () => clearTimeout(t);
  }, [open]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // 스크롤/리사이즈 시에도 닫기
    const onWinScroll = () => onClose();
    const onWinResize = () => onClose();

    document.addEventListener('mousedown', onDocMouseDown, { capture: true });
    window.addEventListener('scroll', onWinScroll, { passive: true });
    window.addEventListener('resize', onWinResize, { passive: true });

    return () => {
      document.removeEventListener('mousedown', onDocMouseDown, { capture: true });
      window.removeEventListener('scroll', onWinScroll);
      window.removeEventListener('resize', onWinResize);
    };
  }, [open, onClose]);

  // 키보드 키 핸들링
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (!items.length) return;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex(prev => {
            const next = (prev + 1) % items.length;
            itemRefs.current[next]?.focus();
            return next;
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex(prev => {
            const next = (prev - 1 + items.length) % items.length;
            itemRefs.current[next]?.focus();
            return next;
          });
          break;
        case 'Enter':
          e.preventDefault();
          items[activeIndex]?.onSelect?.();
          onClose();
          break;
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, items, activeIndex, onClose]);

  if (!open) return null;

  return (
    <div
      ref={rootRef}
      role="menu"
      aria-label="Context menu"
      className="fixed z-[9999] w-[220px] rounded-lg border border-gray-200 bg-white shadow-xl overflow-hidden"
      style={{ left, top }}
    >
      <ul className="py-2">
        {items.map((it, idx) => (
          <li key={it.key}>
            <button
              ref={el => (itemRefs.current[idx] = el)}
              type="button"
              role="menuitem"
              // 포커스/호버 시 배경 강조, 위험 옵션은 빨간색
              className={[
                'w-full h-[36px] px-3 text-sm flex items-center justify-between',
                'outline-none focus:bg-gray-100 hover:bg-gray-50 transition-colors',
                it.danger ? 'text-red-600 hover:text-red-700 focus:text-red-700' : 'text-gray-800',
              ].join(' ')}
              onClick={() => {
                it.onSelect();
                onClose();
              }}
              // 마우스로 호버하면 키보드 포커스 인덱스도 동기화
              onMouseEnter={() => setActiveIndex(idx)}
            >
              <span className="truncate">{it.label}</span>
              {it.shortcut && <span className="text-[11px] text-gray-400 ml-2">{it.shortcut}</span>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DMContextMenu;
