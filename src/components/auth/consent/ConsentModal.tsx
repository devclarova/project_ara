import React, { useEffect, useRef } from 'react';
import { getContent, type ConsentKey } from './consentContent';
import { useTranslation } from 'react-i18next';

type Props = {
  open: ConsentKey | null;
  onClose: () => void;
  onAccept: () => void; // 열려있는 항목에 대한 "동의하고 닫기"
};

export default function ConsentModal({ open, onClose, onAccept }: Props) {
  const { t } = useTranslation();
  const CONTENT = getContent(t); // t 함수를 전달하여 번역된 콘텐츠 가져오기
  const toc = open ? CONTENT[open] : null;
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const modalContentRef = useRef<HTMLDivElement | null>(null);

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

  // 바깥 스크롤 차단 및 위치 고정 (Scroll Jump 방지)
  useEffect(() => {
    if (!open) return;

    const scrollY = window.scrollY;
    const body = document.body;
    // 기존 스타일 저장
    const originalStyle = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    };

    // 스크롤 잠금
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';

    return () => {
      // 스타일 복원
      body.style.overflow = originalStyle.overflow;
      body.style.position = originalStyle.position;
      body.style.top = originalStyle.top;
      body.style.width = originalStyle.width;
      // 스크롤 위치 복원
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  if (!open || !toc) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center 
                 pt-10 md:pt-16 px-4 md:px-6
                 bg-black/40 dark:bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-modal-title"
    >
      {/* 모달 카드 */}
      <div
        ref={modalContentRef}
        className="w-full max-w-4xl max-h-[80vh]
                   flex flex-col rounded-2xl shadow-2xl 
                   bg-white dark:bg-secondary 
                   border border-gray-200 dark:border-gray-700
                   text-gray-900 dark:text-gray-100"
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b border-gray-200 dark:border-gray-700">
          <h3
            id="consent-modal-title"
            className="text-base md:text-lg font-bold text-[var(--ara-primary)]"
          >
            {toc.title}
          </h3>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="text-gray-400 hover:text-[var(--ara-primary)] 
                       dark:text-gray-400 dark:hover:text-[var(--ara-primary)]"
            aria-label="close"
          >
            ✕
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {/* 좌측 목차: 데스크톱에서만 */}
          <nav className="hidden md:block w-1/3 min-w-[240px] max-w-[300px] shrink-0 border-r px-4 py-4 border-gray-200 dark:border-gray-700 dark:bg-secondary overflow-y-auto break-words">
            <ul className="space-y-2 text-sm">
              {toc.sections.map(s => (
                <li key={s.id}>
                  <button
                    className="w-full text-left text-gray-700 hover:text-[var(--ara-primary)] hover:underline 
                               dark:text-gray-200 dark:hover:text-[var(--ara-primary)]"
                    onClick={e => {
                      e.preventDefault();
                      const target = document.getElementById(s.id);
                      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                  >
                    {s.h}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* 우측 내용 (모바일에서는 전체 폭) */}
          <div
            id="modal-content-scroll"
            className="flex-1 px-4 md:px-6 py-4 md:py-5 overflow-y-auto bg-white dark:bg-secondary"
          >
            <div className="max-w-3xl mx-auto space-y-6 text-sm md:text-[15px] leading-relaxed text-gray-800 dark:text-gray-100 pr-1 md:pr-2">
              {toc.sections.map(s => (
                <section key={s.id} id={s.id} className="scroll-mt-24">
                  <h4 className="text-base md:text-[17px] font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {s.h}
                  </h4>
                  <div className="text-[13px] md:text-[14px]">{s.body}</div>
                </section>
              ))}
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-end gap-2 px-4 md:px-5 py-3 md:py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-3 md:px-4 py-2 rounded-lg border border-gray-300 text-xs md:text-sm text-gray-700 hover:bg-gray-50
                       dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            {t('common.close')}
          </button>
          <button
            onClick={onAccept}
            className="px-4 md:px-5 py-2 rounded-lg bg-[var(--ara-primary)] text-xs md:text-sm text-white font-semibold hover:opacity-90 dark:hover:opacity-95"
          >
            {t('signup.agree_and_close')}
          </button>
        </div>
      </div>
    </div>
  );
}
