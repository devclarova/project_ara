import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import RelinkAccountModal from '@/components/auth/RelinkAccountModal';

interface RelinkData {
  isOpen: boolean;
  reason?: 'same_email' | 'different_email';
  provider?: 'google' | 'kakao';
  originalEmailMasked?: string;
  currentUserId?: string;
  identityId?: string;
  providerName?: string;
}

const STORAGE_KEY = 'ara_relink_block_data';

export function useRelinkDetection() {
  const navigate = useNavigate();
  const [relinkData, setRelinkData] = useState<RelinkData>({ isOpen: false });

  // Load from storage on mount if needed
  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setRelinkData({ ...data, isOpen: true });
      } catch (e) {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const checkForRelink = async (user: any, skipSignOut: boolean = false) => {
    try {
      if (!user || !user.identities || user.identities.length === 0) return false;

      const latestIdentity = user.identities.sort(
        (a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      )[0];

      if (!['google', 'kakao'].includes(latestIdentity.provider || '')) return;

      const rpcParams = {
        current_user_id: user.id,
        provider_param: latestIdentity.provider,
        identity_id_param: latestIdentity.id,
        current_email_param: user.email || ''
      };

      const { data: checkResult, error } = await supabase.rpc('check_unlinked_identity', rpcParams);

      if (error) {
        console.error('[Relink] Check error:', error);
        return false;
      }

      if (checkResult?.should_block) {
        const blockData = {
          isOpen: true,
          reason: checkResult.reason as 'same_email' | 'different_email',
          provider: latestIdentity.provider as 'google' | 'kakao',
          originalEmailMasked: checkResult.original_email_masked,
          currentUserId: user.id,
          identityId: latestIdentity.id,
          providerName: latestIdentity.provider
        };

        // Save to storage and state
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(blockData));
        setRelinkData(blockData);
        
        if (!skipSignOut) {
          // SIGN OUT IMMEDIATELY
          await supabase.auth.signOut();
        }
        
        return true; // Blocked
      }

      return false; // Not blocked
    } catch (error) {
      console.error('[Relink] Unexpected error:', error);
      return false;
    }
  };

  const handleReconnect = async () => {
    try {
      // Just guide to email login
      sessionStorage.removeItem(STORAGE_KEY);
      await supabase.auth.signOut();

      toast.info(
        `기존 이메일 계정으로 로그인해주세요.\n` +
        `이전 계정: ${relinkData.originalEmailMasked}\n\n` +
        `로그인 후 [설정 > SNS 연결 관리]에서 직접 연결하실 수 있습니다.`,
        { duration: 6000 }
      );

      setRelinkData({ isOpen: false });
      navigate('/signin', { replace: true });
    } catch (error) {
      console.error('[Relink] Reconnect error:', error);
    }
  };

  const handleContinueNew = async () => {
    try {
      if (!relinkData.provider) return;

      // Set bypass flag and restart OAuth to go to social signup flow
      sessionStorage.setItem('ara_social_signup_bypass', 'true');
      sessionStorage.removeItem(STORAGE_KEY);
      await supabase.auth.signOut();

      toast.info(
        `${relinkData.provider === 'google' ? 'Google' : 'Kakao'} 계정으로 새로운 회원가입을 시작합니다.`,
        { duration: 4000 }
      );

      // Trigger OAuth again
      const { error } = await supabase.auth.signInWithOAuth({
        provider: relinkData.provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { prompt: 'select_account' }
        }
      });

      if (error) throw error;
      setRelinkData({ isOpen: false });
    } catch (error) {
      console.error('[Relink] Continue error:', error);
      toast.error('회원가입 요청 중 오류가 발생했습니다.');
      sessionStorage.removeItem('ara_social_signup_bypass');
    }
  };

  const handleCancel = async () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      setRelinkData({ isOpen: false });
      await supabase.auth.signOut();
      navigate('/signin', { replace: true });
    } catch (e) {}
  };

  const RelinkModal = () => {
    if (!relinkData.isOpen || !relinkData.reason || !relinkData.provider) return null;

    return (
      <RelinkAccountModal
        isOpen={relinkData.isOpen}
        reason={relinkData.reason}
        provider={relinkData.provider}
        originalEmailMasked={relinkData.originalEmailMasked}
        onReconnect={handleReconnect}
        onContinueNew={handleContinueNew}
        onCancel={handleCancel}
        onClose={handleCancel}
      />
    );
  };

  return { checkForRelink, RelinkModal, hasRelinkBlock: relinkData.isOpen };
}

