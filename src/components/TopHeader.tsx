import { BookMarked, BookOpen, Home, Menu, UserCircle, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SignInPage from '../pages/SignInPage';
import Modal from './Modal';
import SignUpPage from '../pages/SignUpPage';
import LanguageSelect from '@/pages/settings/LanguageSelect';
import { useTranslation } from 'react-i18next';
import type { Lang } from '@/types/settings';
import { Globe } from 'lucide-react'; // Import Globe icon

const TopHeader = () => {
  const linkActive = 'text-primary font-medium';
  const linkBase = 'text-gray-600 hover:text-secondary focus:text-primary';
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [authOpen, setAuthOpen] = useState(false); // 로그인 모달용 (기존 setIsOpen 대체)
  const [mobileOpen, setMobileOpen] = useState(false); // 모바일 드로어 상태
  const [langOpen, setLangOpen] = useState(false); // 언어 선택 모달
  const location = useLocation();

  const { t, i18n } = useTranslation();
  
  const handleLanguageChange = (lang: Lang) => {
    i18n.changeLanguage(lang);
    setLangOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      // navigate('/'); // 로그아웃 후 홈으로 이동
      navigate('/landing'); // 로그아웃 후 랜딩 페이지로 이동
    } catch (err) {
      console.error('로그아웃 실패:', err);
    }
  };

  const Logo = () => {
    const [isSmUp, setIsSmUp] = useState(window.innerWidth >= 640);

    useEffect(() => {
      const handleResize = () => setIsSmUp(window.innerWidth >= 640);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    const logoSrc = isSmUp ? '/images/sample_font_logo.png' : '/images/sample_logo.png';

    return <img src={logoSrc} alt="Ara" className="h-12 sm:h-16 w-auto" />;
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
          <div className="flex items-center gap-4 md:gap-6">
            {/* <div className="h-12 w-auto bg-[url('/images/sample_icon_logo.png')] sm:bg-[url('/images/sample_font_logo.png')] bg-contain bg-no-repeat"> */}
            <div className="font-gungsuh text-2xl">
              <NavLink
                to="/"
                className="inline-block cursor-pointer"
                end // 홈일 때 active 적용
              >
                <Logo />
              </NavLink>
              {/* <img
                src="/images/sample_font_logo.png"
                alt="Ara"
                className="h-8 sm:h-10 md:h-12 lg:h-16 w-auto"
              /> */}
            </div>

            {/* 데스크톱 메뉴 (유지) */}
            <div className="hidden sm:flex items-center gap-4 md:gap-6">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `${isActive ? linkActive : linkBase} text-sm md:text-base`
                }
              >
                {t('nav.home')}
              </NavLink>
              <NavLink
                to="/studyList"
                className={({ isActive }) =>
                  `${isActive ? linkActive : linkBase} text-sm md:text-base`
                }
              >
                {t('nav.study')}
              </NavLink>
              <NavLink
                to="/voca"
                className={({ isActive }) =>
                  `${isActive ? linkActive : linkBase} text-sm md:text-base`
                }
              >
                {/* 단어장 -> Vocabulary? nav.voca 키 필요 */}
                {t('nav.study')} 
              </NavLink>
              <NavLink
                to="/communitylist"
                className={({ isActive }) =>
                  `${isActive ? linkActive : linkBase} text-sm md:text-base`
                }
              >
                {t('nav.community')}
              </NavLink>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `${isActive ? linkActive : linkBase} text-sm md:text-base`
                }
              >
                {t('nav.profile')}
              </NavLink>
            </div>
          </div>

          {/* 우측: 버튼들 + 모바일 햄버거 */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              className="w-10 h-10 hidden sm:flex items-center justify-center rounded-full hover:bg-gray-50"
              aria-label="언어 변경"
              onClick={() => setLangOpen(true)}
            >
              <Globe className="w-5 h-5 text-gray-600" />
            </button>
            
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
                    {user.user_metadata?.username || 'User'}
                  </div>
                </NavLink>

                <button
                  onClick={handleLogout}
                  className="hidden sm:inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-button text-gray-700 hover:bg-gray-50"
                >
                  {t('auth.logout')}
                </button>
              </>
            ) : (
              <>
                <button
                  // onClick={() => setAuthOpen(true)}
                  onClick={e => navigate('/signin')}
                  className="hidden sm:inline-flex items-center justify-center border border-transparent text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-[32px] px-[22px] h-[42px]"
                >
                  {t('auth.login')}
                </button>
                <Modal title={t('auth.login')} isOpen={authOpen} onClose={() => setAuthOpen(false)}>
                  <SignInPage />
                  <SignUpPage />
                </Modal>
              </>
            )}

            {/* 언어 선택 모달 */}
            <Modal title={t('settings.languageSelect')} isOpen={langOpen} onClose={() => setLangOpen(false)}>
              <LanguageSelect
                value={(i18n.language as Lang) || 'ko'}
                onChange={handleLanguageChange}
                onClose={() => setLangOpen(false)}
                onSave={() => setLangOpen(false)} 
                onCancel={() => setLangOpen(false)}
              />
            </Modal>

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
              <span className="font-gungsuh text-xl text-primary">Ara</span>
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
                <span>{t('nav.home')}</span>
              </NavLink>

              <NavLink
                to="/studyList"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg ${isActive ? 'bg-gray-100 text-primary font-medium' : linkBase}`
                }
              >
                <BookOpen className="w-5 h-5" />
                <span>{t('nav.study')}</span>
              </NavLink>

              <NavLink
                to="/voca"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg ${isActive ? 'bg-gray-100 text-primary font-medium' : linkBase}`
                }
              >
                <BookMarked className="w-5 h-5" />
                <span>{t('nav.study')}</span> 
              </NavLink>

              <NavLink
                to="/communitylist"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg ${isActive ? 'bg-gray-100 text-primary font-medium' : linkBase}`
                }
              >
                <Users className="w-5 h-5" />
                <span>{t('nav.community')}</span>
              </NavLink>

              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg ${isActive ? 'bg-gray-100 text-primary font-medium' : linkBase}`
                }
              >
                <UserCircle className="w-5 h-5" />
                <span>{t('nav.profile')}</span>
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
