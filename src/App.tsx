import { AlertTriangle } from 'lucide-react';
import React, { useEffect, useState, Suspense } from 'react';
import {
  Navigate,
  Outlet,
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
} from 'react-router-dom';
import { Toaster } from 'sonner';
import { useUserTracker } from './hooks/useUserTracker';
import Footer from './components/common/Footer';
import { GlobalBanListener } from './components/common/GlobalBanListener';
import { GlobalNotificationListener } from './components/common/GlobalNotificationListener';
import { GlobalUserStatusTracker } from './components/common/GlobalUserStatusTracker';
import Header from './components/common/Header';
import { GlobalNoticeBar } from './components/common/GlobalNoticeBar';
import ScrollToTop from './components/common/ScrollToTop';
import ProfileSettings from './components/profile/ProfileSettings';
import { ThemeProvider, useTheme } from './components/theme-provider';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DirectChatProvider } from './contexts/DirectChatContext';
import { NewChatNotificationProvider } from './contexts/NewChatNotificationContext';
import { PresenceProvider } from './contexts/PresenceContext';
import { SiteSettingsProvider, useSiteSettings } from './contexts/SiteSettingsContext';
import { DocumentMetadataManager } from './components/common/DocumentMetadataManager';
import { SecurityGuard } from './components/common/SecurityGuard';
import { supabase } from './lib/supabase';
import RecoveryReminderModal from './components/auth/RecoveryReminderModal';

// Admin Pages
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminAuthCallback from './pages/admin/AdminAuthCallback';
import AdminContentModeration from './pages/admin/AdminContentModeration';
import AdminGoodsManagement from './pages/admin/AdminGoodsManagement';
import AdminGoodsUpload from './pages/admin/AdminGoodsUpload';
import AdminHome from './pages/admin/AdminHome';
import AdminLayout from './pages/admin/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';
import AdminStudyManagement from './pages/admin/AdminStudyManagement';
import AdminStudyUpload from './pages/admin/AdminStudyUpload';
import UserManagement from './pages/admin/UserManagement';

// Auth Pages
import AuthCallback from './pages/auth/AuthCallback';
import SignInPage from './pages/auth/SignInPage';
import SignUpPage from './pages/auth/SignUpPage';
import SignUpWizard from './pages/auth/SignUpWizard';
import FindEmailPage from './pages/auth/FindEmailPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import UpdatePasswordPage from './pages/auth/UpdatePasswordPage';

// Content Pages
import DirectChatPage from './pages/chat/DirectChatPage';
import CommunityFeed from './pages/community/CommunityFeed';
import CommunityLayout from './pages/community/CommunityLayout';
import NotFoundPage from './pages/community/NotFoundPage';
import GoodsDetailPage from './pages/goods/GoodsDetailPage';
import GoodsPage from './pages/goods/GoodsPage';
import LandingPage from './pages/LandingPage';
import HNotificationsPage from './pages/notifications/HNotificationsPage';
import ProfileAsap from './pages/profile/ProfileAsap';
import SnsDetailPage from './pages/sns/SnsDetailPage';
import SnsPage from './pages/sns/SnsPage';
import StudyListPage from './pages/StudyListPage';
import StudyPage from './pages/StudyPage';
import StudyVocaPage from './pages/StudyVocaPage';
import OnboardingWall from './routes/guards/OnboardingWall';
import PageLoader from './components/common/PageLoader';

const HIDE_HEADER_PATHS = ['/signin', '/signup', '/auth/callback', '/signup/social', '/admin', '/find-email', '/reset-password', '/update-password'];

// ---------- 인증 가드 ----------
function RequireAuth() {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (!session) return <Navigate to="/signin" replace state={{ from: location }} />;
  return <Outlet />;
}

function RequireGuest() {
  const { session, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (session) {
    const provider = (session.user.app_metadata?.provider as string | undefined) ?? 'email';
    return <Navigate to={provider === 'email' ? '/studyList' : '/signup/social'} replace />;
  }
  return <Outlet />;
}

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
        const { data } = await supabase.from('profiles').select('is_admin').eq('user_id', session.user.id).maybeSingle();
        setIsAdmin(data?.is_admin || false);
      } catch (error) {
        console.error('Admin check error:', error);
        setIsAdmin(false);
      } finally {
        setChecking(false);
      }
    };
    checkAdminStatus();
  }, [session?.user?.id]);

  if (loading || checking) return <PageLoader />;
  if (!session) return <Navigate to="/admin/login" replace state={{ from: location }} />;
  if (!isAdmin) return <div className="p-8 text-center text-red-500">Admin Privileges Required</div>;
  return <Outlet />;
}

