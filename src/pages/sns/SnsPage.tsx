import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import SnsLayout from './SnsLayout';
import Home from '../homes/Home';
import { SignInModal } from '@/components/auth/SignInModal';
import { useSnsLoginGate } from '@/hooks/useSnsLoginGate';

export default function SnsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const { showLoginModal, handleLoginModalClose } = useSnsLoginGate(user);

  return (
    <>
      <SnsLayout searchQuery={searchQuery} onSearchChange={setSearchQuery} hideSearchBar={false}>
        <Home searchQuery={searchQuery} />
      </SnsLayout>

      {!user && <SignInModal isOpen={showLoginModal} onClose={handleLoginModalClose} />}
    </>
  );
}
