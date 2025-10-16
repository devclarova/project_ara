import React, { useEffect, useMemo, useRef } from 'react';

export type ContextMenuItem = {
  key: string;
  label: string;
  danger?: boolean;
  onSelect: () => void;
  shortcut?: string; // e.g.
};

type Props = {
  open: boolean;
  x: number; // viewport X (clientX)
  y: number; // viewport Y (clientY)
  onClose: () => void;
  items: ContextMenuItem[];
};

const MENU_WIDTH = 220;
const MENU_ITEM_H = 36;
const MENU_PADDING_Y = 8;

const ContextMenu: React.FC<Props> = ({ open, x, y, onClose, items }) => {
  const ref = useRef<HTMLDivElement | null>(null);

  // 위치 보정: 화면 밖으로 넘치지 않게
  const { left, top } = useMemo(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const height = MENU_PADDING_Y * 2 + items.length * MENU_ITEM_H;

    let lx = x;
    let ty = y;

    // 메뉴가 화면을 넘지 않도록 위치 보정
    if (lx + MENU_WIDTH > vw) lx = Math.max(8, vw - MENU_WIDTH - 8); // 화면 오른쪽으로 넘어가지 않도록
    if (ty + height > vh) ty = Math.max(8, vh - height - 8); // 화면 아래로 넘어가지 않도록

    return { left: lx, top: ty };
  }, [x, y, items.length]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      // 메뉴 바깥 클릭 시 닫기
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose(); // 외부 클릭 시 메뉴 닫기
      }
    };
    document.addEventListener('mousedown', onDocClick, { capture: true });
    return () => {
      document.removeEventListener('mousedown', onDocClick, { capture: true });
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      role="menu"
      className="fixed z-[9999] w-[220px] rounded-lg border border-gray-200 bg-white shadow-xl overflow-hidden"
      style={{ left, top }}
    >
      <ul className="py-2">
        {items.map(it => (
          <li key={it.key}>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                it.onSelect();
                onClose();
              }}
              className={[
                'w-full h-[36px] px-3 text-sm flex items-center justify-between',
                'hover:bg-gray-50 transition-colors',
                it.danger ? 'text-red-600 hover:text-red-700' : 'text-gray-800',
              ].join(' ')}
            >
              <span className="truncate">{it.label}</span>
              {it.shortcut && <span className="text-[11px] text-gray-400">{it.shortcut}</span>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ContextMenu;
