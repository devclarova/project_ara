// ✅ Layout.tsx
import { Outlet, useLocation, matchPath } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './feature/Sidebar';
import TrendsPanel from './feature/TrendsPanel';
import TweetModal from './feature/TweetModal';
import ReplyModal from './feature/ReplyModal'; // ✅ 새로 추가 (ReplyModal 존재한다고 가정)

export default function Layout() {
  const [showTweetModal, setShowTweetModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false); // ✅ 댓글용 모달 상태
  const [newTweet, setNewTweet] = useState(null);
  const location = useLocation();

  // ✅ 경로 판별
  const isFinalHome =
    location.pathname.startsWith('/finalhome') && !location.pathname.includes('/studyList');

  const isTweetDetail =
    !!matchPath({ path: '/finalhome/:id', end: true }, location.pathname) &&
    !matchPath({ path: '/finalhome/user/:username' }, location.pathname);

  // ✅ 게시/댓글 버튼 클릭 시 동작
  const handleTweetClick = () => {
    if (isTweetDetail) setShowReplyModal(true);
    else setShowTweetModal(true);
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <div className="flex justify-center min-h-screen">
        <div className="flex w-full max-w-7xl">
          {/* Left Sidebar */}
          <div className="w-20 lg:w-64 flex-shrink-0">
            <div className="fixed w-20 lg:w-64 h-full z-10">
              <Sidebar onTweetClick={handleTweetClick} /> {/* ✅ 경로별로 모달 분기 */}
            </div>
          </div>

          {/* Central Outlet → Home으로 새 트윗 전달 */}
          <div className="w-full max-w-2xl min-w-[320px] sm:min-w-[400px] mx-6 relative">
            <Outlet context={{ newTweet, setNewTweet }} />
          </div>

          {/* Right Trends */}
          {isFinalHome && (
            <div className="hidden xl:block w-80 flex-shrink-0">
              <div className="sticky top-0 h-screen">
                <TrendsPanel />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ✅ 트윗 작성 모달 */}
      {showTweetModal && (
        <TweetModal
          onClose={() => setShowTweetModal(false)}
          onTweetCreated={tweet => setNewTweet(tweet)}
        />
      )}

      {/* ✅ 댓글 작성 모달 */}
      {showReplyModal && (
        <ReplyModal
          tweetId={location.pathname.split('/').pop()!} // URL 마지막 부분을 tweetId로 전달
          onClose={() => setShowReplyModal(false)}
        />
      )}
    </div>
  );
}
