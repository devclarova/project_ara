import { useState } from 'react';
import { useBlock } from '@/hooks/useBlock';
import { useTranslation } from 'react-i18next';
import Modal from '@/components/common/Modal';

interface BlockButtonProps {
  targetProfileId: string;
  onClose: () => void;
  onBlock?: () => void;
}

export default function BlockButton({ targetProfileId, onClose, onBlock }: BlockButtonProps) {
  const { t } = useTranslation();
  const { isBlocked, isLoading, toggleBlock } = useBlock(targetProfileId);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isBlocked) {
      // Unblock: ask for confirmation or just toggle?
      // Requirement said confirmation for "blocking", but let's see if we need for unblock
      // Using confirmation for unblock too if standard UI, but here let's stick to toggle for unblock if not specified.
      handleAction();
    } else {
      setShowConfirm(true);
    }
  };

  const handleAction = async () => {
    await toggleBlock();
    if (!isBlocked && onBlock) {
      onBlock();
    }
    setShowConfirm(false);
    onClose();
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="w-full text-left px-4 py-3 hover:bg-gray-100 
          dark:hover:bg-white/10 flex items-center gap-2 text-gray-800 dark:text-gray-200
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <i className="ri-forbid-line" />
        {isLoading ? t('common.loading', '로딩중...') : (isBlocked ? t('common.unblock', '차단 해제') : t('common.block', '차단'))}
      </button>

      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title={t('common.block_modal_title', '정말 차단하시겠습니까?')}
        className="max-w-md h-auto"
      >
        <div className="flex flex-col gap-6 py-4 px-6 text-left">
          <div className="flex flex-col gap-5">
            {/* Notice 1: Chat Exit */}
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-sm">
                <i className="ri-logout-box-r-line text-orange-500 text-2xl" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-gray-900 dark:text-gray-100 font-bold text-sm">
                  {t('chat.btn_leave', '채팅방 나가기')}
                </span>
                <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                  {t('common.block_modal_notice_1')}
                </p>
              </div>
            </div>

            {/* Notice 2: Block Messages */}
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-sm">
                <i className="ri-mail-forbid-line text-blue-500 text-2xl" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-gray-900 dark:text-gray-100 font-bold text-sm">
                  {t('chat.block_messages', '메시지 차단')}
                </span>
                <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                  {t('common.block_modal_notice_2')}
                </p>
              </div>
            </div>

            {/* Notice 3: Hide Posts */}
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-sm">
                <i className="ri-eye-off-line text-purple-500 text-2xl" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-gray-900 dark:text-gray-100 font-bold text-sm">
                  {t('common.hide_posts', '게시글 숨김')}
                </span>
                <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                  {t('common.block_modal_notice_3')}
                </p>
              </div>
            </div>

            {/* Notice 4: Mask Comments */}
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-sm">
                <i className="ri-chat-private-line text-emerald-500 text-2xl" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-gray-900 dark:text-gray-100 font-bold text-sm">
                  {t('common.mask_comments', '댓글 마스킹')}
                </span>
                <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                  {t('common.block_modal_notice_4')}
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center gap-3 border border-gray-100 dark:border-white/10 shadow-inner">
            <i className="ri-information-line text-gray-400 text-lg shrink-0" />
            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal font-medium text-left">
              {t('common.block_modal_warning')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowConfirm(false);
              }}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/20 transition-all font-medium"
            >
              {t('common.cancel', '취소')}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction();
              }}
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-500 text-white hover:bg-red-600 active:scale-95 disabled:opacity-50 transition-all shadow-md shadow-red-500/20"
            >
              {isLoading ? t('common.loading', '처리 중...') : t('common.block', '차단하기')}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
