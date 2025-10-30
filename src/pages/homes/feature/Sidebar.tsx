// Sidebar.tsx

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  onTweetClick?: () => void;
}

export default function Sidebar({ onTweetClick }: SidebarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    { icon: 'ri-home-5-fill', label: '홈', path: '/finalhome' },
    { icon: 'ri-search-line', label: '탐색', path: '/explore1' },
    { icon: 'ri-notification-3-line', label: '알림', path: '/notifications1' },
    { icon: 'ri-chat-3-line', label: '채팅', path: '/messages1' },
    // { icon: 'ri-bookmark-line', label: 'Bookmarks', path: '/bookmarks' },
    { icon: 'ri-user-line', label: '프로필', path: '/profiles1' },
    { icon: 'ri-youtube-line', label: 'Study', path: '/finalhome/studyList' },
    { icon: 'ri-more-line', label: '더보기', path: '/finalhome/hometest' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="h-full w-full bg-white border-r border-gray-200 flex flex-col px-3 lg:px-4 py-6 transition-all duration-300">
      {/* Logo */}
      <div className="mb-8 flex justify-center lg:justify-start flex-shrink-0">
        <button onClick={() => navigate('/')} className="cursor-pointer">
          <h1
            className="text-2xl font-bold hidden lg:block"
            style={{ fontFamily: '"Pacifico", serif' }}
          >
            logo
          </h1>
          <div className="lg:hidden w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <i className="ri-twitter-fill text-white text-lg"></i>
          </div>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto">
        <ul className="space-y-2">
          {navigationItems.map((item, index) => (
            <li key={index}>
              <button
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center justify-center lg:justify-start space-x-0 lg:space-x-4 px-2 lg:px-4 py-3 rounded-full transition-colors cursor-pointer whitespace-nowrap ${
                  location.pathname === item.path
                    ? 'bg-blue-50 text-primary'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <i
                  className={`${item.icon} text-xl w-6 h-6 flex items-center justify-center flex-shrink-0`}
                ></i>
                <span className="text-lg font-medium hidden lg:block truncate">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>

        {/* Tweet Button */}
        <button
          onClick={onTweetClick}
          className="w-full bg-primary hover:bg-primary/80 text-white font-bold py-3 px-2 lg:px-8 rounded-full mt-6 transition-colors cursor-pointer whitespace-nowrap"
        >
          <span className="hidden lg:block">게시하기</span>
          <i className="ri-add-line text-xl lg:hidden"></i>
        </button>
      </nav>

      {/* User Profile */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="w-full flex items-center justify-center lg:justify-start space-x-0 lg:space-x-3 p-2 lg:p-3 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <Avatar className="w-10 h-10">
            <AvatarImage src="/default-avatar.svg" alt="Sarah Johnson" />
            <AvatarFallback>SJ</AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left hidden lg:block min-w-0">
            <div className="font-bold text-gray-900 truncate">Sarah Johnson</div>
            <div className="text-sm text-gray-500 truncate">@sarahjohnson</div>
          </div>
          <i className="ri-more-fill text-gray-500 hidden lg:block flex-shrink-0"></i>{' '}
        </button>

        {/* Dropdown Menu */}
        {showUserMenu && (
          <div className="absolute bottom-full left-0 w-full lg:w-full bg-white rounded-2xl shadow-lg border border-gray-200 py-2 mb-2 min-w-48 z-50">
            <button
              onClick={() => {
                handleNavigation('/profile');
                setShowUserMenu(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-user-line mr-3 flex-shrink-0"></i>
              <span className="lg:inline">Profile</span>
            </button>
            <button className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors cursor-pointer whitespace-nowrap">
              <i className="ri-settings-3-line mr-3 flex-shrink-0"></i>
              <span className="lg:inline">Settings</span>
            </button>
            <hr className="my-2 border-gray-200" />
            <button className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors cursor-pointer whitespace-nowrap">
              <i className="ri-logout-box-line mr-3 flex-shrink-0"></i>
              <span className="lg:inline">Logout</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
