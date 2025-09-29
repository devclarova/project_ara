import { useLocation, useNavigate } from 'react-router-dom';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: 'Home', path: '/', matchPaths: ['/'] },
    { name: 'Study', path: '/studylist', matchPaths: ['/studylist', '/study'] },
    { name: 'Voca', path: '/voca', matchPaths: ['/voca'] },
    { name: 'Community', path: '/communitylist', matchPaths: ['/communitylist', '/community'] },
    { name: 'Profile', path: '/profile', matchPaths: ['/profile'] },
  ];

  return (
    <div className="flex justify-between items-center px-36 py-2 border-b border-gray-200">
      {/* 왼쪽 로고 + 메뉴 */}
      <div className="flex items-center gap-6">
        <img
          onClick={() => navigate('/')}
          src="/images/sample_font_logo.png"
          alt="Logo"
          className="w-20 cursor-pointer"
        />
        {menuItems.map(item => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/' // 정확히 '/'일 때만 Home 활성
              : item.matchPaths.some(p => location.pathname.startsWith(p));

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`text-lg font-bold p-0 ${
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

      {/* 오른쪽 아이콘 + 버튼 */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-primary flex justify-center items-center">
          <div>user</div>
        </div>
        <button
          onClick={() => navigate('/signin')}
          className="bg-primary text-white px-4 py-2 rounded hover:opacity-80 transition-colors"
        >
          로그인
        </button>
      </div>
    </div>
  );
}

export default Header;
