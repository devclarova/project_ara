// Layout.tsx

// src/pages/ShellLayout.tsx
import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './feature/Sidebar';
import TrendsPanel from './feature/TrendsPanel';
import TweetModal from './feature/TweetModal';

export default function Layout() {
  const [showTweetModal, setShowTweetModal] = useState(false);

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

          {/* Central Outlet */}
          <div className="w-full max-w-2xl min-w-[320px] sm:min-w-[400px] mx-6 relative">
            <div className=" border-gray-200 relative">
              <Outlet />
            </div>
          </div>

          {/* Right Trends */}
          {/* <div className="hidden xl:block w-80 flex-shrink-0">
            <div className="sticky top-0 h-screen">
              <div className=" h-full">
                <TrendsPanel />
              </div>
            </div>
          </div> */}
        </div>
      </div>

      {showTweetModal && <TweetModal onClose={() => setShowTweetModal(false)} />}
    </div>
  );
}
