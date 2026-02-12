import Button from '@/components/common/Buttons';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Modal from '@/components/common/Modal';

interface SNSConnectProps {
  onClose?: () => void;
}

type Provider = 'google' | 'kakao';

interface Identity {
  id: string;
  user_id: string;
  identity_id: string;
  provider: string;
  created_at?: string;
  last_sign_in_at?: string;
  updated_at?: string;
}

function SNSConnect({ onClose }: SNSConnectProps) {
  const { t } = useTranslation();
  const [linkedIdentities, setLinkedIdentities] = useState<Identity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>('');
  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const [providerToUnlink, setProviderToUnlink] = useState<Provider | null>(null);

  // Fetch linked accounts on mount
  useEffect(() => {
    fetchLinkedAccounts();
  }, []);

  const fetchLinkedAccounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.identities) {
        setLinkedIdentities(user.identities as Identity[]);
      }
      if (user?.email) {
        setUserEmail(user.email);
      }
    } catch (error) {
      console.error('Failed to fetch linked accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isLinked = (provider: Provider) => {
    return linkedIdentities.some(identity => identity.provider === provider);
  };

  const handleConnect = async (provider: Provider) => {
    setLoadingProvider(provider);
    
    try {
      // Mark as linking to allow AuthCallback to bypass the relink block
      // Redirect to AuthCallback first to handle block cleanup, then it will redirect back to settings
      const redirectUrl = `${window.location.origin}/auth/callback`;
      
      const { data, error } = await supabase.auth.linkIdentity({
        provider: provider,
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        console.error(`Failed to connect ${provider}:`, error);
        toast.error(t('settings.sns_connect_failed', 'SNS 연결에 실패했습니다.'));
        sessionStorage.removeItem('ara_linking_in_progress');
        setLoadingProvider(null);
      }
      // linkIdentity redirects to the provider's login page
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error(t('settings.sns_connect_failed', 'SNS 연결에 실패했습니다.'));
      sessionStorage.removeItem('ara_linking_in_progress');
      setLoadingProvider(null);
    }
  };

  const openUnlinkModal = (provider: Provider) => {
    // Check if this is the last login method
    if (linkedIdentities.length === 1) {
      toast.error(t('settings.sns_unlink_last_method', '최소 1개의 로그인 방법이 필요합니다.'));
      return;
    }
    setProviderToUnlink(provider);
    setShowUnlinkModal(true);
  };

  const confirmUnlink = async () => {
    if (!providerToUnlink) return;

    const identity = linkedIdentities.find(i => i.provider === providerToUnlink);
    if (!identity) return;

    setLoadingProvider(providerToUnlink);
    setShowUnlinkModal(false);

    try {
      // Use custom RPC function with user_id, provider, and identity_id
      const { data, error } = await supabase.rpc('unlink_identity', {
        target_user_id: identity.user_id,
        provider_param: identity.provider,
        identity_id_param: identity.id  // Use provider's ID, not identity_id
      });

      if (error || !data?.success) {
        console.error(`Failed to unlink ${providerToUnlink}:`, error || data?.error);
        toast.error(t('settings.sns_unlink_failed', 'SNS 연결 해제에 실패했습니다.'));
      } else {
        toast.success(t('settings.sns_unlink_success', 'SNS 연결이 해제되었습니다.'));
        await fetchLinkedAccounts();
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error(t('settings.sns_unlink_failed', 'SNS 연결 해제에 실패했습니다.'));
    } finally {
      setLoadingProvider(null);
      setProviderToUnlink(null);
    }
  };

  const cancelUnlink = () => {
    setShowUnlinkModal(false);
    setProviderToUnlink(null);
  };

  const hasEmailPassword = linkedIdentities.some(i => i.provider === 'email');
  const hasGoogle = isLinked('google');
  const hasKakao = isLinked('kakao');

  const getProviderName = (provider: Provider | null) => {
    if (!provider) return '';
    return provider === 'google' ? 'Google' : 'Kakao';
  };

  return (
    <>
      <div className="flex flex-col h-full">
        {/* 내용 */}
        <div className="flex-1 min-h-0 px-4 md:px-6 py-4 md:py-5 space-y-4 md:space-y-5 bg-white dark:bg-secondary">
          {/* 안내 메시지 */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <p className="text-xs md:text-sm text-blue-800 dark:text-blue-200">
              {t('settings.sns_connect_desc', '소셜 계정을 연결하여 여러 방법으로 로그인할 수 있습니다.')}
            </p>
          </div>

          {/* 현재 연결된 계정 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              {t('settings.linked_accounts', '연결된 계정')}
            </h3>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Email/Password */}
                <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                  hasEmailPassword 
                    ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20' 
                    : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
                }`}>
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center">
                    <i className="ri-mail-line text-xl text-gray-600 dark:text-gray-300"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {t('settings.email', '이메일')}
                    </p>
                    {hasEmailPassword && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {userEmail}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                      hasEmailPassword
                        ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                    }`}>
                      {hasEmailPassword && <i className="ri-check-line"></i>}
                      {hasEmailPassword ? t('settings.connected', '연결됨') : t('settings.not_connected', '미연결')}
                    </span>
                  </div>
                </div>

                {/* Google */}
                <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                  hasGoogle 
                    ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20' 
                    : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
                }`}>
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white flex items-center justify-center">
                    <img src="/images/google_logo.png" alt="Google" className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Google
                    </p>
                    {hasGoogle && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('settings.social_login_active', '소셜 로그인 사용 가능')}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {hasGoogle ? (
                      <>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-xs font-medium">
                          <i className="ri-check-line"></i>
                          {t('settings.connected', '연결됨')}
                        </span>
                        {linkedIdentities.length > 1 && (
                          <button
                            onClick={() => openUnlinkModal('google')}
                            disabled={loadingProvider === 'google'}
                            className="px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            {loadingProvider === 'google' ? t('common.processing', '처리 중...') : t('settings.unlink', '해제')}
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={() => handleConnect('google')}
                        disabled={loadingProvider === 'google'}
                        className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        {loadingProvider === 'google' ? t('common.processing', '처리 중...') : t('settings.connect', '연결')}
                      </button>
                    )}
                  </div>
                </div>

                {/* Kakao */}
                <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                  hasKakao 
                    ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20' 
                    : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
                }`}>
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#FEE500] flex items-center justify-center">
                    <img src="/images/kakao_logo.png" alt="Kakao" className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Kakao
                    </p>
                    {hasKakao && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('settings.social_login_active', '소셜 로그인 사용 가능')}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {hasKakao ? (
                      <>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-xs font-medium">
                          <i className="ri-check-line"></i>
                          {t('settings.connected', '연결됨')}
                        </span>
                        {linkedIdentities.length > 1 && (
                          <button
                            onClick={() => openUnlinkModal('kakao')}
                            disabled={loadingProvider === 'kakao'}
                            className="px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            {loadingProvider === 'kakao' ? t('common.processing', '처리 중...') : t('settings.unlink', '해제')}
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={() => handleConnect('kakao')}
                        disabled={loadingProvider === 'kakao'}
                        className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        {loadingProvider === 'kakao' ? t('common.processing', '처리 중...') : t('settings.connect', '연결')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 하단 안내 */}
          <div className="pt-2">
            <p className="text-[11px] md:text-xs text-gray-400 dark:text-gray-500">
              💡 {t('settings.sns_connect_note', '여러 계정을 연결하면 모든 방법으로 로그인할 수 있습니다.')}
            </p>
          </div>
        </div>

        {/* 푸터 */}
        <div className="mt-auto border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-secondary px-4 md:px-6 py-3.5 md:py-4 flex justify-end">
          <Button type="button" variant="primary" size="md" onClick={onClose}>
            {t('settings.close', '닫기')}
          </Button>
        </div>
      </div>

      {/* 연결 해제 확인 모달 */}
      <Modal 
        isOpen={showUnlinkModal} 
        onClose={cancelUnlink} 
        title={t('settings.unlink_confirm_title', '계정 연결 해제')}
        className="max-w-md h-auto"
      >
        <div className="px-6 py-6">
          {/* 경고 아이콘 */}
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <i className="ri-error-warning-line text-2xl text-red-600 dark:text-red-400"></i>
            </div>
          </div>
          
          {/* 메시지 */}
          <div className="text-center space-y-3">
            <p className="text-base font-medium text-gray-900 dark:text-gray-100">
              {getProviderName(providerToUnlink)} {t('settings.sns_unlink_confirm_msg', '계정 연결을 해제하시겠습니까?')}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('settings.sns_unlink_warning', '연결을 해제하면 해당 방법으로 로그인할 수 없습니다.')}
            </p>
          </div>
        </div>
        {/* 버튼 */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
          <Button type="button" variant="secondary" size="md" onClick={cancelUnlink}>
            {t('common.cancel', '취소')}
          </Button>
          <button
            onClick={confirmUnlink}
            className="px-5 py-2.5 text-sm font-medium rounded-xl bg-red-600 text-white hover:bg-red-700 active:bg-red-800 transition-colors"
          >
            {t('settings.unlink', '해제')}
          </button>
        </div>
      </Modal>
    </>
  );
}

export default SNSConnect;
