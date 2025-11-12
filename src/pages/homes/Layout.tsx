import { Outlet, useLocation, matchPath } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './feature/Sidebar';
import TrendsPanel from './feature/TrendsPanel';
import TweetModal from './feature/TweetModal';
import ReplyModal from './feature/ReplyModal';
import { Helmet } from 'react-helmet-async';

export default function Layout() {
  const [showTweetModal, setShowTweetModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [newTweet, setNewTweet] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const location = useLocation();

  const isFinalHome =
    location.pathname.startsWith('/finalhome') && !location.pathname.includes('/studyList');

  const isTweetDetail =
    !!matchPath({ path: '/finalhome/:id', end: true }, location.pathname) &&
    !matchPath({ path: '/finalhome/user/:username' }, location.pathname);

  const handleTweetClick = () => {
    if (isTweetDetail) setShowReplyModal(true);
    else setShowTweetModal(true);
  };

  const isChatRoute =
    location.pathname.startsWith('/finalhome/chat') ||
    location.pathname.startsWith('/finalhome/dm');

  const isHomeRoute = location.pathname === '/finalhome';

  return (
    <>
      {isHomeRoute && (
        <Helmet>
          {/* ✅ 브라우저 탭 및 검색 결과 타이틀 */}
          <title>Home | ARA - Learn Korean through K-Culture</title>

          {/* ✅ 검색엔진 설명 (meta description) */}
          <meta
            name="description"
            content="전 세계 학습자들이 함께하는 ARA 홈 피드입니다. K-콘텐츠를 통해 한국어를 배우고, 친구들과 소통하며 각국의 문화를 즐겨보세요."
          />

          {/* ✅ 키워드 (검색엔진 보조용) */}
          <meta
            name="keywords"
            content="ARA, 한국어 학습, Learn Korean, Korean culture, K-POP, K-Drama, K-Culture, language exchange, feed, global learners"
          />

          {/* ✅ Open Graph (SNS 미리보기) */}
          <meta property="og:title" content="ARA Home - Learn Korean through K-Culture" />
          <meta
            property="og:description"
            content="K-콘텐츠로 한국어를 배우고, 세계 각국 학습자들과 소통하는 글로벌 홈 피드 ARA."
          />
          <meta property="og:image" content="/images/font_slogan_logo.png" />
          <meta property="og:url" content="https://project-ara.vercel.app/finalhome" />
          <meta property="og:type" content="website" />

          {/* ✅ Canonical (대표 URL) */}
          <link rel="canonical" href="https://project-ara.vercel.app/finalhome" />

          {/* ✅ Twitter 카드 */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="ARA Home - Learn Korean through K-Culture" />
          <meta
            name="twitter:description"
            content="한국어 학습자들이 함께 소통하는 ARA 홈 피드 — K-콘텐츠로 배우고, 문화를 나누세요!"
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

            <div
              className={
                isChatRoute
                  ? 'w-full max-w-[1120px] mx-6 relative'
                  : 'w-full max-w-2xl min-w-[320px] sm:min-w-[400px] mx-6 relative'
              }
            >
              <Outlet context={{ newTweet, setNewTweet, searchQuery }} />
            </div>

            {isFinalHome && !isChatRoute && (
              <div className="hidden xl:block w-80 flex-shrink-0">
                <div className="sticky top-0 h-screen">
                  <TrendsPanel searchQuery={searchQuery} onSearchChange={setSearchQuery} />
                </div>
              </div>
            )}
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
