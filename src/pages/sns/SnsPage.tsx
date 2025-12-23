import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import SnsLayout from './SnsLayout';
import CommunityFeed from '../community/CommunityFeed';
import { SignInModal } from '@/components/auth/SignInModal';
import { useSnsLoginGate } from '@/hooks/useSnsLoginGate';

export default function SnsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const { showLoginModal, handleLoginModalClose } = useSnsLoginGate(user);

  return (
    <>
      <SnsLayout searchQuery={searchQuery} onSearchChange={setSearchQuery} hideSearchBar={false}>
        <CommunityFeed searchQuery={searchQuery} />
      </SnsLayout>

      {!user && <SignInModal isOpen={showLoginModal} onClose={handleLoginModalClose} />}
    </>
  );
}
