/**
 * ARA 애플리케이션 루트 오케스트레이터(ARA Application Root Orchestrator):
 * - 목적(Why): 전역 라우팅, 인증 상태에 따른 접근 제어(Auth Guard), 시스템 공지 및 점검 모드 등 서비스의 최상위 제어 흐름을 관리함
 * - 방법(How): React Router를 기반으로 선언적 라우팅 구조를 구축하고, 주요 인프라 리스너(Ban, Notification, UserTracker)를 통합하여 중앙 집중식 상태 감시를 수행함
 */
import { AlertTriangle, Loader2 } from 'lucide-react';
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
const ProfileSettings = React.lazy(() => import('./components/profile/ProfileSettings'));
import { ThemeProvider, useTheme } from './components/theme-provider';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BlockedUsersProvider } from './contexts/BlockedUsersContext';
import { DirectChatProvider } from './contexts/DirectChatContext';
import { NewChatNotificationProvider } from './contexts/NewChatNotificationContext';
import { PresenceProvider } from './contexts/PresenceContext';
import { SiteSettingsProvider, useSiteSettings } from './contexts/SiteSettingsContext';
import { DocumentMetadataManager } from './components/common/DocumentMetadataManager';
import { SecurityGuard } from './components/common/SecurityGuard';
import { GlobalToastSound } from './components/common/GlobalToastSound';
import { supabase } from './lib/supabase';
import RecoveryReminderModal from './components/auth/RecoveryReminderModal';

// 페이지 컴포넌트 — 코드 스플리팅으로 초기 번들 크기 최소화
// 각 페이지는 해당 라우트에 처음 진입할 때 비로소 로드됨
const AdminAnalytics = React.lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminAuthCallback = React.lazy(() => import('./pages/admin/AdminAuthCallback'));
const AdminContentModeration = React.lazy(() => import('./pages/admin/AdminContentModeration'));
const AdminGoodsManagement = React.lazy(() => import('./pages/admin/AdminGoodsManagement'));
const AdminBannerManager = React.lazy(() => import('./pages/admin/AdminBannerManager'));
const AdminPromotionsPage = React.lazy(() => import('./pages/admin/AdminPromotionsPage'));
const AdminGoodsUpload = React.lazy(() => import('./pages/admin/AdminGoodsUpload'));
const AdminHome = React.lazy(() => import('./pages/admin/AdminHome'));
const AdminLayout = React.lazy(() => import('./pages/admin/AdminLayout'));
const AdminLogin = React.lazy(() => import('./pages/admin/AdminLogin'));
const AdminReports = React.lazy(() => import('./pages/admin/AdminReports'));
const AdminSettings = React.lazy(() => import('./pages/admin/AdminSettings'));
const AdminStudyManagement = React.lazy(() => import('./pages/admin/AdminStudyManagement'));
const AdminStudyUpload = React.lazy(() => import('./pages/admin/AdminStudyUpload'));
const UserManagement = React.lazy(() => import('./pages/admin/UserManagement'));

const AuthCallback = React.lazy(() => import('./pages/auth/AuthCallback'));
const SignInPage = React.lazy(() => import('./pages/auth/SignInPage'));
const SignUpPage = React.lazy(() => import('./pages/auth/SignUpPage'));
const SignUpWizard = React.lazy(() => import('./pages/auth/SignUpWizard'));
const FindEmailPage = React.lazy(() => import('./pages/auth/FindEmailPage'));
const ResetPasswordPage = React.lazy(() => import('./pages/auth/ResetPasswordPage'));
const UpdatePasswordPage = React.lazy(() => import('./pages/auth/UpdatePasswordPage'));

const SubscriptionPage = React.lazy(() => import('./pages/subscription/SubscriptionPage'));
const DirectChatPage = React.lazy(() => import('./pages/chat/DirectChatPage'));
const CommunityFeed = React.lazy(() => import('./pages/community/CommunityFeed'));
const CommunityLayout = React.lazy(() => import('./pages/community/CommunityLayout'));
const NotFoundPage = React.lazy(() => import('./pages/community/NotFoundPage'));
const GoodsDetailPage = React.lazy(() => import('./pages/goods/GoodsDetailPage'));
const GoodsPage = React.lazy(() => import('./pages/goods/GoodsPage'));
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const HNotificationsPage = React.lazy(() => import('./pages/notifications/HNotificationsPage'));
const ProfileAsap = React.lazy(() => import('./pages/profile/ProfileAsap'));
const SnsDetailPage = React.lazy(() => import('./pages/sns/SnsDetailPage'));
const SnsPage = React.lazy(() => import('./pages/sns/SnsPage'));
const StudyListPage = React.lazy(() => import('./pages/StudyListPage'));
const StudyPage = React.lazy(() => import('./pages/StudyPage'));
const StudyVocaPage = React.lazy(() => import('./pages/StudyVocaPage'));

