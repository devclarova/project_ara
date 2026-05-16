/**
 * SNS 커뮤니티 엔진(SNS Community Engine):
 * - 목적(Why): 전역 피드 탐색 및 실시간 검색을 제공하여 커뮤니티 참여를 극대화함
 * - 방법(How): SnsLayout과 계층형 라우팅을 오케스트레이션하며, 인증 상태에 따른 접근 제어(Login Gate)로 보안성을 확보함
 */
import { SignInModal } from '@/components/auth/SignInModal';
import { useAuth } from '@/contexts/AuthContext';
import { useSnsLoginGate } from '@/hooks/useSnsLoginGate';
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import CommunityFeed from '../community/CommunityFeed';
import SnsLayout from './SnsLayout';

export default function SnsPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const { showLoginModal, handleLoginModalClose } = useSnsLoginGate(user);

  return (
    <>
      <Helmet>
        <title>{t('community.seo.title')}</title>
        <meta name="description" content={t('community.seo.description')} />
        <meta name="keywords" content={t('community.seo.keywords')} />

        {/* Open Graph - 카톡/페북 등 공유 미리보기 */}
        <meta property="og:title" content={t('community.seo.og_title')} />
        <meta property="og:description" content={t('community.seo.og_description')} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://arakorean.com/community" />

        {/* Twitter / X 공유 미리보기 */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={t('community.seo.og_title')} />
        <meta name="twitter:description" content={t('community.seo.og_description')} />

        {/* 대표 URL */}
        <link rel="canonical" href="https://arakorean.com/community" />
      </Helmet>

      <SnsLayout searchQuery={searchQuery} onSearchChange={setSearchQuery} hideSearchBar={false}>
        <CommunityFeed searchQuery={searchQuery} />
      </SnsLayout>

      {!user && <SignInModal isOpen={showLoginModal} onClose={handleLoginModalClose} />}
    </>
  );
}
