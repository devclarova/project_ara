import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { User, Settings, BookOpen, Users, MessageCircle, Bell } from 'lucide-react';
import { useDirectChat } from '@/contexts/DirectChatContext';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const [isOpen, setIsOpen] = useState(false); // 모바일 햄버거 메뉴
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false); // 데스크탑 프로필 드롭다운

  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  // 🔹 profiles 테이블 기반 프로필 정보
  const [profileNickname, setProfileNickname] = useState<string | null>(null);
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  // 🔹 알림 미읽음 개수
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  // 🔹 채팅 미읽음 개수
  const { chats } = useDirectChat();
  const unreadChatCount = chats.reduce((sum, chat) => sum + (chat.unread_count || 0), 0);

  // 로그인 여부에 따라 홈 목적지
  const homePath = user ? '/studyList' : '/';

  const menuItems = [
    { name: '학습', path: '/studyList', matchPaths: ['/studyList', '/study'] },
    { name: '커뮤니티', path: '/sns', matchPaths: ['/sns'] },
    { name: '채팅', path: '/chat', matchPaths: ['/chat'] },
    { name: '알림', path: '/hnotifications', matchPaths: ['/hnotifications'] },
    { name: '설정', path: '/settings', matchPaths: ['/settings'] },
  ];

  const isRouteActive = (item: (typeof menuItems)[number]) => {
    const path = location.pathname;
    if (item.name === 'Home') return path === '/' || path === '/home';
    return item.matchPaths.some(p => path.startsWith(p));
  };

  // ✅ 메뉴 이름별 아이콘 매핑 (모바일용)
  const getMenuIcon = (name: string) => {
    switch (name) {
      case '학습':
        return <BookOpen className="w-4 h-4" />;
      case '커뮤니티':
        return <Users className="w-4 h-4" />;
      case '채팅':
        return <MessageCircle className="w-4 h-4" />;
      case '알림':
        return <Bell className="w-4 h-4" />;
      case '설정':
        return <Settings className="w-4 h-4" />;
      default:
        return null;
    }
  };

  // ✅ 로고 클릭: 홈 이동 / 스크롤 / 새로고침
  const handleLogoClick = () => {
    const isOnHome = location.pathname === homePath;

    if (!isOnHome) {
      navigate(homePath);
      return;
    }

    if (window.scrollY > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.location.reload();
    }
  };

  // ✅ 1차 기본 닉네임: user_metadata → 이메일 → 기본문구
  const rawNickname =
    (user?.user_metadata as Record<string, unknown> | undefined)?.nickname &&
    typeof (user?.user_metadata as any).nickname === 'string'
      ? ((user!.user_metadata as any).nickname as string)
      : undefined;

  const fallbackNickname =
    rawNickname ?? (user?.email ? user.email.split('@')[0] : '로그인 해주세요');

  // ✅ Supabase profiles에서 id, nickname, avatar_url 가져오기
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setProfileNickname(null);
        setProfileAvatar(null);
        setProfileId(null);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('❌ 헤더 프로필 로드 실패:', error.message);
        return;
      }

      if (data) {
        setProfileNickname(data.nickname ?? null);
        setProfileAvatar(data.avatar_url ?? null);
        setProfileId(data.id ?? null);
      }
    };

    loadProfile();
  }, [user]);

  // ✅ 알림 미읽음 개수 계산 (receiver_id + is_read = false)
  useEffect(() => {
    if (!profileId) {
      setUnreadNotificationCount(0);
      return;
    }

    const fetchUnreadCount = async () => {
      const { error, count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', profileId)
        .eq('is_read', false);

      if (error) {
        console.error('❌ 알림 개수 불러오기 실패:', error.message);
        return;
      }

      setUnreadNotificationCount(count ?? 0);
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
  }, [profileId]);

  // 🔔 알림 전체 비우기 이벤트 감지 → 뱃지 0으로
  useEffect(() => {
    const handleCleared = () => {
      setUnreadNotificationCount(0);
    };

    window.addEventListener('notifications:cleared', handleCleared);
    return () => window.removeEventListener('notifications:cleared', handleCleared);
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
    item.name === 'Home' ? homePath : item.path;

  const handleSignout = async () => {
    await signOut();
    setIsOpen(false);
    setIsProfileMenuOpen(false);
    navigate('/');
  };

  // ✅ 실제 보여줄 값
  const displayNickname = profileNickname ?? fallbackNickname;
  const headerAvatar = profileAvatar ?? '/default-avatar.svg';

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 flex justify-between items-center px-4 sm:px-8 lg:px-36 py-2
                 border-b border-gray-200 bg-white
                 dark:border-gray-800 dark:bg-secondary"
    >
      <div className="flex items-center gap-4 sm:gap-6">
        <img
          onClick={handleLogoClick}
          src="/images/sample_font_logo.png"
          alt="Logo"
          className="w-14 sm:w-16 lg:w-20 cursor-pointer"
        />

        {/* 데스크탑 메뉴 (설정은 제거: 프로필 드롭다운에서만 접근) */}
        <div className="hidden md:flex gap-4 lg:gap-6">
          {menuItems
            .filter(item => item.name !== '설정')
            .map(item => {
              const active = isRouteActive(item);
              const target = targetOf(item);

              const isChat = item.name === '채팅';
              const isNotification = item.name === '알림';

              const showChatBadge = isChat && unreadChatCount > 0;
              const showNotificationBadge = isNotification && unreadNotificationCount > 0;

              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => navigate(target)}
                  aria-current={active ? 'page' : undefined}
                  className={`relative inline-flex items-center text-base lg:text-lg font-bold p-0 ${
                    active
                      ? 'text-primary hover:opacity-60'
                      : 'text-gray-500 hover:text-primary/60 dark:text-gray-300'
                  }`}
                >
                  <span>{item.name}</span>

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

      <div className="flex items-center">
        {/* 데스크탑 프로필 영역 */}
        <div className="hidden md:flex items-center gap-3 sm:gap-4">
          {user ? (
            <>
              {/* ✅ 프로필 버튼 + 드롭다운 (가운데 정렬) */}
              <div className="relative inline-flex">
                <button
                  ref={profileButtonRef}
                  type="button"
                  onClick={() => setIsProfileMenuOpen(prev => !prev)}
                  className="flex items-center gap-2 sm:gap-3 group"
                  title="내 프로필"
                  aria-expanded={isProfileMenuOpen}
                >
                  <Avatar className="w-9 h-9 sm:w-10 sm:h-10">
                    <AvatarImage src={headerAvatar} alt={displayNickname} />
                    <AvatarFallback>{displayNickname.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 group-hover:opacity-80">
                      {displayNickname}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">프로필 / 설정</span>
                  </div>
                </button>

                {isProfileMenuOpen && (
                  <div
                    ref={profileMenuRef}
                    className="absolute top-12 left-1/2 mt-2 w-64 -translate-x-1/2
                               rounded-xl border border-gray-100/80 bg-white/95
                               shadow-lg shadow-black/5 backdrop-blur-sm z-50
                               dark:bg-secondary/95 dark:border-gray-700/70 overflow-hidden"
                  >
                    {/* 상단 헤더 영역 */}
                    <div className="px-4 py-3 border-b border-gray-100/80 dark:border-gray-700/70">
                      <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
                        내 계정
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-50 truncate">
                        {displayNickname}
                      </p>
                    </div>

                    {/* 메뉴 리스트 */}
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          navigate('/profile');
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
                          <span className="font-medium">프로필</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            내 프로필 보기
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          navigate('/settings');
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
                          <span className="font-medium">설정</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            계정·알림·환경 설정
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleSignout}
                className="text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2 rounded
                           border border-gray-300 hover:bg-primary/10
                           dark:border-gray-700 dark:text-gray-100 dark:hover:bg-primary/20"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/signin')}
                className="bg-primary text-white text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2 rounded hover:opacity-80 transition-colors"
              >
                로그인
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2 rounded
                           border border-gray-300 hover:bg-gray-50
                           dark:border-gray-700 dark:text-gray-100 dark:hover:bg-primary/20"
              >
                회원가입
              </button>
            </>
          )}
        </div>

        {/* 모바일 햄버거 버튼 */}
        <button
          ref={buttonRef}
          className="md:hidden text-2xl font-bold px-2 text-gray-900 dark:text-gray-100"
          onClick={() => setIsOpen(prev => !prev)}
          aria-expanded={isOpen}
          aria-label="메뉴 열기"
        >
          ☰
        </button>
      </div>

      {/* 모바일 메뉴 */}
      {isOpen && (
        <div
          ref={menuRef}
          className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg
                     flex flex-col p-2 md:hidden z-50
                     dark:bg-secondary dark:border-gray-700"
        >
          {/* 맨 위 프로필 블록 */}
          <div
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-primary/20 cursor-pointer"
            onClick={() => {
              if (user) {
                navigate('/profile');
              } else {
                navigate('/signin');
              }
              setIsOpen(false);
            }}
          >
            <Avatar className="w-8 h-8">
              <AvatarImage src={headerAvatar} alt={displayNickname} />
              <AvatarFallback>{displayNickname.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {user ? displayNickname : '로그인 해주세요'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {user ? '내 프로필 보기' : '눌러서 로그인'}
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-100 dark:bg-primary/20 my-2" />

          {/* 메뉴 리스트: 아이콘 포함 */}
          <div className="flex flex-col">
            {menuItems
              .filter(item => item.name !== '설정' || !!user)
              .map(item => {
                const active = isRouteActive(item);
                const target = targetOf(item);
                const icon = getMenuIcon(item.name);

                const isChat = item.name === '채팅';
                const isNotification = item.name === '알림';

                const showChatBadge = isChat && unreadChatCount > 0;
                const showNotificationBadge = isNotification && unreadNotificationCount > 0;

                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      navigate(target);
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
                    <span>{item.name}</span>
                  </button>
                );
              })}
          </div>

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
                로그아웃
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    navigate('/signin');
                    setIsOpen(false);
                  }}
                  className="flex-1 px-3 py-2 rounded-lg
                             bg-primary text-white hover:opacity-90 text-sm"
                >
                  로그인
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigate('/signup');
                    setIsOpen(false);
                  }}
                  className="flex-1 px-3 py-2 rounded-lg
                             border border-gray-300 hover:bg-gray-50
                             dark:border-gray-700 dark:text-gray-100 dark:hover:bg-primary/20 text-sm"
                >
                  회원가입
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Header;
