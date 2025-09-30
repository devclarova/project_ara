import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const menuItems = [
    { name: 'Home', path: '/', matchPaths: ['/'] },
    { name: 'Study', path: '/studylist', matchPaths: ['/studylist', '/study'] },
    { name: 'Voca', path: '/voca', matchPaths: ['/voca'] },
    { name: 'Community', path: '/communitylist', matchPaths: ['/communitylist', '/community'] },
    { name: 'Profile', path: '/profile', matchPaths: ['/profile'] },
  ];

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="flex justify-between items-center px-4 sm:px-8 lg:px-36 py-2 border-b border-gray-200 sticky top-0 bg-white z-50">
      {/* 왼쪽 로고 + 메뉴 */}
      <div className="flex items-center gap-4 sm:gap-6">
        <img
          onClick={() => navigate('/')}
          src="/images/sample_font_logo.png"
          alt="Logo"
          className="w-14 sm:w-16 lg:w-20 cursor-pointer"
        />
        {/* 데스크탑 메뉴 */}
        <div className="hidden md:flex gap-4 lg:gap-6">
          {menuItems.map(item => {
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : item.matchPaths.some(p => location.pathname.startsWith(p));

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`text-base lg:text-lg font-bold p-0 ${
                  isActive
                    ? 'text-primary underline hover:opacity-60'
                    : 'text-secondary hover:opacity-60'
                }`}
              >
                {item.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 오른쪽: 데스크탑 → user + 로그인 / 모바일 → 햄버거 */}
      <div className="flex items-center">
        {/* 데스크탑 */}
        <div className="hidden md:flex items-center gap-2 sm:gap-4">
          <div
            onClick={() => navigate('/profile')}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary flex justify-center items-center text-xs sm:text-sm text-white cursor-pointer hover:opacity-80"
          >
            user
          </div>
          <button
            onClick={() => navigate('/signin')}
            className="bg-primary text-white text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2 rounded hover:opacity-80 transition-colors"
          >
            로그인
          </button>
        </div>

        {/* 모바일 햄버거 */}
        <button
          ref={buttonRef}
          className="md:hidden text-2xl font-bold px-2"
          onClick={() => setIsOpen(prev => !prev)}
        >
          ☰
        </button>
      </div>

      {/* 모바일 메뉴 드롭다운 */}
      {isOpen && (
        <div
          ref={menuRef}
          className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg flex flex-col p-2 md:hidden z-50"
        >
          {/* user info (클릭 가능) */}
          <button
            onClick={() => {
              navigate('/profile');
              setIsOpen(false);
            }}
            className="flex items-center gap-2 p-2 border-b border-gray-200/50 hover:bg-gray-100 rounded"
          >
            <div className="w-8 h-8 rounded-full bg-primary flex justify-center items-center text-xs text-white">
              user
            </div>
            <span className="text-sm font-semibold">사용자</span>
          </button>

          {/* 메뉴 리스트 */}
          <div className="flex flex-col mt-2">
            {menuItems.map(item => {
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : item.matchPaths.some(p => location.pathname.startsWith(p));

              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setIsOpen(false);
                  }}
                  className={`text-left px-3 py-2 rounded ${
                    isActive ? 'bg-primary text-white' : 'text-secondary hover:bg-gray-100'
                  }`}
                >
                  {item.name}
                </button>
              );
            })}
          </div>

          {/* 로그인 버튼 */}
          <button
            onClick={() => {
              navigate('/signin');
              setIsOpen(false);
            }}
            className="mt-2 bg-primary text-white px-3 py-2 rounded hover:opacity-80"
          >
            로그인
          </button>
        </div>
      )}
    </div>
  );
}

export default Header;