// ---------- 실제 라우트 + 헤더 제어 ----------
function AppInner() {
  const { settings } = useSiteSettings();
  const location = useLocation();
  const { session } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  
  useUserTracker();

  useEffect(() => {
    const checkAdmin = async () => {
      if (!session) return;
      const { data } = await supabase.from('profiles').select('is_admin').eq('user_id', session.user.id).maybeSingle();
      setIsAdmin(!!data?.is_admin);
    };
    checkAdmin();
  }, [session]);

  const maintenance = settings?.maintenance_mode;
  const showMaintenance = maintenance?.enabled && !isAdmin && !location.pathname.startsWith('/admin');
  const hideHeader = HIDE_HEADER_PATHS.some(path => location.pathname.startsWith(path));
  const hideFooter = hideHeader;

  return (
    <SecurityGuard>
      <DocumentMetadataManager />
      <ScrollToTop />
      
      <div className="sticky top-0 z-[100] w-full flex flex-col">
        <GlobalNoticeBar />
        {!showMaintenance && !hideHeader && <Header />}
      </div>

      {showMaintenance ? (
        <div className="fixed inset-0 z-[9999] bg-white dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-full mb-6">
                <AlertTriangle className="w-16 h-16 text-amber-500" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">서비스 점검 중입니다</h1>
            <p className="text-muted-foreground max-w-md mb-8 whitespace-pre-wrap">
                {maintenance.message || "더 나은 서비스를 위해 시스템 점검을 진행하고 있습니다.\n잠시 후 다시 이용해 주세요."}
            </p>
        </div>
      ) : (
        <div className="layout min-h-screen flex flex-col w-full">
          <main className="flex-1 w-full">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/" element={<LandingPage />} />
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/guest-study/:contents/:episode/:scene?" element={<StudyPage />} />
                <Route path="/studyList" element={<StudyListPage />} />
                <Route path="/sns" element={<SnsPage />} />
                <Route path="/sns/:id" element={<SnsDetailPage />} />
                <Route path="/goods" element={<GoodsPage />} />
                <Route path="/goods/:id" element={<GoodsDetailPage />} />
                <Route path="/voca" element={<StudyVocaPage />} />

                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/callback" element={<AdminAuthCallback />} />
                <Route element={<RequireAdmin />}>
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminHome />} />
                    <Route path="users" element={<UserManagement />} />
                    <Route path="settings" element={<AdminSettings />} />
                    <Route path="study/upload" element={<AdminStudyUpload />} />
                    <Route path="study/edit/:id" element={<AdminStudyUpload />} />
                    <Route path="study/manage" element={<AdminStudyManagement />} />
                    <Route path="reports" element={<AdminReports />} />
                    <Route path="content" element={<AdminContentModeration />} />
                    <Route path="analytics" element={<AdminAnalytics />} />
                    <Route path="goods/new" element={<AdminGoodsUpload />} />
                    <Route path="goods/edit/:id" element={<AdminGoodsUpload />} />
                    <Route path="goods/manage" element={<AdminGoodsManagement />} />
                  </Route>
                </Route>

                <Route element={<RequireGuest />}>
                  <Route path="/signup" element={<SignUpPage />} />
                  <Route path="/signin" element={<SignInPage />} />
                  <Route path="/find-email" element={<FindEmailPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                </Route>
                
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
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </main>
          {!hideFooter && <Footer />}
        </div>
      )}
    </SecurityGuard>
  );
}

const ThemedToaster = () => {
  const { theme } = useTheme();
  return (
    <Toaster
      position="bottom-right"
      expand={true}
      richColors
      theme={theme as 'light' | 'dark' | 'system'}
      toastOptions={{
        duration: 4000,
        className: 'font-sans !bg-white dark:!bg-[#18181b] !border-teal-500/30 !shadow-xl',
        style: { borderRadius: '16px', zIndex: 9999 },
      }}
    />
  );
};

const App = () => {
  return (
    <AuthProvider>
      <SiteSettingsProvider>
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
      </SiteSettingsProvider>
    </AuthProvider>
  );
};

export default App;