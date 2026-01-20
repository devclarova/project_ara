import React, { useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

function findActiveScroller(): HTMLElement {
  // 1) window 스크롤이 실제로 움직이고 있으면 document 스크롤러 사용
  const docScroller = (document.scrollingElement as HTMLElement) ?? document.documentElement;
  if (window.scrollY > 0) return docScroller;

  // 2) window.scrollY가 0인데 화면은 스크롤된 상태라면
  //    보통 overflow-y-auto/scroll인 "컨테이너 스크롤" 구조임 → 현재 scrollTop>0인 스크롤러 탐색
  const all = Array.from(document.querySelectorAll<HTMLElement>('body *'));
  let best: HTMLElement | null = null;

  for (const el of all) {
    const style = getComputedStyle(el);
    const oy = style.overflowY;
    if (oy !== 'auto' && oy !== 'scroll') continue;
    if (el.scrollHeight <= el.clientHeight + 1) continue;
    if (el.scrollTop <= 0) continue;

    // 가장 많이 스크롤된(=메인일 확률 높은) 놈 우선
    if (!best || el.scrollTop > best.scrollTop) best = el;
  }

  return best ?? docScroller;
}

type Props = {
  open: boolean;
  title?: string;

  editText: string;
  setEditText: React.Dispatch<React.SetStateAction<string>>;

  editImages: string[];
  setEditImages: React.Dispatch<React.SetStateAction<string[]>>;

  isUploading?: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

  onClose: () => void;
  onSave: () => void;
  disableSave?: boolean;
};

export default function EditTweetModal({
  open,
  title = '게시글 수정',
  editText,
  setEditText,
  editImages,
  setEditImages,
  isUploading = false,
  onFileChange,
  onClose,
  onSave,
  disableSave,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open) return;

    const modalEl = dialogRef.current;

    const inModal = (t: EventTarget | null) =>
      !!modalEl && t instanceof Node && modalEl.contains(t);

    // 모달 열릴 때 현재 위치 저장 (window + "배경" 스크롤러들만)
    const savedWindowY = window.scrollY;

    const scrollables = Array.from(document.querySelectorAll<HTMLElement>('body *')).filter(el => {
      // 모달 내부 요소는 제외 (textarea 포함)
      if (modalEl && modalEl.contains(el)) return false;

      const s = getComputedStyle(el);
      const oy = s.overflowY;
      return (oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 1;
    });

    const savedTops = new Map<HTMLElement, number>();
    for (const el of scrollables) savedTops.set(el, el.scrollTop);

    // 1) 휠/터치로 배경 스크롤 못하게
    const blockWheelTouch = (e: Event) => {
      if (inModal(e.target)) return; // 모달 안은 허용
      e.preventDefault();
    };

    // 2) 키보드로 배경 스크롤 못하게
    const blockKeys = (e: KeyboardEvent) => {
      if (inModal(e.target)) return;

      const keys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Spacebar'];
      if (keys.includes(e.key)) e.preventDefault();
      if (e.key === 'Escape') onClose();
    };

    // 3) 어떤 스크롤이 일어나도(배경) 즉시 원상복구
    const restoreScroll = (e: Event) => {
      // 모달 내부 스크롤(textarea 포함)은 건드리지 않음
      if (inModal(e.target)) return;

      if (window.scrollY !== savedWindowY) window.scrollTo(0, savedWindowY);
      for (const [el, top] of savedTops) {
        if (el.scrollTop !== top) el.scrollTop = top;
      }
    };

    document.addEventListener('wheel', blockWheelTouch, { passive: false });
    document.addEventListener('touchmove', blockWheelTouch, { passive: false });
    document.addEventListener('keydown', blockKeys);
    document.addEventListener('scroll', restoreScroll, true);

    requestAnimationFrame(() => {
      textareaRef.current?.focus({ preventScroll: true });
    });

    return () => {
      document.removeEventListener('wheel', blockWheelTouch as any);
      document.removeEventListener('touchmove', blockWheelTouch as any);
      document.removeEventListener('keydown', blockKeys as any);
      document.removeEventListener('scroll', restoreScroll, true);
    };
  }, [open, onClose]);

  if (!open) return null;

  const modal = (
    <div className="fixed inset-0 z-[1200]">
      <div className="absolute inset-0 bg-black/35 backdrop-blur-[1px] overscroll-contain" />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          ref={dialogRef}
          className="w-full max-w-lg rounded-2xl bg-white dark:bg-secondary shadow-lg"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          </div>

          <div className="px-5 py-4">
            <textarea
              ref={textareaRef}
              value={editText}
              onChange={e => setEditText(e.target.value)}
              rows={6}
              className="
                w-full resize-none rounded-2xl border border-gray-300 dark:border-gray-700
                bg-gray-50 dark:bg-background px-3 py-2 text-sm
                text-gray-900 dark:text-gray-100
                focus:outline-none focus:ring-2 focus:ring-primary/60
              "
              placeholder="내용을 수정해 주세요"
            />

            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 hover:underline disabled:opacity-50"
              >
                <i className="ri-image-add-line" />
                <span>{isUploading ? '업로드 중...' : '사진 추가'}</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={onFileChange}
              />

              {editImages.length > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  이미지 {editImages.length}개
                </span>
              )}
            </div>

            {editImages.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {editImages.map((src, idx) => (
                  <div
                    key={`${src}_${idx}`}
                    className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700"
                  >
                    <img src={src} className="w-full h-full object-cover" alt="preview" />
                    <button
                      type="button"
                      className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center"
                      onClick={() => setEditImages(prev => prev.filter((_, i) => i !== idx))}
                      aria-label="remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 px-5 pb-5">
            <button
              type="button"
              className="text-sm text-gray-500 hover:underline"
              onClick={onClose}
            >
              취소
            </button>

            <button
              type="button"
              className="px-4 py-2 rounded-full text-sm font-semibold bg-primary text-white hover:bg-primary/80 disabled:opacity-50"
              onClick={onSave}
              disabled={disableSave || isUploading}
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
