/**
 * 커뮤니티 전용 레이아웃 구성 엔진(Community Layout Configuration Engine):
 * - 목적(Why): 앱의 커뮤니티 도메인에 한하여 사이드바, 메인 콘텐츠 라우팅, 실시간 트렌드 패널을 유기적으로 통합함
 * - 방법(How): React Router의 Outlet을 통한 뷰포트 관리, SEO를 위한 Helmet 메타태그 동적 생성 및 작성 모달(TweetModal, ReplyModal)의 전역 상태를 오케스트레이션함
 */
import { Outlet, useLocation, matchPath } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './feature/Sidebar';
import TrendsPanel from './feature/TrendsPanel';
import TweetModal from './feature/TweetModal';
import ReplyModal from './feature/ReplyModal';
import { Helmet } from 'react-helmet-async';
import type { FeedItem } from '@/types/sns';
import { useTranslation } from 'react-i18next';

export default function CommunityLayout() {
  const { t } = useTranslation();
  const [showTweetModal, setShowTweetModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [newTweet, setNewTweet] = useState<FeedItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const location = useLocation();

  const isCommunityHome = location.pathname === '/community';

  const isTweetDetail =
    !!matchPath({ path: '/community/:id', end: true }, location.pathname) &&
    !matchPath({ path: '/community/user/:username' }, location.pathname);

  const handleTweetClick = () => {
    if (isTweetDetail) setShowReplyModal(true);
    else setShowTweetModal(true);
  };

  return (
    <>
      {isCommunityHome && (
        <Helmet>
          {/* ✅ 브라우저 탭 및 검색 결과 타이틀 */}
          <title>{t('community.seo.title')}</title>

          {/* ✅ 검색엔진 설명 (meta description) */}
          <meta
            name="description"
            content={t('community.seo.description')}
          />

          {/* ✅ 키워드 (검색엔진 보조용) */}
          <meta
            name="keywords"
            content={t('community.seo.keywords')}
          />

          {/* ✅ Open Graph (SNS 미리보기) */}
          <meta property="og:title" content={t('community.seo.og_title')} />
          <meta
            property="og:description"
            content={t('community.seo.og_description')}
          />
          <meta property="og:image" content="/images/font_slogan_logo.png" />
          <meta property="og:url" content="https://project-ara.vercel.app/community" />
          <meta property="og:type" content="website" />

          {/* ✅ Canonical (대표 URL) */}
          <link rel="canonical" href="https://project-ara.vercel.app/community" />

          {/* ✅ Twitter 카드 */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={t('community.seo.og_title')} />
          <meta
            name="twitter:description"
            content={t('community.seo.og_description')}
          />
          <meta name="twitter:image" content="/images/font_slogan_logo.png" />
        </Helmet>
      )}

      <div className="min-h-screen bg-white dark:bg-background overflow-x-hidden">
        <div className="flex justify-center min-h-screen">
          <div className="flex w-full max-w-7xl">
            <div className="w-20 lg:w-64 flex-shrink-0">
              <div className="fixed w-20 lg:w-64 h-full z-10">
                <Sidebar onTweetClick={handleTweetClick} />
              </div>
            </div>

            <div className="w-full max-w-2xl min-w-[320px] sm:min-w-[400px] mx-6 relative">
              <Outlet context={{ newTweet, setNewTweet, searchQuery }} />
            </div>

            <div className="hidden xl:block w-80 flex-shrink-0">
              <div className="sticky top-0 h-screen">
                <TrendsPanel searchQuery={searchQuery} onSearchChange={setSearchQuery} />
              </div>
            </div>
          </div>
        </div>

        {showTweetModal && (
          <TweetModal
            onClose={() => setShowTweetModal(false)}
            onTweetCreated={t => setNewTweet(t)}
          />
        )}

        {showReplyModal && (
          <ReplyModal
            tweetId={location.pathname.split('/').pop()!}
            onClose={() => setShowReplyModal(false)}
          />
        )}
      </div>
    </>
  );
}
