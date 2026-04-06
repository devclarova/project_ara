/**
 * SNS 커뮤니티 엔진(SNS Community Engine):
 * - 목적(Why): 전역 피드 탐색 및 실시간 검색을 제공하여 커뮤니티 참여를 극대화함
 * - 방법(How): SnsLayout과 계층형 라우팅을 오케스트레이션하며, 인증 상태에 따른 접근 제어(Login Gate)로 보안성을 확보함
 */
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import SnsLayout from './SnsLayout';
import CommunityFeed from '../community/CommunityFeed';
import { SignInModal } from '@/components/auth/SignInModal';
import { useSnsLoginGate } from '@/hooks/useSnsLoginGate';

export default function SnsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const { showLoginModal, handleLoginModalClose } = useSnsLoginGate(user);

  useEffect(() => {
    document.title = '커뮤니티 | ARA';
  }, []);

  return (
    <>
      <SnsLayout searchQuery={searchQuery} onSearchChange={setSearchQuery} hideSearchBar={false}>
        <CommunityFeed searchQuery={searchQuery} />
      </SnsLayout>

      {!user && <SignInModal isOpen={showLoginModal} onClose={handleLoginModalClose} />}
    </>
  );
}
