import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useDirectChat } from '@/contexts/DirectChatContext';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation, matchPath } from 'react-router-dom';
import { toast } from 'sonner';

interface SidebarProps {
  onTweetClick?: () => void;
}

export default function Sidebar({ onTweetClick }: SidebarProps) {
  const { t } = useTranslation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const { chats } = useDirectChat();
  const unreadCount = chats.reduce((sum, chat) => sum + (chat.unread_count || 0), 0);

  const isHome = location.pathname === '/finalhome';
  // const detailMatch = matchPath({ path: '/finalhome/:id', end: true }, location.pathname);
  // const isTweetDetail =
  //   !!detailMatch &&
  //   !!detailMatch.params.id &&
  //   !['user', 'studyList', 'hometest', 'profileasap', 'chat', 'hnotifications'].includes(
  //     detailMatch.params.id,
  //   );
  // const actionLabel = isTweetDetail ? '댓글달기' : '게시하기';
  const showPostButton = isHome;

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    if (location.pathname.startsWith('/auth/callback')) return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, nickname, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) console.error('Failed to load profile:', error.message);
      else if (data) setProfile(data);
    };

    fetchProfile();

    const channel = supabase
      .channel(`sidebar-profile-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`,
        },
        async payload => {
          // 1. 실시간 이벤트 감지 시 바로 fetch로 최신 데이터 보장
          const { data, error } = await supabase
            .from('profiles')
            .select('id, user_id, nickname, avatar_url')
            .eq('user_id', user.id)
            .maybeSingle();

          if (!error && data) {
            setProfile(data);
          } else {
            // fallback: payload 기반 업데이트
            setProfile(prev => (prev ? { ...prev, ...payload.new } : (payload.new as Profile)));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleProfileClick = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('nickname')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error || !data) {
        console.error('프로필 정보를 가져오지 못했습니다:', error?.message);
        toast.error(t('common.error_profile_not_load'));
        return;
      }

      navigate(`/finalhome/user/${encodeURIComponent(data.nickname)}`);
    } catch (err: any) {
      console.error('프로필 이동 실패:', err.message);
      toast.error(t('common.error_navigate_profile'));
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const navigationItems = [
    { icon: 'ri-home-5-fill', label: t('nav.home'), path: '/finalhome' },
    { icon: 'ri-notification-3-line', label: t('nav.notifications'), path: '/finalhome/hnotifications' },
    { icon: 'ri-chat-3-line', label: t('nav.chat'), path: '/finalhome/chat' },
    { icon: 'ri-user-line', label: t('nav.profile'), onClick: handleProfileClick },
    { imgSrc: '/apple-touch-icon.png', label: t('nav.study'), path: '/studyList' },
  ];

  const handleNavigation = (path?: string, onClick?: () => void) => {
    if (onClick) onClick();
    else if (path) {
      if (path === '/finalhome') sessionStorage.removeItem('sns-last-tweet-id');
      navigate(path);
    }
  };

  return (
    <div className="relative h-full w-full bg-white dark:bg-background border-r-2 border-gray-100 dark:border-gray-700 flex flex-col px-3 lg:px-4 py-6 transition-all duration-300 z-30">
      <div className="flex justify-center lg:justify-center flex-shrink-0">
        <button
          onClick={() => {
            if (location.pathname === '/finalhome') {
              if (window.scrollY <= 5) {
                window.location.reload();
              } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            } else {
              sessionStorage.removeItem('sns-last-tweet-id');
              navigate('/finalhome');
            }
          }}
          className="cursor-pointer"
        >
          <img
            src="/images/sample_font_logo.png"
            alt="logo"
            className="w-20 h-auto object-contain"
          />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto">
        <ul className="space-y-2">
          {navigationItems.map((item, index) => {
            const isActive = item.path && location.pathname === item.path;
            const isChatItem = item.label === t('nav.chat'); // check against translated label
            return (
              <li key={index}>
                <button
                  onClick={() => handleNavigation(item.path, item.onClick)}
                  className={`w-full flex items-center justify-center lg:justify-start space-x-0 lg:space-x-4 px-2 lg:px-4 py-3 rounded-full transition-colors cursor-pointer whitespace-nowrap dark:text-gray-300 dark:hover:text-gray-400 ${
                    isActive
                      ? 'bg-primary/10 text-primary dark:bg-primary/20'
                      : 'hover:bg-primary/5 dark:hover:bg-primary/10 text-gray-700 dark:text-gray-100'
                  }`}
                >
                  {item.imgSrc ? (
                    <img
                      src={item.imgSrc}
                      alt={item.label}
                      className="w-6 h-6 object-contain flex-shrink-0"
                    />
                  ) : (
                    <div className="relative w-6 h-6 flex items-center justify-center flex-shrink-0">
                      <i className={`${item.icon} text-xl`} />
                      {isChatItem && unreadCount > 0 && !isActive && (
                        <span
                          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-[4px] rounded-full text-[11px] leading-[18px] text-white text-center font-semibold"
                          style={{ backgroundColor: '#00bfa5' }}
                        >
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </div>
                  )}
                  <span className="text-lg font-medium hidden lg:block truncate">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {showPostButton && (
          <button
            onClick={onTweetClick}
            className="w-full bg-primary hover:bg-primary/80 text-white font-bold py-3 px-2 lg:px-8 rounded-full mt-6 transition-colors cursor-pointer whitespace-nowrap"
          >
            <span className="hidden lg:block">{t('nav.post')}</span>
            <i className="ri-add-line text-xl lg:hidden"></i>
          </button>
        )}
      </nav>

      {profile && (
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center justify-center lg:justify-start space-x-0 lg:space-x-3 p-2 lg:p-3 rounded-full hover:bg-gray-100 dark:hover:bg-primary/10 transition-colors cursor-pointer"
          >
            <Avatar className="w-10 h-10">
              <AvatarImage src={profile.avatar_url || '/default-avatar.svg'} />
              <AvatarFallback>
                {profile.nickname ? profile.nickname.charAt(0).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left hidden lg:block min-w-0">
              <div className="font-bold text-gray-900 dark:text-gray-100 truncate">
                {profile.nickname}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                @{profile.user_id.slice(0, 6)}
              </div>
            </div>
            <i className="ri-more-fill text-gray-500 dark:text-gray-400 hidden lg:block flex-shrink-0"></i>
          </button>

          {showUserMenu && (
            <div className="absolute bottom-full left-0 w-full bg-white dark:bg-secondary rounded-2xl shadow-lg border border-gray-200 dark:border-secondary py-2 mb-2 min-w-48 z-[999]">
              <button
                onClick={() => {
                  handleProfileClick();
                  setShowUserMenu(false);
                }}
                className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-primary/10 dark:text-gray-100 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-user-line mr-3 flex-shrink-0" />
                <span className="lg:inline">{t('common.my_profile')}</span>
              </button>

              <button
                onClick={() => {
                  navigate('/settings');
                  setShowUserMenu(false);
                }}
                className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-primary/10 dark:text-gray-100 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-settings-3-line mr-3 flex-shrink-0" />
                <span className="lg:inline">{t('nav.settings')}</span>
              </button>

              <hr className="my-2 border-gray-200 dark:border-gray-700" />

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-primary/10 dark:text-gray-100 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-logout-box-line mr-3" />
                {t('auth.logout')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
