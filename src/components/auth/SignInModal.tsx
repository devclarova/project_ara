// src/components/auth/SignInModal.tsx
import React from 'react';
import ReactDOM from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import SignInCard from './SignInCard';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SignInModal({ isOpen, onClose }: SignInModalProps) {
  // 스크롤 잠금 Hook (PC + 모바일 완벽 대응)
  useBodyScrollLock(isOpen);

  if (typeof document === 'undefined') return null;

  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[150] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          {/* 시각적 차단 레이어(Visual Backdrop) — 현재 컨텍스트를 유지하면서 로그인 폼에 집중할 수 있도록 배경 반투명(Dimmed) 및 블러 처리 */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-default"
            aria-hidden="true"
          />

          {/* 인터랙티브 모달 컨테이너 — 프레임워크 애니메이션(Framer Motion)을 적용한 부드러운 진입/퇴장 효과 및 스크롤 잠금 영역 정의 */}
          <motion.div
            className="relative max-w-full overscroll-contain"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            data-scroll-lock-scrollable=""
          >
            {/* 사용자 퇴출 포인트(Dismissal Point) — 명시적인 종료 버튼을 통한 모달 상태 해제 및 상위 컴포넌트 이벤트 트리거 */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-6 right-7 z-20 font-extrabold hover:font-black text-gray-500 hover:text-gray-700 dark:text-gray-100 dark:hover:text-gray-400 flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>

            <SignInCard />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export default SignInModal;
