import { useNavigate } from 'react-router-dom';

function Header() {
  const navigate = useNavigate();

  return (
    <div className="flex justify-between items-center px-20 py-2 border-b border-gray-200 cursor-pointer">
      {/* 왼쪽 로고 + 메뉴 */}
      <div className="flex items-center gap-6">
        <img
          onClick={() => navigate('/')}
          src="/images/sample_font_logo.png"
          alt="Logo"
          className="w-20"
        />
        <button
          onClick={() => navigate('/')}
          className="text-gray-800 hover:text-secondary w-16 text-lg"
        >
          홈
        </button>
        <button
          onClick={() => navigate('/studylist')}
          className="text-gray-800 text-lg hover:text-secondary"
        >
          학습
        </button>
        <button
          onClick={() => navigate('/voca')}
          className="text-gray-800 text-lg hover:text-secondary"
        >
          단어장
        </button>
        <button
          onClick={() => navigate('/communitylist')}
          className="text-gray-800 text-lg hover:text-secondary"
        >
          커뮤니티
        </button>
        <button
          onClick={() => navigate('/profile')}
          className="text-gray-800 text-lg hover:text-secondary"
        >
          프로필
        </button>
      </div>

      {/* 오른쪽 아이콘 + 버튼 */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-primary flex justify-center items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5.121 17.804A9 9 0 1118.878 6.196 9 9 0 015.121 17.804z"
            />
          </svg>
        </div>
        <button
          onClick={e => navigate('/signin')}
          className="bg-primary text-white px-4 py-2 rounded hover:opacity-80 transition-colors"
        >
          로그인
        </button>
      </div>
    </div>
  );
}

export default Header;
