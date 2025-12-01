import {
  Navigate,
  Outlet,
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
} from 'react-router-dom';
import ScrollToTop from './components/common/ScrollToTop';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import ProfileSettings from './components/profile/ProfileSettings';
import Home from './pages/homes/Home';
import HomesTest from './pages/homes/HomesTest';
import Layout from './pages/homes/Layout';
import NotFoundPage from './pages/homes/NotFoundPage';
import LandingPage from './pages/LandingPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import StudyListPage from './pages/StudyListPage';
import StudyPage from './pages/StudyPage';
import TempHomePage from './pages/TempHomePage';
import { NewChatNotificationProvider } from './contexts/NewChatNotificationContext';
import AuthCallback from './pages/AuthCallback';
import DirectChatPage from './pages/chat/DirectChatPage';
import HNotificationsPage from './pages/homes/notifications/HNotificationsPage';
import ProfileAsap from './pages/homes/profile/ProfileAsap';
import TweetDetail from './pages/homes/tweet/TweetDetail';
import SignUpWizard from './pages/SignUpWizard';
import OnboardingWall from './routes/guards/OnboardingWall';
import { DirectChatProvider } from './contexts/DirectChatContext';
import Header from './components/common/Headrer';
import SnsPage from './pages/sns/SnsPage';
import SnsDetailPage from './pages/sns/SnsDetailPage';

// ---------- 인증 가드 ----------
function RequireAuth() {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (!session) return <Navigate to="/signin" replace state={{ from: location }} />;
  return <Outlet />;
}

function RequireGuest() {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (session) {
    const provider = (session.user.app_metadata?.provider as string | undefined) ?? 'email';
    // 세션 있으면: 소셜은 온보딩으로, 이메일은 홈으로
    return <Navigate to={provider === 'email' ? '/studyList' : '/signup/social'} replace />;
  }
  return <Outlet />;
}

// ---------- 실제 라우트 + 헤더 제어 ----------
function AppInner() {
  const location = useLocation();

  // ✅ 헤더를 숨길 경로들
  const HIDE_HEADER_PATHS = ['/signin', '/signup', '/auth/callback', '/signup/social'];

  const hideHeader = HIDE_HEADER_PATHS.some(path => location.pathname.startsWith(path));

  return (
    <>
      {/* 공통 스크롤 리셋 */}
      <ScrollToTop />

      <div className="layout min-h-screen flex flex-col">
        {/* ✅ 로그인/회원가입/온보딩에서는 헤더 렌더링 안 함 */}
        {!hideHeader && <Header />}

        {/* ✅ 헤더가 있을 때만 상단 여백 주기 (고정 헤더 높이 보정) */}
        <main
          className={
            hideHeader ? 'flex-1' : 'flex-1 pt-[73px] sm:pt-[81px] mid:pt-[81px] md:pt-[97px]' // 필요하면 값 조정
          }
        >
          <Routes>
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/" element={<LandingPage />} />
            <Route path="/landing" element={<LandingPage />} />
            {/* 🔓 공개용 (랜딩/인기콘텐츠에서만 사용) */}
            <Route path="/guest-study/:contents/:episode/:scene?" element={<StudyPage />} />
            <Route path="/studyList" element={<StudyListPage />} />

            <Route element={<RequireGuest />}>
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/signin" element={<SignInPage />} />
            </Route>

            <Route element={<RequireAuth />}>
              <Route path="/signup/social" element={<SignUpWizard mode="social" />} />
              <Route element={<OnboardingWall />}>
                <Route path="/study/:contents/:episode/:scene?" element={<StudyPage />} />
                <Route path="/test" element={<TempHomePage />} />
                <Route path="/settings" element={<ProfileSettings />} />
                <Route path="/sns" element={<SnsPage />} />
                <Route path="/sns/:id" element={<SnsDetailPage />} />
                <Route path="/profile" element={<ProfileAsap />} />
                <Route path="/profile/:username" element={<ProfileAsap />} />
                <Route path="hometest" element={<HomesTest />} />
                <Route path="hnotifications" element={<HNotificationsPage />} />
                <Route path="chat" element={<DirectChatPage />} />

                {/* <Route path="/finalhome" element={<Layout />}>
                  <Route index element={<Home />} /> */}
              </Route>
            </Route>
            {/* </Route> */}

            {/* 존재하지 않는 경로 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>
    </>
  );
}

// ---------- 최상위 App (Provider + Router 래핑) ----------
const App = () => {
  return (
    <AuthProvider>
      <NewChatNotificationProvider>
        <DirectChatProvider>
          <Router>
            <AppInner />
          </Router>
        </DirectChatProvider>
      </NewChatNotificationProvider>
    </AuthProvider>
  );
};

export default App;
