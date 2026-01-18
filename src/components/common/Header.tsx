import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { User, Settings, BookOpen, Users, MessageCircle, Bell, ShieldCheck, ShoppingBag } from 'lucide-react';
import { useDirectChat } from '@/contexts/DirectChatContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import ThemeSwitcher from '@/components/common/ThemeSwitcher';
import { OnlineIndicator } from './OnlineIndicator';

function Header() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false); // 모바일 햄버거 메뉴
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false); // 데스크탑 프로필 드롭다운
  const [langDropdownOpen, setLangDropdownOpen] = useState(false); // 모바일 언어 드롭다운 상태
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false); // 데스크탑 언어 드롭다운
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false); // 테마 드롭다운 상태
  const [mobileThemeOpen, setMobileThemeOpen] = useState(false); // 모바일 테마 드롭다운 상태
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const langRef = useRef<HTMLDivElement>(null); // 언어 선택 영역 ref
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  // profiles 테이블 기반 프로필 정보
  const [profileNickname, setProfileNickname] = useState<string | null>(null);
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  // 알림 미읽음 개수
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  // 채팅 미읽음 개수
  const { chats, blockedUserIds } = useDirectChat();
  const unreadChatCount = chats.reduce((sum, chat) => {
    // 차단한 유저의 채팅방이면 미읽음 카운트에서 제외
    if (blockedUserIds.has(chat.other_user.id)) return sum;
    return sum + (chat.unread_count || 0);
  }, 0);
  // 로그인 여부에 따라 홈 목적지
  const homePath = user ? '/studyList' : '/';
  const menuItems = [
    {
      key: 'study',
      label: t('nav.study'),
      path: '/studyList',
      matchPaths: ['/studyList', '/study'],
    },
    { key: 'community', label: t('nav.community'), path: '/sns', matchPaths: ['/sns'] },
    { key: 'goods', label: t('nav.goods'), path: '/goods', matchPaths: ['/goods'] },
    { key: 'chat', label: t('nav.chat'), path: '/chat', matchPaths: ['/chat'] },
    {
      key: 'notifications',
      label: t('nav.notifications'),
      path: '/hnotifications',
      matchPaths: ['/hnotifications'],
    },
    { key: 'settings', label: t('nav.settings'), path: '/settings', matchPaths: ['/settings'] },
  ];
  const isRouteActive = (item: (typeof menuItems)[number]) => {
    const path = location.pathname;
    if (item.key === 'home') return path === '/' || path === '/home';
    return item.matchPaths.some(p => path.startsWith(p));
  };
  // 메뉴 이름별 아이콘 매핑 (모바일용)
  const getMenuIcon = (key: string) => {
    switch (key) {
      case 'study':
        return <BookOpen className="w-4 h-4" />;
      case 'community':
        return <Users className="w-4 h-4" />;
      case 'chat':
        return <MessageCircle className="w-4 h-4" />;
      case 'notifications':
        return <Bell className="w-4 h-4" />;
      case 'goods':
        return <ShoppingBag className="w-4 h-4" />;
      case 'settings':
        return <Settings className="w-4 h-4" />;
      default:
        return null;
    }
  };
  // 로고 클릭: 홈이 아니면 홈으로 이동, 이미 홈이면 아무 동작 없음
  const handleLogoClick = () => {
    const isOnHome = location.pathname === homePath;
    if (!isOnHome) {
      navigate(homePath);
    }
    // 홈일 때는 스크롤/새로고침 동작 제거
  };
  // 1차 기본 닉네임: user_metadata → 이메일 → 기본문구
  const rawNickname =
    (user?.user_metadata as Record<string, unknown> | undefined)?.nickname &&
    typeof (user?.user_metadata as any).nickname === 'string'
      ? ((user!.user_metadata as any).nickname as string)
      : undefined;
  const fallbackNickname =
    rawNickname ?? (user?.email ? user.email.split('@')[0] : t('auth.please_login'));
  // Supabase profiles에서 id, nickname, avatar_url, is_admin 가져오기
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setProfileNickname(null);
        setProfileAvatar(null);
        setProfileId(null);
        setIsAdmin(false);
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_url, is_admin')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) {
        console.error('헤더 프로필 로드 실패:', error.message);
        return;
      }
      if (data) {
        setProfileNickname(data.nickname ?? null);
        setProfileAvatar(data.avatar_url ?? null);
        setProfileId(data.id ?? null);
        setIsAdmin(data.is_admin ?? false);
      }
    };
    loadProfile();
  }, [user]);
  // 알림 미읽음 개수 계산 (receiver_id + is_read = false)
  useEffect(() => {
    if (!profileId) {
      setUnreadNotificationCount(0);
      return;
    }
    const fetchUnreadCount = async () => {
      // 1. 모든 미이미 읽은 알림 가져오기 (필터링을 위해 sender_id 포함)
      const { data: unreadNotis, error } = await supabase
        .from('notifications')
        .select('id, sender_id')
        .eq('receiver_id', profileId)
        .eq('is_read', false);

      if (error) {
        console.error('알림 로드 실패:', error.message);
        return;
      }

      // 2. 차단한 사용자의 알림 필터링 + 자동 읽음 처리
      const blockedNotiIds = (unreadNotis || [])
        .filter(n => blockedUserIds.has(n.sender_id))
        .map(n => n.id);

      if (blockedNotiIds.length > 0) {
        // 차단된 알림은 백그라운드에서 읽음 처리
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .in('id', blockedNotiIds);
      }

      // 3. 실제 표시될 숫자 계산
      const validCount = (unreadNotis || []).filter(n => !blockedUserIds.has(n.sender_id)).length;
      setUnreadNotificationCount(validCount);
    };
    fetchUnreadCount();
    // 실시간 업데이트 구독 (알림 INSERT/UPDATE 시 다시 카운트)
    const channel = supabase
      .channel(`header-notifications-${profileId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `receiver_id=eq.${profileId}`,
        },
        () => {
          fetchUnreadCount();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId, blockedUserIds]);
  // 알림 전체 비우기 이벤트 감지 → 뱃지 0으로
  useEffect(() => {
    const handleCleared = () => {
      setUnreadNotificationCount(0);
    };
    // 단일 삭제 시 뱃지 1 감소
    const handleDeletedOne = () => {
      setUnreadNotificationCount(prev => Math.max(0, prev - 1));
    };
    // 프로필 업데이트 이벤트 감지
    const handleProfileUpdated = (event: CustomEvent<any>) => {
      const { nickname, avatar_url } = event.detail;
      if (nickname) setProfileNickname(nickname);
      if (avatar_url) setProfileAvatar(avatar_url);
    };

    window.addEventListener('notifications:cleared', handleCleared);
    window.addEventListener('notification:deleted-one', handleDeletedOne);
    window.addEventListener('profile:updated', handleProfileUpdated as EventListener);

    return () => {
      window.removeEventListener('notifications:cleared', handleCleared);
      window.removeEventListener('notification:deleted-one', handleDeletedOne);
      window.removeEventListener('profile:updated', handleProfileUpdated as EventListener);
    };
  }, []);
  // 외부 클릭 시 드롭다운 / 햄버거 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      // 모바일 햄버거 메뉴 닫기
      if (
        isOpen &&
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
      // 데스크톱 프로필 드롭다운 닫기
      if (
        isProfileMenuOpen &&
        profileMenuRef.current &&
        !profileMenuRef.current.contains(target) &&
        profileButtonRef.current &&
        !profileButtonRef.current.contains(target)
      ) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, isProfileMenuOpen]);
  const targetOf = (item: (typeof menuItems)[number]) =>
    item.key === 'home' ? homePath : item.path;
  const handleSignout = async () => {
    // 로그아웃 전에 즉시 상태 초기화 (타이밍 이슈 방지)
    setUnreadNotificationCount(0);
    setProfileNickname(null);
    setProfileAvatar(null);
    setProfileId(null);
    
    await signOut();
    setIsOpen(false);
    setIsProfileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/', { replace: true });
    }
  };
  // 실제 보여줄 값
  const displayNickname = profileNickname ?? fallbackNickname;
  const headerAvatar = profileAvatar ?? '/default-avatar.svg';
  return (
    <div
      className="fixed inset-x-0 top-0 z-[100] flex justify-between items-center px-4 sm:px-8 lg:px-12 xl:px-24 2xl:px-36 py-2
                 border-b border-gray-200 bg-white
                 dark:border-gray-800 dark:bg-secondary"
    >
      <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
        <img
          onClick={handleLogoClick}
          src="/images/sample_font_logo.png"
          alt="Logo"
          className="w-10 sm:w-14 lg:w-16 xl:w-20 cursor-pointer"
        />
        {/* 데스크탑 메뉴 (설정은 제거: 프로필 드롭다운에서만 접근) */}
        <div className="hidden lg:flex gap-2 lg:gap-4 xl:gap-5 2xl:gap-6">
          {menuItems
            .filter(item => item.key !== 'settings')
            .map(item => {
              const active = isRouteActive(item);
              const target = targetOf(item);
              const isChat = item.key === 'chat';
              const isNotification = item.key === 'notifications';
              const showChatBadge = isChat && unreadChatCount > 0;
              const showNotificationBadge = isNotification && unreadNotificationCount > 0;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    // 충돌 해결: sns 이동 시 스토리지 정리 + 같은 경로 0,0 스크롤
                    if (target === '/sns') {
                      sessionStorage.removeItem('sns-last-tweet-id');
                    }

                    if (location.pathname === target) {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else {
                      navigate(target);
                    }
                  }}
                  aria-current={active ? 'page' : undefined}
                  className={`relative inline-flex items-center text-xs md:text-sm lg:text-base font-bold p-0 whitespace-nowrap ${
                    active
                      ? 'text-primary hover:opacity-60'
                      : 'text-gray-500 hover:text-primary/60 dark:text-gray-300'
                  }`}
                >
                  <span>{item.label}</span>
                  {/* 채팅 뱃지 - 아주 살짝 오른쪽으로 이동 (-right-3) */}
                  {showChatBadge && (
                    <span
                      className="absolute -top-1 -right-3.5 min-w-[16px] h-[16px] text-[10px] px-[4px]
               rounded-full bg-primary text-white flex items-center justify-center
               whitespace-nowrap leading-none pointer-events-none"
                    >
                      {unreadChatCount > 99 ? '99+' : unreadChatCount}
                    </span>
                  )}
                  {/* 알림 뱃지 */}
                  {showNotificationBadge && (
                    <span
                      className="absolute -top-1 -right-3.5 min-w-[16px] h-[16px] text-[10px] px-[4px]
               rounded-full bg-primary text-white flex items-center justify-center
               whitespace-nowrap leading-none pointer-events-none"
                    >
                      {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                    </span>
                  )}
                </button>
              );
            })}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* 데스크탑 프로필 영역 */}
        <div className="hidden lg:flex items-center gap-2 lg:gap-3 flex-shrink-0 min-w-fit">
          <div className="hidden sm:block">
            <ThemeSwitcher
              open={isThemeMenuOpen}
              onOpenChange={open => {
                setIsThemeMenuOpen(open);
                if (open) {
                  setIsProfileMenuOpen(false);
                  setIsLangMenuOpen(false);
                }
              }}
            />
          </div>
          {/* 언어 선택 드롭다운 */}
          <div>
            <LanguageSwitcher
              open={isLangMenuOpen}
              onOpenChange={open => {
                setIsLangMenuOpen(open);
                if (open) {
                  setIsProfileMenuOpen(false);
                  setIsThemeMenuOpen(false);
                }
              }}
            />
          </div>
          {user ? (
            <>
              {/* 프로필 버튼 + 드롭다운 (가운데 정렬) */}
              <div className="relative inline-flex">
                <button
                  ref={profileButtonRef}
                  type="button"
                  onClick={() => {
                    setIsLangMenuOpen(false);
                    setIsThemeMenuOpen(false);
                    setIsProfileMenuOpen(prev => !prev);
                  }}
                  className="flex items-center gap-2 group"
                  title="내 프로필"
                  aria-expanded={isProfileMenuOpen}
                >
                  <Avatar className="w-9 h-9 sm:w-10 sm:h-10">
                    <AvatarImage src={headerAvatar} alt={displayNickname} />
                    <AvatarFallback>{displayNickname.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start min-w-0">
                    <div className="relative inline-flex items-center">
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:opacity-80 whitespace-nowrap">
                        {displayNickname}
                      </span>
                      <OnlineIndicator 
                        userId={user.id} 
                        size="sm" 
                        isOnlineOverride={true}
                        className="absolute -top-1 -right-2.5 z-10 border-white dark:border-secondary border-[1.5px] shadow-none" 
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {t('common.settings_desc')}
                    </span>
                  </div>
                </button>
                {isProfileMenuOpen && (
                  <div
                    ref={profileMenuRef}
                    className="absolute top-full left-1/2 mt-2 w-64 -translate-x-1/2
                               rounded-xl border border-gray-100/80 bg-white/95
                               shadow-lg shadow-black/5 backdrop-blur-sm z-[200]
                               dark:bg-secondary/95 dark:border-gray-700/70 overflow-hidden"
                  >
                    {/* 메뉴 리스트 */}
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (location.pathname !== '/profile') {
                            navigate('/profile');
                          }
                          setIsProfileMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm
                                   text-gray-700 dark:text-gray-100
                                   hover:bg-primary/5 dark:hover:bg-primary/20
                                   transition-colors"
                      >
                        <span
                          className="inline-flex items-center justify-center rounded-md p-1.5
                                     bg-primary/5 text-primary dark:bg-primary/20"
                        >
                          <User className="w-4 h-4" />
                        </span>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{t('nav.profile')}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {t('common.view_profile')}
                          </span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (location.pathname !== '/settings') {
                            navigate('/settings');
                          }
                          setIsProfileMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm
                                   text-gray-700 dark:text-gray-100
                                   hover:bg-primary/5 dark:hover:bg-primary/20
                                   transition-colors"
                      >
                        <span
                          className="inline-flex items-center justify-center rounded-md p-1.5
                                     bg-gray-100 text-gray-500
                                     dark:bg-gray-800 dark:text-gray-300"
                        >
                          <Settings className="w-4 h-4" />
                        </span>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{t('nav.settings')}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {t('common.settings_desc')}
                          </span>
                        </div>
                      </button>

                      {/* Admin Mode - Only visible if is_admin */}
                      {isAdmin && (
                        <>
                          {/* Separator for admin section */}
                          <div className="h-px bg-gray-100 dark:bg-gray-700/70 my-1" />
                          <button
                            type="button"
                            onClick={() => {
                              navigate('/admin');
                              setIsProfileMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm
                                       text-gray-700 dark:text-gray-100
                                       hover:bg-primary/5 dark:hover:bg-primary/20
                                       transition-colors"
                          >
                            <span
                              className="inline-flex items-center justify-center rounded-md p-1.5
                                         bg-red-50 text-red-600
                                         dark:bg-red-900/20 dark:text-red-400"
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </span>
                            <div className="flex flex-col items-start">
                              <span className="font-medium">{t('nav.admin')}</span>
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                {t('nav.admin_dashboard')}
                              </span>
                            </div>
                          </button>
                        </>
                      )}
                      
                      {/* 로그아웃 버튼 - 드롭다운 하단에 작은 텍스트로 */}
                      <div className="px-4 pt-2 pb-3 border-t border-gray-100/80 dark:border-gray-700/70 mt-1">
                        <button
                          type="button"
                          onClick={handleSignout}
                          className="w-full text-center text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors py-1.5"
                        >
                          {t('auth.logout')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  if (location.pathname !== '/signin') {
                    navigate('/signin');
                  }
                }}
                className="bg-primary text-white text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2 rounded hover:opacity-80 transition-colors"
              >
                {t('auth.login')}
              </button>
              <button
                onClick={() => {
                  if (location.pathname !== '/signup') {
                    navigate('/signup');
                  }
                }}
                className="text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2 rounded
                           border border-gray-300 hover:bg-gray-50
                           dark:border-gray-700 dark:text-gray-100 dark:hover:bg-primary/20"
              >
                {t('auth.signup')}
              </button>
            </>
          )}
        </div>
        <div
          className="lg:hidden flex items-center gap-0" // 간격을 동일하게 하기 위해 gap-0 또는 gap-1 사용
          onClick={e => {
            e.stopPropagation();
          }}
        >
          <div ref={langRef} className="flex items-center gap-0">
            <ThemeSwitcher
              open={mobileThemeOpen}
              onOpenChange={open => {
                setMobileThemeOpen(open);
                if (open) {
                  setLangDropdownOpen(false);
                  setIsOpen(false);
                }
              }}
            />
            <LanguageSwitcher
              open={langDropdownOpen}
              onOpenChange={open => {
                setLangDropdownOpen(open);
                if (open) {
                  // 언어가 열리면 햄버거 닫기
                  setIsOpen(false);
                  setMobileThemeOpen(false);
                }
              }}
            />
          </div>
          <button
            ref={buttonRef}
            className="relative flex items-center justify-center w-10 h-10 text-2xl font-bold text-gray-900 dark:text-gray-100 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            onClick={e => {
              e.stopPropagation();
              // 언어/테마 드롭다운 닫기
              setLangDropdownOpen(false);
              setMobileThemeOpen(false);
              // 햄버거 토글
              setIsOpen(prev => !prev);
            }}
            aria-expanded={isOpen}
            aria-label={t('common.more')}
          >
            ☰
            {unreadChatCount + unreadNotificationCount > 0 && (
              <span
                className="absolute top-0 right-0 min-w-[16px] h-[16px] text-[10px] px-[3px]
                           rounded-full bg-primary text-white flex items-center justify-center
                           whitespace-nowrap leading-none border border-white dark:border-gray-800"
              >
                {unreadChatCount + unreadNotificationCount > 99
                  ? '99+'
                  : unreadChatCount + unreadNotificationCount}
              </span>
            )}
          </button>
        </div>
      </div>
      {/* 모바일 메뉴 */}
      <div
        ref={menuRef}
        className={`absolute top-full right-0 -mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg
                   flex flex-col p-2 lg:hidden z-[150]
                   dark:bg-secondary dark:border-gray-700
                   transition-all duration-300 ease-in-out
                   ${
                     isOpen
                       ? 'opacity-100 scale-100 pointer-events-auto'
                       : 'opacity-0 scale-95 pointer-events-none'
                   }`}
      >
        {/* 맨 위 프로필 블록 */}
        <div
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-primary/20 cursor-pointer"
          onClick={() => {
            if (user) {
              if (location.pathname !== '/profile') {
                navigate('/profile');
              }
            } else {
              if (location.pathname !== '/signin') {
                navigate('/signin');
              }
            }
            setIsOpen(false);
          }}
        >
          <Avatar className="w-8 h-8">
            <AvatarImage src={headerAvatar} alt={displayNickname} />
            <AvatarFallback>
              {user ? (
                displayNickname.charAt(0).toUpperCase()
              ) : (
                <User className="w-4 h-4 text-gray-400" />
              )}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="relative inline-flex items-center">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {user ? displayNickname : t('auth.please_login')}
              </div>
              {user && (
                <OnlineIndicator 
                  userId={user.id} 
                  size="sm" 
                  isOnlineOverride={true}
                  className="absolute -top-1 -right-2.5 z-10 border-white dark:border-secondary border-[1.5px] shadow-none" 
                />
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {user ? t('common.view_profile') : t('auth.click_to_login')}
            </div>
          </div>
        </div>
        <div className="h-px bg-gray-100 dark:bg-primary/20 my-2" />
        {/* 메뉴 리스트: 아이콘 포함 */}
        <div className="flex flex-col">
          {menuItems
            .filter(item => item.key !== 'settings' || !!user)
            .map(item => {
              const active = isRouteActive(item);
              const target = targetOf(item);
              const icon = getMenuIcon(item.key);
              const isChat = item.key === 'chat';
              const isNotification = item.key === 'notifications';
              const showChatBadge = isChat && unreadChatCount > 0;
              const showNotificationBadge = isNotification && unreadNotificationCount > 0;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    // 충돌 해결: sns 이동 시 스토리지 정리 + 같은 경로 0,0 스크롤
                    if (target === '/sns') {
                      sessionStorage.removeItem('sns-last-tweet-id');
                    }
                    if (location.pathname === target) {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else {
                      navigate(target);
                    }
                    setIsOpen(false);
                  }}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm
                      ${
                        active
                          ? 'bg-primary text-white'
                          : 'text-gray-600 hover:bg-primary/10 dark:text-gray-300 dark:hover:bg-primary/20'
                      }`}
                >
                  {icon && (
                    <span
                      className={`relative inline-flex items-center justify-center p-1.5 rounded-md ${
                        active
                          ? 'bg-white/20'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300'
                      }`}
                    >
                      {icon}
                      {/* 채팅 뱃지 - 살짝 더 오른쪽으로 이동 (-right-2) */}
                      {showChatBadge && (
                        <span
                          className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-[3px]
                                       rounded-full text-[10px] leading-[16px]
                                       text-white text-center font-semibold bg-primary"
                        >
                          {unreadChatCount > 99 ? '99+' : unreadChatCount}
                        </span>
                      )}
                      {/* 알림 뱃지 - 살짝 더 오른쪽으로 이동 (-right-2) */}
                      {showNotificationBadge && (
                        <span
                          className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-[3px]
                                       rounded-full text-[10px] leading-[16px]
                                       text-white text-center font-semibold bg-primary"
                        >
                          {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                        </span>
                      )}
                    </span>
                  )}
                  <span>{item.label}</span>
                </button>
              );
            })}
        </div>
        {/* Admin Menu Item - Mobile */}
        {user && isAdmin && (
          <>
            <div className="h-px bg-gray-100 dark:bg-primary/20 my-2" />
            <button
              type="button"
              onClick={() => {
                navigate('/admin');
                setIsOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm
                         text-gray-600 hover:bg-primary/10 dark:text-gray-300 dark:hover:bg-primary/20"
            >
              <span className="inline-flex items-center justify-center rounded-md p-1.5
                               bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <span>{t('nav.admin')}</span>
            </button>
          </>
        )}
        <div className="h-px bg-gray-100 dark:bg-primary/20 my-2" />
        <div className="flex gap-2">
          {user ? (
            <button
              type="button"
              onClick={handleSignout}
              className="flex-1 px-3 py-2 rounded-lg
                           bg-gray-100 hover:bg-gray-200
                           dark:bg-primary/60 dark:hover:bg-primary/80 dark:text-gray-100 text-sm"
            >
              {t('auth.logout')}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  if (location.pathname !== '/signin') {
                    navigate('/signin');
                  }
                  setIsOpen(false);
                }}
                className="flex-1 px-3 py-2 rounded-lg
                             bg-primary text-white hover:opacity-90 text-sm"
              >
                {t('auth.login')}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (location.pathname !== '/signup') {
                    navigate('/signup');
                  }
                  setIsOpen(false);
                }}
                className="flex-1 px-3 py-2 rounded-lg
                             border border-gray-300 hover:bg-gray-50
                             dark:border-gray-700 dark:text-gray-100 dark:hover:bg-primary/20 text-sm"
              >
                {t('auth.signup')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
export default Header;
