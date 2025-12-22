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
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          {/* 전체를 덮는 오버레이 (배경 클릭해도 아무 일도 안 일어남) */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-default"
            aria-hidden="true"
          />

          {/* 실제 모달 카드 (여기만 클릭 가능) */}
          <motion.div
            className="relative max-w-full overscroll-contain"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            data-scroll-lock-scrollable=""
          >
            {/* 닫기 버튼: 누르면 onClose → SnsPage에서 navigate('/') */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-7 right-7 z-20 bg-black text-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer"
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
