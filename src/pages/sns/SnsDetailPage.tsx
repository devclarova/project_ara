import TweetDetail from '../homes/tweet/TweetDetail';
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
