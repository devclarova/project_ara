import TweetDetail from '../homes/tweet/TweetDetail';
import SnsLayout from './SnsLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useSnsLoginGate } from '@/hooks/useSnsLoginGate';
import { SignInModal } from '@/components/auth/SignInModal';

export default function SnsDetailPage() {
  const { user } = useAuth();
  const { showLoginModal, handleLoginModalClose } = useSnsLoginGate(user);

  return (
    <>
      <SnsLayout hideSearchBar>
        <TweetDetail />
      </SnsLayout>

      {!user && <SignInModal isOpen={showLoginModal} onClose={handleLoginModalClose} />}
    </>
  );
}
