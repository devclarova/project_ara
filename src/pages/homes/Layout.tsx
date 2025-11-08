import { Outlet, useLocation, matchPath } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './feature/Sidebar';
import TrendsPanel from './feature/TrendsPanel';
import TweetModal from './feature/TweetModal';
import ReplyModal from './feature/ReplyModal';

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

  return (
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
        <TweetModal onClose={() => setShowTweetModal(false)} onTweetCreated={t => setNewTweet(t)} />
      )}

      {showReplyModal && (
        <ReplyModal
          tweetId={location.pathname.split('/').pop()!}
          onClose={() => setShowReplyModal(false)}
        />
      )}
    </div>
  );
}