// 라우트 가드 및 공통 — 즉시 로드 필요
import OnboardingWall from './routes/guards/OnboardingWall';
import PageLoader from './components/common/PageLoader';
import { MarketingPopup } from './components/marketing/MarketingPopup';

const HIDE_HEADER_PATHS = [
  '/signin',
  '/signup',
  '/auth/callback',
  '/signup/social',
  '/admin',
  '/find-email',
  '/reset-password',
  '/update-password',
];

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
    setChecking(true);
    setIsAdmin(null);

    const checkAdminStatus = async () => {
      if (!session) {
        setIsAdmin(false);
        setChecking(false);
        return;
      }

      try {
        const { data, error } = await (supabase.from('profiles') as any)
          .select('is_admin')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (error) throw error;
        setIsAdmin(data?.is_admin || false);
      } catch (error) {
        console.error('Admin check error:', error);
        setIsAdmin(false);
      } finally {
        setChecking(false);
      }
    };

    if (isAdmin === null) {
      setChecking(true);
    }
    checkAdminStatus();
  }, [session?.user?.id]);

  if (loading || checking) return <PageLoader />;

  if (!session) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-full">
          <AlertTriangle className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-center text-muted-foreground max-w-md">
          Your account ({session.user.email}) does not have administrator privileges.
          <br />
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
            onClick={async () => {
              await (supabase.from('profiles') as any)
                .update({ is_online: false, last_active_at: new Date().toISOString() })
                .eq('user_id', session.user.id);
              await supabase.auth.signOut();
            }}
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
  const { settings } = useSiteSettings();
  const location = useLocation();
  const { session, isAdmin } = useAuth();
  
  useUserTracker();

  const maintenance = settings?.maintenance_mode;
  const showMaintenance = maintenance?.enabled && !isAdmin && !location.pathname.startsWith('/admin');
  const hideHeader = HIDE_HEADER_PATHS.some(path => location.pathname.startsWith(path));
  const isLanding = location.pathname === '/' || location.pathname === '/landing';
  const hideFooter = hideHeader || location.pathname.startsWith('/chat') || isLanding;

  return (
    <SecurityGuard>
      <DocumentMetadataManager />
      <ScrollToTop />
      
      <div className={`flex flex-col w-full ${(location.pathname.startsWith('/admin') || location.pathname.startsWith('/chat')) ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
        <div className="sticky top-0 z-[100] w-full flex flex-col shrink-0">
          <GlobalNoticeBar />
          {!showMaintenance && !hideHeader && <Header />}
        </div>

        {!hideHeader && <MarketingPopup />}

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
          <div className="layout flex flex-col w-full flex-1 min-h-0">
            <main className="flex-1 w-full flex flex-col min-h-0">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/landing" element={<LandingPage />} />
                  <Route path="/subscription" element={<SubscriptionPage />} />
                  <Route path="/guest-study/:contents/:episode/:scene?" element={<StudyPage />} />
                  <Route path="/studyList" element={<StudyListPage />} />
                  <Route path="/sns" element={<SnsPage />} />
                  <Route path="/sns/:id" element={<SnsDetailPage />} />
                  <Route path="/goods" element={<GoodsPage />} />
                  <Route path="/goods/:id" element={<GoodsDetailPage />} />
                  <Route path="/voca" element={<StudyVocaPage />} />

                  {/* Admin Routes */}
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
                      <Route path="banners" element={<AdminBannerManager />} />
                      <Route path="promotions" element={<AdminPromotionsPage />} />
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
      </div>
    </SecurityGuard>
  );
}

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

const App = () => {
  return (
    <AuthProvider>
      <BlockedUsersProvider>
        <ThemeProvider defaultTheme="system" storageKey="theme-mode">
          <SiteSettingsProvider>
            <PresenceProvider>
              <NewChatNotificationProvider>
                <DirectChatProvider>
                  <GlobalToastSound />
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
          </SiteSettingsProvider>
        </ThemeProvider>
      </BlockedUsersProvider>
    </AuthProvider>
  );
};

export default App;
