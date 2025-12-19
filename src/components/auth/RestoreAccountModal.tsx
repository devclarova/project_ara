import React from 'react';
import { useTranslation } from 'react-i18next';

interface RestoreAccountModalProps {
  isOpen: boolean;
  onRestore: () => void;
  onCancel: () => void;
  daysRemaining?: number;
}

export default function RestoreAccountModal({
  isOpen,
  onRestore,
  onCancel,
  daysRemaining = 7,
}: RestoreAccountModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-2xl overflow-hidden border border-gray-100 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 rounded-full flex items-center justify-center mb-4">
            <i className="ri-time-line text-2xl" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t('auth.restore_title', '계정 복구 안내')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            {t('auth.restore_desc_1', '이 계정은 현재 탈퇴 유예 기간 중입니다.')}
            <br />
            {t('auth.restore_desc_2', '계정을 복구하고 다시 사용하시겠습니까?')}
          </p>
          {daysRemaining !== undefined && (
             <p className="text-xs text-amber-600 dark:text-amber-500 font-medium mt-2">
               {t('auth.restore_remaining', '영구 삭제까지 {{days}}일 남았습니다.', { days: daysRemaining })}
             </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex border-t border-gray-100 dark:border-zinc-800">
          <button
            onClick={onCancel} // 로그아웃
            className="flex-1 py-4 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            {t('auth.cancel_logout', '취소 (로그아웃)')}
          </button>
          <div className="w-px bg-gray-100 dark:bg-zinc-800"></div>
          <button
            onClick={onRestore}
            className="flex-1 py-4 text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
          >
            {t('auth.restore_confirm', '계정 복구하기')}
          </button>
        </div>
      </div>
    </div>
  );
}
