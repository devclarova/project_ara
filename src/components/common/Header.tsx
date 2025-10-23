import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const homePath = user ? '/social' : '/';
  // const homePath = '/';

  const menuItems = [
    { name: 'Home', path: '/', matchPaths: ['/home'] },
    { name: 'Study', path: '/studylist', matchPaths: ['/studylist', '/study'] },
    { name: 'Voca', path: '/voca', matchPaths: ['/voca'] },
    { name: 'Community', path: '/communitylist', matchPaths: ['/communitylist', '/community'] },
    { name: 'Profile', path: '/profile', matchPaths: ['/profile'] },
  ];

  const isRouteActive = (item: (typeof menuItems)[number]) => {
    const path = location.pathname;
    if (item.name === 'Home') return path === '/' || path === '/home';
    return item.matchPaths.some(p => path.startsWith(p));
  };

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
    await signOut(); // ← 여기서 이미 상태가 null
    setIsOpen(false);
    navigate('/', { replace: true }); // replace로 뒤로가기 시 재로그인 페이지로 안돌아오게
  };

  const nickname =
    (user?.user_metadata as Record<string, unknown> | undefined)?.nickname &&
    typeof (user?.user_metadata as any).nickname === 'string'
      ? ((user!.user_metadata as any).nickname as string)
      : user?.email
        ? user.email.split('@')[0]
        : '로그인 해주세요';

  const avatarUrl =
    (user?.user_metadata as Record<string, unknown> | undefined)?.avatar_url &&
    typeof (user?.user_metadata as any).avatar_url === 'string'
      ? ((user!.user_metadata as any).avatar_url as string)
      : '/images/default_avatar.png';

  return (
    <div
      className="flex justify-between items-center px-4 sm:px-8 lg:px-36 py-2 border-b border-gray-200 fixed top-0 left-0 w-full bg-white z-50
"
    >
      <div className="flex items-center gap-4 sm:gap-6">
        <img
          onClick={() => navigate(homePath)}
          src="/images/sample_font_logo.png"
          alt="Logo"
          className="w-14 sm:w-16 lg:w-20 cursor-pointer"
        />
        {/*
          데스크탑 메뉴는 주석 상태(필요 시 복구)
        */}
      </div>

      <div className="flex items-center">
        <div className="hidden md:flex items-center gap-2 sm:gap-4">
          {user ? (
            <>
              <div
                onClick={() => navigate('/profile')}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary flex justify-center items-center text-xs sm:text-sm text-white cursor-pointer hover:opacity-80"
                title="my profile"
              >
                user
              </div>
              <button
                onClick={handleSignout}
                className="text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2 rounded border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                SignOut
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/signin')}
                className="bg-primary text-white text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2 rounded hover:opacity-80 transition-colors"
              >
                SignIn
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2 rounded border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                SignUp
              </button>
            </>
          )}
        </div>

        {/* 모바일 햄버거 */}
        <button
          ref={buttonRef}
          className="md:hidden text-2xl font-bold px-2"
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
          className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg flex flex-col p-2 md:hidden z-50"
        >
          <div
            className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 cursor-pointer"
            onClick={() => {
              if (user) {
                navigate('/profile');
              } else {
                navigate('/signin');
              }
              setIsOpen(false);
            }}
          >
            <img
              src={avatarUrl}
              alt="avatar"
              className="w-8 h-8 rounded-full object-cover border"
            />
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900">
                {user ? nickname : '로그인 해주세요'}
              </div>
              <div className="text-xs text-gray-500">
                {user ? '내 프로필 보기' : '눌러서 로그인'}
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-100 my-2" />

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
                    active ? 'bg-primary text-white' : 'text-secondary hover:bg-gray-100'
                  }`}
                >
                  {item.name}
                </button>
              );
            })}
          </div>

          <div className="h-px bg-gray-100 my-2" />

          <div className="flex gap-2">
            {user ? (
              <button
                type="button"
                onClick={handleSignout}
                className="flex-1 px-3 py-2 rounded bg-gray-100 hover:bg-gray-200"
              >
                SignOut
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    navigate('/signin');
                    setIsOpen(false);
                  }}
                  className="flex-1 px-3 py-2 rounded bg-primary text-white hover:opacity-90"
                >
                  SignIn
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigate('/signup');
                    setIsOpen(false);
                  }}
                  className="flex-1 px-3 py-2 rounded border border-gray-300 hover:bg-gray-50"
                >
                  SignUp
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
