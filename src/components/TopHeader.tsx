import { BookMarked, BookOpen, Home, Menu, UserCircle, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SignInPage from '../pages/SignInPage';
import Modal from './Modal';

const TopHeader = () => {
  const linkActive = 'text-primary font-medium';
  const linkBase = 'text-gray-600 hover:text-gray-900';
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [authOpen, setAuthOpen] = useState(false); // 로그인 모달용 (기존 setIsOpen 대체)
  const [mobileOpen, setMobileOpen] = useState(false); // 모바일 드로어 상태
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/'); // 로그아웃 후 홈으로 이동
    } catch (err) {
      console.error('로그아웃 실패:', err);
    }
  };

  // 라우트 변경 시 모바일 드로어 자동 닫기
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <nav className="bg-white border-b sticky top-0 z-50 w-full inset-x-0">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex justify-between items-center px-4 sm:px-6 lg:px-8 h-20">
          {/* 좌측: 로고 */}
          <div className="flex items-center gap-8">
            <div className="font-gungsuh text-2xl text-primary">아라</div>

            {/* 데스크톱 메뉴 (유지) */}
            <div className="hidden sm:flex items-center gap-4 md:gap-6">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `${isActive ? linkActive : linkBase} text-sm md:text-base`
                }
              >
                홈
              </NavLink>
              <NavLink
                to="/studyList"
                className={({ isActive }) =>
                  `${isActive ? linkActive : linkBase} text-sm md:text-base`
                }
              >
                학습
              </NavLink>
              <NavLink
                to="/voca"
                className={({ isActive }) =>
                  `${isActive ? linkActive : linkBase} text-sm md:text-base`
                }
              >
                단어장
              </NavLink>
              <NavLink
                to="/communitylist"
                className={({ isActive }) =>
                  `${isActive ? linkActive : linkBase} text-sm md:text-base`
                }
              >
                커뮤니티
              </NavLink>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `${isActive ? linkActive : linkBase} text-sm md:text-base`
                }
              >
                프로필
              </NavLink>
            </div>
          </div>

          {/* 우측: 버튼들 + 모바일 햄버거 */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              className="w-10 h-10 hidden sm:flex items-center justify-center rounded-full hover:bg-gray-50"
              aria-label="알림"
            >
              <i className="ri-notification-3-line text-gray-600" />
            </button>

            {user ? (
              <>
                <NavLink
                  to="/profile"
                  className="hidden sm:flex"
                  style={{
                    width: '60px',
                    height: '60px',
                    backgroundColor: 'var(--gray-50)',
                    borderRadius: '50%',
                    // display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '3px dashed var(--gray-400)',
                    margin: '0 auto',
                  }}
                >
                  <div style={{ fontSize: '12px', color: 'var(--gray-500)', fontWeight: 'bold' }}>
                    김샛별
                  </div>
                </NavLink>

                <button
                  onClick={handleLogout}
                  className="hidden sm:inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-button text-gray-700 hover:bg-gray-50"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setAuthOpen(true)}
                  className="hidden sm:inline-flex items-center justify-center border border-transparent text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-[32px] px-[22px] h-[42px]"
                >
                  로그인
                </button>
                <Modal title="🔑 로그인" isOpen={authOpen} onClose={() => setAuthOpen(false)}>
                  <SignInPage onSuccess={() => setAuthOpen(false)} />
                </Modal>
              </>
            )}

            {/* 모바일 햄버거 */}
            <button
              type="button"
              className="sm:hidden inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-50"
              aria-label="메뉴 열기"
              aria-controls="mobile-menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        </div>
      </div>

      {/* 모바일 드로어 */}
      {mobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60]"
          onKeyDown={e => e.key === 'Escape' && setMobileOpen(false)}
        >
          {/* 오버레이 */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />

          {/* 오른쪽 패널 */}
          <div
            id="mobile-menu"
            className="absolute right-0 top-0 h-full w-72 max-w-[80%] bg-white shadow-xl transform transition-transform duration-200 translate-x-0"
          >
            <div className="flex items-center justify-between px-4 h-16 border-b">
              <span className="font-gungsuh text-xl text-primary">아라</span>
              <button
                className="w-10 h-10 inline-flex items-center justify-center rounded-full hover:bg-gray-50"
                aria-label="메뉴 닫기"
                onClick={() => setMobileOpen(false)}
              >
                <X className="w-6 h-6 text-gray-700" />
              </button>
            </div>

            {/* === 여기부터 아이콘이 적용된 링크들 === */}
            <div className="px-3 py-4 flex flex-col gap-1">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg ${isActive ? 'bg-gray-100 text-primary font-medium' : linkBase}`
                }
              >
                <Home className="w-5 h-5" />
                <span>홈</span>
              </NavLink>

              <NavLink
                to="/studyList"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg ${isActive ? 'bg-gray-100 text-primary font-medium' : linkBase}`
                }
              >
                <BookOpen className="w-5 h-5" />
                <span>학습</span>
              </NavLink>

              <NavLink
                to="/voca"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg ${isActive ? 'bg-gray-100 text-primary font-medium' : linkBase}`
                }
              >
                <BookMarked className="w-5 h-5" />
                <span>단어장</span>
              </NavLink>

              <NavLink
                to="/communitylist"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg ${isActive ? 'bg-gray-100 text-primary font-medium' : linkBase}`
                }
              >
                <Users className="w-5 h-5" />
                <span>커뮤니티</span>
              </NavLink>

              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg ${isActive ? 'bg-gray-100 text-primary font-medium' : linkBase}`
                }
              >
                <UserCircle className="w-5 h-5" />
                <span>프로필</span>
              </NavLink>

              <div className="h-px bg-gray-200 my-3" />

              {user ? (
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileOpen(false);
                  }}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-button text-white bg-primary hover:bg-primary/90"
                >
                  로그아웃
                </button>
              ) : (
                <button
                  onClick={() => {
                    setAuthOpen(true);
                    setMobileOpen(false);
                  }}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-button text-white bg-primary hover:bg-primary/90"
                >
                  로그인
                </button>
              )}
            </div>
            {/* === 아이콘 메뉴 끝 === */}
          </div>
        </div>
      )}
    </nav>
  );
};

export default TopHeader;
