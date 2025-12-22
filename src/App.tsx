import {
  Navigate,
  Outlet,
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
} from 'react-router-dom';
import { useEffect, useState } from 'react';
import ScrollToTop from './components/common/ScrollToTop';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';

import Header from './components/common/Header';
import ProfileSettings from './components/profile/ProfileSettings';
import { DirectChatProvider } from './contexts/DirectChatContext';
import { NewChatNotificationProvider } from './contexts/NewChatNotificationContext';
import AdminLogin from './pages/admin/AdminLogin';
import AuthCallback from './pages/AuthCallback';
import DirectChatPage from './pages/chat/DirectChatPage';
import GoodsDetailPage from './pages/goods/GoodsDetailPage';
import GoodsPage from './pages/goods/GoodsPage';
import HomesTest from './pages/homes/HomesTest';
import NotFoundPage from './pages/homes/NotFoundPage';
import HNotificationsPage from './pages/homes/notifications/HNotificationsPage';
import ProfileAsap from './pages/homes/profile/ProfileAsap';
import LandingPage from './pages/LandingPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import SignUpWizard from './pages/SignUpWizard';
import SnsDetailPage from './pages/sns/SnsDetailPage';
import SnsPage from './pages/sns/SnsPage';
import StudyListPage from './pages/StudyListPage';
import StudyPage from './pages/StudyPage';
import TempHomePage from './pages/TempHomePage';
import OnboardingWall from './routes/guards/OnboardingWall';
import { Toaster } from 'sonner';
import Footer from './components/common/Footer';
import { GlobalNotificationListener } from './components/common/GlobalNotificationListener';
import { ThemeProvider, useTheme } from './components/theme-provider';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminContentModeration from './pages/admin/AdminContentModeration';
import AdminGoodsManagement from './pages/admin/AdminGoodsManagement';
import AdminGoodsUpload from './pages/admin/AdminGoodsUpload';
import AdminHome from './pages/admin/AdminHome';
import AdminLayout from './pages/admin/AdminLayout';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';
import AdminStudyManagement from './pages/admin/AdminStudyManagement';
import AdminStudyUpload from './pages/admin/AdminStudyUpload';
import UserManagement from './pages/admin/UserManagement';
import AdminAuthCallback from './pages/admin/AdminAuthCallback';

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

// 관리자 인증 가드
function RequireAdmin() {
  const { session, loading } = useAuth();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!session) {
        setIsAdmin(false);
        setChecking(false);
        return;
      }

      try {
        // Supabase에서 is_admin 확인
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('user_id', session.user.id)
          .single();

        if (error) throw error;
        setIsAdmin(data?.is_admin || false);
      } catch (error) {
        console.error('Admin check error:', error);
        setIsAdmin(false);
      } finally {
        setChecking(false);
      }
    };

    checkAdminStatus();
  }, [session]);

  if (loading || checking) {
    // 로딩 중
    return null;
  }

  if (!session || !isAdmin) {
    // 인증되지 않았거나 관리자가 아니면 로그인 페이지로
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
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
  const HIDE_FOOTER_PATHS = [...HIDE_HEADER_PATHS, '/chat', '/sns'];
 
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
            <Route path="/admin/callback" element={<AdminAuthCallback />} />
            <Route element={<RequireAdmin />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminHome />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="study/upload" element={<AdminStudyUpload />} />
                <Route path="study/manage" element={<AdminStudyManagement />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="content" element={<AdminContentModeration />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="goods/new" element={<AdminGoodsUpload />} />
                <Route path="goods/manage" element={<AdminGoodsManagement />} />
              </Route>
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
          zIndex: 9999, // 모달보다 위에 표시
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
