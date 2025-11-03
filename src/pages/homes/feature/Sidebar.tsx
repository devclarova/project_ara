// Sidebar.tsx

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation, matchPath } from 'react-router-dom'; // ✅ matchPath 추가

interface SidebarProps {
  onTweetClick?: () => void;
}

export default function Sidebar({ onTweetClick }: SidebarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  // ✅ 현재 경로가 트윗 상세 페이지인지 확인
  const detailMatch = matchPath({ path: '/finalhome/:id', end: true }, location.pathname);
  const isTweetDetail =
    !!detailMatch &&
    !!detailMatch.params.id &&
    !['user', 'studyList', 'hometest', 'profileasap'].includes(detailMatch.params.id);

  const actionLabel = isTweetDetail ? '댓글달기' : '게시하기';

  // ✅ DB에서 로그인한 유저의 프로필 불러오기
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, nickname, avatar_url')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Failed to load profile:', error.message);
      } else {
        setProfile(data);
      }
    };

    fetchProfile();
  }, [user]);

  // ✅ 로그아웃
  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  // ✅ 프로필 클릭 시 → 내 닉네임 기반 프로필 페이지로 이동
  const handleProfileClick = () => {
    if (profile?.nickname) {
      navigate(`/finalhome/user/${profile.nickname}`);
    } else {
      console.warn('⚠️ 닉네임 정보가 없습니다.');
    }
  };

  const navigationItems = [
    { icon: 'ri-home-5-fill', label: '홈', path: '/finalhome' },
    { icon: 'ri-notification-3-line', label: '알림', path: '/notifications1' },
    { icon: 'ri-chat-3-line', label: '채팅', path: '/finalhome/chat' },
    { icon: 'ri-user-line', label: '프로필', onClick: handleProfileClick },
    { icon: 'ri-youtube-line', label: '학습', path: '/studyList' },
  ];

  const handleNavigation = (path?: string, onClick?: () => void) => {
    if (onClick) onClick();
    else if (path) navigate(path);
  };

  return (
    <div className="h-full w-full bg-white border-r border-gray-200 flex flex-col px-3 lg:px-4 py-6 transition-all duration-300">
      {/* Logo */}
      <div className=" flex justify-center lg:justify-center flex-shrink-0">
        <button onClick={() => navigate('/')} className="cursor-pointer">
          {/* <h1
            className="text-2xl font-bold hidden lg:block"
            style={{ fontFamily: '"Pacifico", serif' }}
          >
            logo
          </h1> */}
          <img src="/images/sample_font_logo.png" alt="" className="w-20 h-auto object-contain" />
          {/* <div className="lg:hidden w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <i className="ri-twitter-fill text-white text-lg"></i>
          </div> */}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto">
        <ul className="space-y-2">
          {navigationItems.map((item, index) => (
            <li key={index}>
              <button
                onClick={() => handleNavigation(item.path, item.onClick)}
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

        {/* ✅ 게시하기 / 댓글달기 버튼 */}
        <button
          onClick={onTweetClick}
          className="w-full bg-primary hover:bg-primary/80 text-white font-bold py-3 px-2 lg:px-8 rounded-full mt-6 transition-colors cursor-pointer whitespace-nowrap"
        >
          <span className="hidden lg:block">{actionLabel}</span>
          <i className="ri-add-line text-xl lg:hidden"></i>
        </button>
      </nav>

      {/* User Profile */}
      {profile && (
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center justify-center lg:justify-start space-x-0 lg:space-x-3 p-2 lg:p-3 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <Avatar className="w-10 h-10">
              <AvatarImage src={profile.avatar_url || '/default-avatar.svg'} />
              <AvatarFallback>
                {profile.nickname ? profile.nickname.charAt(0).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left hidden lg:block min-w-0">
              <div className="font-bold text-gray-900 truncate">{profile.nickname}</div>
              <div className="text-sm text-gray-500 truncate">@{profile.user_id.slice(0, 6)}</div>
            </div>
            <i className="ri-more-fill text-gray-500 hidden lg:block flex-shrink-0"></i>
          </button>

          {showUserMenu && (
            <div className="absolute bottom-full left-0 w-full bg-white rounded-2xl shadow-lg border border-gray-200 py-2 mb-2 min-w-48 z-50">
              <button
                onClick={() => {
                  handleProfileClick();
                  setShowUserMenu(false);
                }}
                className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-user-line mr-3 flex-shrink-0"></i>
                <span className="lg:inline">내 프로필</span>
              </button>

              <button
                onClick={() => {
                  handleNavigation('/settings');
                  setShowUserMenu(false);
                }}
                className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-settings-3-line mr-3 flex-shrink-0"></i>
                <span className="lg:inline">Settings</span>
              </button>

              <hr className="my-2 border-gray-200" />

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-logout-box-line mr-3"></i>Logout
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
