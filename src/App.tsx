import {
  Navigate,
  Outlet,
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
} from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import ScrollToTop from './components/common/ScrollToTop';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import Header from './components/common/Header';
import ProfileSettings from './components/profile/ProfileSettings';
import { DirectChatProvider } from './contexts/DirectChatContext';
import { NewChatNotificationProvider } from './contexts/NewChatNotificationContext';
import { PresenceProvider } from './contexts/PresenceContext';
import AdminLogin from './pages/admin/AdminLogin';
import AuthCallback from './pages/auth/AuthCallback';
import DirectChatPage from './pages/chat/DirectChatPage';
import GoodsDetailPage from './pages/goods/GoodsDetailPage';
import GoodsPage from './pages/goods/GoodsPage';
import CommunityFeed from './pages/community/CommunityFeed';
import CommunityLayout from './pages/community/CommunityLayout';
import NotFoundPage from './pages/community/NotFoundPage';
import HNotificationsPage from './pages/notifications/HNotificationsPage';
import ProfileAsap from './pages/profile/ProfileAsap';
import LandingPage from './pages/LandingPage';
import SignInPage from './pages/auth/SignInPage';
import SignUpPage from './pages/auth/SignUpPage';
import SignUpWizard from './pages/auth/SignUpWizard';
import FindEmailPage from './pages/auth/FindEmailPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import UpdatePasswordPage from './pages/auth/UpdatePasswordPage';
import SnsDetailPage from './pages/sns/SnsDetailPage';
import SnsPage from './pages/sns/SnsPage';
import StudyListPage from './pages/StudyListPage';
import StudyPage from './pages/StudyPage';
import OnboardingWall from './routes/guards/OnboardingWall';
import { Toaster } from 'sonner';
import Footer from './components/common/Footer';
import { ThemeProvider, useTheme } from './components/theme-provider';
import { GlobalNotificationListener } from './components/common/GlobalNotificationListener';
import { GlobalBanListener } from './components/common/GlobalBanListener';
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
import { GlobalUserStatusTracker } from './components/common/GlobalUserStatusTracker';
import RecoveryReminderModal from './components/auth/RecoveryReminderModal';

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
    // 세션이 변경되면 상태 초기화 후 재검사
    setChecking(true);
    setIsAdmin(null);

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
    // 로딩 중 표시 (빈 화면 대신 스피너 등)
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    // 인증되지 않았으면 로그인 페이지로
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  if (!isAdmin) {
    // 관리자가 아님 -> 명시적 에러 페이지 표시 (무한 리다이렉트 방지)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-full">
           <AlertTriangle className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-center text-muted-foreground max-w-md">
          Your account ({session.user.email}) does not have administrator privileges.
          <br/>
          Please ensure <code>is_admin</code> is set to true in the database.
        </p>
        <div className="flex gap-2 mt-4">
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
          >
            Retry Check
          </button>
          <button 
            onClick={() => supabase.auth.signOut()} 
            className="px-4 py-2 border border-input bg-background hover:bg-accent text-accent-foreground rounded-lg transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

// ---------- 실제 라우트 + 헤더 제어 ----------
function AppInner() {
  const location = useLocation();

  // 헤더를 숨길 경로들
  const HIDE_HEADER_PATHS = ['/signin', '/signup', '/auth/callback', '/signup/social', '/admin', '/find-email', '/reset-password', '/update-password'];
  const hideHeader = HIDE_HEADER_PATHS.some(path => location.pathname.startsWith(path));

  // 푸터를 숨길 경로들 (채팅방, 로그인 등)
  const HIDE_FOOTER_PATHS = [...HIDE_HEADER_PATHS, '/chat', '/sns'];

  const hideFooter = [...HIDE_HEADER_PATHS, '/chat'].some(path =>
    location.pathname.startsWith(path),
  );

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
              hideHeader ? 'flex-1' : 'flex-1 pt-[57px] sm:pt-[73px] lg:pt-[81px] xl:pt-[97px]'
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
              <Route path="/find-email" element={<FindEmailPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Route>
            
            {/* Password update - requires session but not full auth */}
            <Route path="/update-password" element={<UpdatePasswordPage />} />

            <Route path="/signup/social" element={<SignUpWizard mode="social" />} />

            <Route element={<RequireAuth />}>
              <Route element={<OnboardingWall />}>
                <Route path="/study/:contents/:episode/:scene?" element={<StudyPage />} />
                <Route path="/settings" element={<ProfileSettings />} />
                <Route path="/profile" element={<ProfileAsap />} />
                <Route path="/profile/:username" element={<ProfileAsap />} />
                <Route path="hnotifications" element={<HNotificationsPage />} />
                <Route path="chat" element={<DirectChatPage />} />
                <Route path="community" element={<CommunityLayout />}>
                  <Route index element={<CommunityFeed />} />
                </Route>
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

  const isDarkMode =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <Toaster
      position="bottom-right"
      expand={true}
      richColors
      theme={theme as 'light' | 'dark' | 'system'}
      toastOptions={{
        duration: 4000,
        // Tailwind 클래스로 !important 강제 적용 (배경색 문제 해결)
        className: 'font-sans !bg-white dark:!bg-[#18181b] !border-teal-500/30 !shadow-xl',
        style: {
          color: isDarkMode ? '#fff' : '#09090b',
          borderRadius: '16px',
          padding: '12px 16px',
          maxWidth: '320px',
          marginBottom: '8px',
          zIndex: 9999,
        },
      }}
    />
  );
};

// ---------- 최상위 App (Provider + Router 래핑) ----------
const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider defaultTheme="system" storageKey="theme-mode">
        <PresenceProvider>
          <NewChatNotificationProvider>
            <DirectChatProvider>
              <ThemedToaster />
              <Router>
                <GlobalNotificationListener />
                <GlobalBanListener />
                <GlobalUserStatusTracker />
                <RecoveryReminderModal />
                <AppInner />
              </Router>
            </DirectChatProvider>
          </NewChatNotificationProvider>
        </PresenceProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
