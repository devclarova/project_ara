import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 🔹 profiles 테이블 기반 프로필 정보
  const [profileNickname, setProfileNickname] = useState<string | null>(null);
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);

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

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const targetOf = (item: (typeof menuItems)[number]) =>
    item.name === 'Home' ? homePath : item.path;

  const handleSignout = async () => {
    await signOut();
    setIsOpen(false);
    navigate('/');
  };

  // ✅ 1차 기본 닉네임: user_metadata → 이메일 → 기본문구
  const rawNickname =
    (user?.user_metadata as Record<string, unknown> | undefined)?.nickname &&
    typeof (user?.user_metadata as any).nickname === 'string'
      ? ((user!.user_metadata as any).nickname as string)
      : undefined;

  const fallbackNickname =
    rawNickname ?? (user?.email ? user.email.split('@')[0] : '로그인 해주세요');

  // ✅ Supabase profiles에서 nickname, avatar_url 가져오기
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setProfileNickname(null);
        setProfileAvatar(null);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('nickname, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('❌ 헤더 프로필 로드 실패:', error.message);
        return;
      }

      if (data) {
        if (data.nickname) setProfileNickname(data.nickname);
        if (data.avatar_url) setProfileAvatar(data.avatar_url);
      }
    };

    loadProfile();
  }, [user]);

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

        {/* 데스크탑 메뉴 */}
        <div className="hidden md:flex gap-4 lg:gap-6">
          {menuItems.map(item => {
            const active = isRouteActive(item);
            const target = targetOf(item);
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => navigate(target)}
                aria-current={active ? 'page' : undefined}
                className={`text-base lg:text-lg font-bold p-0 ${
                  active
                    ? 'text-primary hover:opacity-60'
                    : 'text-gray-500 hover:text-primary/60 dark:text-gray-300'
                }`}
              >
                {item.name}
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
              {/* ✅ 클릭 시 항상 /profile 로 이동 */}
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 sm:gap-3 group"
                title="내 프로필"
              >
                <Avatar className="w-9 h-9 sm:w-10 sm:h-10">
                  <AvatarImage src={headerAvatar} alt={displayNickname} />
                  <AvatarFallback>{displayNickname.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 group-hover:opacity-80">
                    {displayNickname}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">프로필 보기</span>
                </div>
              </button>

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
          className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg
                     flex flex-col p-2 md:hidden z-50
                     dark:bg-secondary dark:border-gray-700"
        >
          <div
            className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 dark:hover:bg-primary/20 cursor-pointer"
            onClick={() => {
              if (user) {
                navigate('/profile'); // ✅ 여기서도 /profile
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

          {/* 메뉴 리스트 */}
          <div className="flex flex-col">
            {menuItems.map(item => {
              const active = isRouteActive(item);
              const target = targetOf(item);
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => {
                    navigate(target);
                    setIsOpen(false);
                  }}
                  aria-current={active ? 'page' : undefined}
                  className={`text-left px-3 py-2 rounded ${
                    active
                      ? 'bg-primary text-white'
                      : 'text-gray-500 hover:bg-primary/20 dark:text-gray-300 dark:hover:bg-primary/20'
                  }`}
                >
                  {item.name}
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
                className="flex-1 px-3 py-2 rounded
                           bg-gray-100 hover:bg-gray-200
                           dark:bg-primary/60 dark:hover:bg-primary/80 dark:text-gray-100"
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
                  className="flex-1 px-3 py-2 rounded
                             bg-primary text-white hover:opacity-90"
                >
                  로그인
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigate('/signup');
                    setIsOpen(false);
                  }}
                  className="flex-1 px-3 py-2 rounded
                             border border-gray-300 hover:bg-gray-50
                             dark:border-gray-700 dark:text-gray-100 dark:hover:bg-primary/20"
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
