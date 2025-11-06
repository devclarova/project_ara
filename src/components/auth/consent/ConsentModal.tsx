import React, { useEffect, useRef } from 'react';
import { CONTENT, type ConsentKey } from './consentContent';

type Props = {
  open: ConsentKey | null;
  onClose: () => void;
  onAccept: () => void; // 열려있는 항목에 대한 "동의하고 닫기"
};

export default function ConsentModal({ open, onClose, onAccept }: Props) {
  const toc = open ? CONTENT[open] : null;
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  // 접근성: 열린 직후 닫기 버튼 포커스
  useEffect(() => {
    if (open && closeBtnRef.current) closeBtnRef.current.focus();
  }, [open]);

  // ESC로 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !toc) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-modal-title"
    >
      {/* 🔹 모달 박스 다크 배경 & 테두리 */}
      <div className="bg-white dark:bg-secondary rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-lg border border-gray-200 dark:border-gray-700">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b flex-none border-gray-200 dark:border-gray-700">
          <h3
            id="consent-modal-title"
            className="text-lg font-bold text-[var(--ara-primary)] dark:text-[var(--ara-primary)]"
          >
            {toc.title}
          </h3>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="text-gray-400 hover:text-[var(--ara-primary)] dark:text-gray-400 dark:hover:text-[var(--ara-primary)]"
            aria-label="close"
          >
            ✕
          </button>
        </div>

        {/* 본문 */}
        <div className="grid grid-cols-[180px,1fr] gap-0 flex-auto min-h-0">
          {/* 🔹 좌측 목차도 보더/배경 다크 대응 */}
          <nav className="border-r px-4 py-4 flex-none border-gray-200 dark:border-gray-700 dark:bg-secondary">
            <ul className="space-y-2 text-sm">
              {toc.sections.map(s => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="text-gray-700 hover:text-[var(--ara-primary)] hover:underline dark:text-gray-200 dark:hover:text-[var(--ara-primary)]"
                    onClick={e => {
                      e.preventDefault();
                      const target = document.getElementById(s.id);
                      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                  >
                    {s.h}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div
            id="modal-content-scroll"
            className="px-6 py-5 overflow-auto min-h-0 bg-white dark:bg-secondary"
          >
            <div className="space-y-6 text-sm text-gray-800 dark:text-gray-200 leading-6 pr-2">
              {toc.sections.map(s => (
                <section key={s.id} id={s.id} className="scroll-mt-20">
                  <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">{s.h}</h4>
                  <div>{s.body}</div>
                </section>
              ))}
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t flex-none border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50
                       dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            닫기
          </button>
          <button
            onClick={onAccept}
            className="px-4 py-2 rounded-lg bg-[var(--ara-primary)] text-white font-semibold hover:opacity-90 dark:hover:opacity-95"
          >
            동의하고 닫기
          </button>
        </div>
      </div>
    </div>
  );
}
