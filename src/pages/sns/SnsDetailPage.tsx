/**
 * SNS 상세 인터랙션 레이어(SNS Detail Interaction Layer):
 * - 목적(Why): 특정 게시물에 대한 심층적 뷰와 답글 스레드를 제공하여 세션 체류 시간을 늘림
 * - 방법(How): 알림 컨텍스트 기반의 하이라이트 기능을 지원하고, 비인증 사용자의 접근을 통제하기 위한 로그인 게이트웨이를 연동함
 */
import TweetDetail from '../community/tweet/TweetDetail';
import SnsLayout from './SnsLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useSnsLoginGate } from '@/hooks/useSnsLoginGate';
import { SignInModal } from '@/components/auth/SignInModal';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function SnsDetailPage() {
  const { user } = useAuth();
  const { showLoginModal, handleLoginModalClose } = useSnsLoginGate(user);
  const location = useLocation();
  const state = location.state as { highlightCommentId?: string | null } | null;
  const [highlightCommentId, setHighlightCommentId] = useState<string | null>(
    state?.highlightCommentId ?? null,
  );

  return (
    <>
      <SnsLayout hideSearchBar>
        <TweetDetail />
      </SnsLayout>

      {!user && <SignInModal isOpen={showLoginModal} onClose={handleLoginModalClose} />}
    </>
  );
}
