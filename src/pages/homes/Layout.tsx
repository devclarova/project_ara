// ✅ Layout.tsx
import { Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './feature/Sidebar';
import TrendsPanel from './feature/TrendsPanel';
import TweetModal from './feature/TweetModal';

export default function Layout() {
  const [showTweetModal, setShowTweetModal] = useState(false);
  const [newTweet, setNewTweet] = useState(null); // ✅ 새 트윗 상태 추가
  const location = useLocation();
  const isFinalHome =
    location.pathname.startsWith('/finalhome') && !location.pathname.includes('/studyList');

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <div className="flex justify-center min-h-screen">
        <div className="flex w-full max-w-7xl">
          {/* Left Sidebar */}
          <div className="w-20 lg:w-64 flex-shrink-0">
            <div className="fixed w-20 lg:w-64 h-full z-10">
              <Sidebar onTweetClick={() => setShowTweetModal(true)} />
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
          onTweetCreated={tweet => setNewTweet(tweet)} // 새 트윗 데이터 저장
        />
      )}
    </div>
  );
}
