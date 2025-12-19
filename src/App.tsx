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
import Header from './components/common/Header';
import SnsPage from './pages/sns/SnsPage';
import SnsDetailPage from './pages/sns/SnsDetailPage';
import GoodsPage from './pages/goods/GoodsPage';
import GoodsDetailPage from './pages/goods/GoodsDetailPage';
import AdminLogin from './pages/admin/AdminLogin';

import AdminHome from './pages/admin/AdminHome';
import AdminStudyUpload from './pages/admin/AdminStudyUpload';
import AdminReports from './pages/admin/AdminReports';
import AdminContentModeration from './pages/admin/AdminContentModeration';
import AdminGoodsUpload from './pages/admin/AdminGoodsUpload'; // Added
import AdminAnalytics from './pages/admin/AdminAnalytics'; // To be created next
import { Toaster } from 'sonner'; // 토스트 컴포넌트 추가
import Footer from './components/common/Footer';
import { ThemeProvider, useTheme } from './components/theme-provider';
import AdminLayout from './pages/admin/AdminLayout'; // Layout 추가
import UserManagement from './pages/admin/UserManagement'; // UserManagement 추가
import AdminSettings from './pages/admin/AdminSettings'; // AdminSettings 추가
import { GlobalNotificationListener } from './components/common/GlobalNotificationListener';

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

  // 헤더를 숨길 경로들
  const HIDE_HEADER_PATHS = ['/signin', '/signup', '/auth/callback', '/signup/social', '/admin'];
  const hideHeader = HIDE_HEADER_PATHS.some(path => location.pathname.startsWith(path));

  // 푸터를 숨길 경로들 (채팅방, 로그인 등)
  // 채팅방(/chat)은 헤더는 필요하지만, 푸터는 화면 높이를 위해 숨김
  const HIDE_FOOTER_PATHS = [...HIDE_HEADER_PATHS, '/chat', '/sns']; 
  // 참고: /sns도 무한 스크롤 피드라면 푸터가 도달 불가능하므로 사이드바에 두는 게 낫지만,
  // 일단 사용자 요청에 따라 헤더가 있는 곳엔 붙이되, '채팅'은 확실히 뺌. 
  // (사용자 질문에 답변하기 위해 일단 로직 분리. /sns는 아래 답변에서 설명 후 결정 가능하지만, 
  // 현재 코드상으로는 /sns에서 푸터를 보면 어색할 수 있음. 일단 /chat만 확실히 추가하고 /sns는 답변에 맡김)
  
  const hideFooter = [...HIDE_HEADER_PATHS, '/chat'].some(path => location.pathname.startsWith(path));

  return (
    <>
      {/* 공통 스크롤 리셋 */}
      <ScrollToTop />

      <div className="layout min-h-screen flex flex-col">
        {/* 로그인/회원가입/온보딩에서는 헤더 렌더링 안 함 */}
        {!hideHeader && <Header />}

        {/* 헤더가 있을 때만 상단 여백 주기 (고정 헤더 높이 보정) */}
        <main
          className={
            hideHeader ? 'flex-1' : 'flex-1 pt-[73px] sm:pt-[81px] mid:pt-[81px] md:pt-[97px]'
          }
        >
          <Routes>
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/" element={<LandingPage />} />
            <Route path="/landing" element={<LandingPage />} />
            {/* 공개용 (랜딩/인기콘텐츠에서만 사용) */}
            <Route path="/guest-study/:contents/:episode/:scene?" element={<StudyPage />} />
            <Route path="/studyList" element={<StudyListPage />} />
            <Route path="/sns" element={<SnsPage />} />
            <Route path="/sns/:id" element={<SnsDetailPage />} />
            <Route path="/goods" element={<GoodsPage />} />
            <Route path="/goods/:id" element={<GoodsDetailPage />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminHome />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="study/upload" element={<AdminStudyUpload />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="content" element={<AdminContentModeration />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="goods/new" element={<AdminGoodsUpload />} />
            </Route>

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

        {/* 푸터 노출 조건: hideFooter가 아닐 때만 */}
        {!hideFooter && <Footer />}
      </div>
    </>
  );
}

// ---------- 최상위 App (Provider + Router 래핑) ----------
// 감싸야 useTheme 사용 가능
const ThemedToaster = () => {
  const { theme } = useTheme();
  
  const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <Toaster
      position="bottom-right"
      expand={true}
      richColors
      theme={theme as 'light' | 'dark' | 'system'}
      toastOptions={{
        duration: 4000,
        className: 'font-sans',
        style: {
          background: isDarkMode ? 'rgba(24, 24, 27, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(16px) saturate(180%)',
          WebkitBackdropFilter: 'blur(16px) saturate(180%)',
          border: '1px solid rgba(0, 191, 165, 0.2)', // Original Teal Border
          color: isDarkMode ? '#fff' : 'hsl(var(--foreground))',
          borderRadius: '16px',
          padding: '10px 14px',
          maxWidth: '280px',
          boxShadow: '0 8px 32px 0 rgba(0, 191, 165, 0.12), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
          marginBottom: '8px', 
        }
      }}
    />
  );
};

// ---------- 최상위 App (Provider + Router 래핑) ----------
const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider defaultTheme="system" storageKey="theme-mode">
        <NewChatNotificationProvider>
          <DirectChatProvider>
            <ThemedToaster />
            <Router>
              <GlobalNotificationListener />
              <AppInner />
            </Router>
          </DirectChatProvider>
        </NewChatNotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
