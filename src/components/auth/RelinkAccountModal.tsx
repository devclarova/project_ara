import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Buttons';
import { AlertCircle, Info, ArrowRight, UserPlus, LogIn } from 'lucide-react';

interface RelinkAccountModalProps {
  isOpen: boolean;
  reason: 'same_email' | 'different_email';
  provider: 'google' | 'kakao';
  originalEmailMasked?: string;
  onReconnect: () => void;
  onContinueNew: () => void;
  onCancel?: () => void;
  onClose: () => void;
}

export default function RelinkAccountModal({
  isOpen,
  reason,
  provider,
  originalEmailMasked,
  onReconnect,
  onContinueNew,
  onCancel,
  onClose,
}: RelinkAccountModalProps) {
  const { t } = useTranslation();
  const [showManualGuide, setShowManualGuide] = useState(false);

  const providerName = provider === 'google' ? 'Google' : provider === 'kakao' ? 'Kakao' : provider;

  // 식별자 중복 시나리오(Same Email) — 현재 소셜 계정이 기존 계정과 동일한 이메일을 사용하는 경우, 보안을 위해 이메일 인증 로그인을 강제하는 가이드 노출
  if (reason === 'same_email') {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onCancel || onClose}
        title={t('auth.relink_notice_title', 'SNS 재연결 안내')}
        className="max-w-md h-auto"
      >
        <div className="px-6 py-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8 text-amber-500" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              {t('auth.relink_previously_unlinked', '이전에 해제된 SNS 계정입니다')}
            </h3>
            
            <p className="text-base text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              {t('auth.relink_security_guide', '보안을 위해 이메일로 로그인하신 후, [설정 > SNS 연결 관리]에서 직접 다시 연결해 주세요.')}
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-5 flex gap-3">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={onCancel || onClose}
            className="flex-1 rounded-xl"
          >
            {t('common.cancel', '취소')}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={onReconnect}
            className="flex-1 rounded-xl shadow-lg shadow-primary/20"
          >
            {t('auth.login_with_email', '이메일로 로그인')}
          </Button>
        </div>
      </Modal>
    );
  }

  // 다중 계정 연결 시나리오(Cross-account Identity) — 소셜 계정이 이미 다른 이메일 계정에 연결되어 있는 경우, 계정 통합 또는 신규 가입을 선택할 수 있는 분기점 제공
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel || onClose}
      title={t('auth.duplicate_prevent_title', 'SNS 계정 중복 방지 안내')}
      className="max-w-md h-auto"
    >
      <div className="px-6 py-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <LogIn className="w-8 h-8 text-primary" />
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
            {t('auth.choose_start_method', '어떤 이메일로 시작할까요?')}
          </h3>
          
          <div className="space-y-4 mb-8 w-full">
            <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed text-left">
              {t('auth.relink_cross_account_desc', {
                provider: providerName,
                email: originalEmailMasked,
                interpolation: { escapeValue: false }
              })}
              <br /><br />
              {t('auth.relink_manual_guide', '보안을 위해 이메일로 로그인 후 [설정]에서 다시 연결해 주세요.')}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-6 flex flex-col gap-3">
        <button
          onClick={onReconnect}
          className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 transition-all group"
        >
          <div className="flex items-center gap-4 text-left">
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <LogIn className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900 dark:text-white text-base">이전 계정으로 시작</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{originalEmailMasked} 계정으로 로그인</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-primary transform translate-x-0 group-hover:translate-x-1 transition-all" />
        </button>

        <button
          onClick={onContinueNew}
          className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 transition-all group"
        >
          <div className="flex items-center gap-4 text-left">
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <UserPlus className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900 dark:text-white text-base">새 계정/이메일로 계속</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">이메일 로그인/가입 후 수동 연결</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-primary transform translate-x-0 group-hover:translate-x-1 transition-all" />
        </button>

        <Button
          variant="secondary"
          className="mt-2 rounded-xl"
          onClick={onCancel || onClose}
        >
          닫기
        </Button>
      </div>
    </Modal>
  );
}
