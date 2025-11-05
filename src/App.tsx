import {
  Navigate,
  Outlet,
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ScrollToTop from './components/common/ScrollToTop';
import LandingPage from './pages/LandingPage';
import NotFound from './pages/NotFound';
import ShancnPage from './pages/ShancnPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import StudyListPage from './pages/StudyListPage';
import StudyPage from './pages/StudyPage';
import SevenShad from './pages/temps/SevenShad';
import ExplorePage from './pages/TweetDetail/ExplorePage';
import NotificationsPage from './pages/TweetDetail/NotificationsPage';
import TweetDetailPage from './pages/TweetDetail/TweetDetailPage';
import ProfileSettings from './components/profile/ProfileSettings';
import Layout from './pages/homes/Layout';
import NotFoundPage from './pages/homes/NotFoundPage';
import ProfilePage from './pages/ProfilePage';
import ProfilePage_old from './pages/ProfilePage_old';
import FeedMain from './pages/temps/FeedMain';
import TestSevenShad from './pages/temps/TestSevenShad';
import TestTweetDetailInner from './pages/temps/TestTweetDetailInner';
import AuthCallback from './pages/AuthCallback';
import SignUpWizard from './pages/SignUpWizard';
import OnboardingWall from './routes/guards/OnboardingWall';
import ProfileAsap from './pages/homes/profile/ProfileAsap';
import TweetDetail from './pages/homes/tweet/TweetDetail';
import Notifications from './pages/homes/Notifications';
import { NewChatNotificationProvider } from './contexts/NewChatNotificationContext';
import { DirectChatProider } from './contexts/DirectChatContext';
import DirectChatPage from './pages/chat/DirectChatPage';
import Home from './pages/homes/Home';
import { Toaster } from './components/ui/sonner';
import HNotificationsPage from './pages/homes/notifications/HNotificationsPage';

interface SignInLocationState {
  emailVerified?: boolean;
}

function RequireAuth() {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (!session) return <Navigate to="/signin" replace state={{ from: location }} />;
  return <Outlet />;
}

function RequireGuest() {
  const { session, loading } = useAuth();
  const location = useLocation();
  const state = location.state as SignInLocationState | null;

  if (loading) return null;

  // 이메일 인증 링크 타고 /signin 으로 들어온 경우
  const fromEmailVerify = location.pathname === '/signin' && state?.emailVerified === true;

  if (fromEmailVerify) {
    // 이 경우에는, 비록 session 이 잠깐 살아있더라도
    // 절대 어디로도 튕기지 말고 그냥 게스트 페이지(로그인 폼) 보여준다
    return <Outlet />;
  }

  if (session) {
    const provider = (session.user.app_metadata?.provider as string | undefined) ?? 'email';

    // 핵심: 이메일 세션은 게스트 페이지에서 자동 리다이렉트 하지 않는다
    //  → 이메일 인증 때문에 잠깐 세션이 생겨도 /finalhome으로 안 튄다
    if (provider === 'email') {
      return <Outlet />;
    }

    // 소셜 로그인 사용자는 /signin, /signup 접근 막기 (이전 동작 유지)
    return <Navigate to="/signup/social" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

const App = () => {
  return (
    <AuthProvider>
      <NewChatNotificationProvider>
        <DirectChatProider>
          <Router>
            <ScrollToTop />
            <div className="layout min-h-screen flex flex-col">
              <main className="flex-1">
                <Routes>
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/landing" element={<LandingPage />} />

                  <Route element={<RequireGuest />}>
                    <Route path="/signup" element={<SignUpPage />} />
                    <Route path="/signin" element={<SignInPage />} />
                  </Route>

                  <Route element={<RequireAuth />}>
                    <Route path="/signup/social" element={<SignUpWizard mode="social" />} />
                    <Route element={<OnboardingWall />}>
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="/profileo" element={<ProfilePage_old />} />
                      <Route path="/studyList" element={<StudyListPage />} />
                      <Route path="/study/:id" element={<StudyPage />} />
                      <Route path="/notfound" element={<NotFound />} />
                      <Route path="/social/explore" element={<ExplorePage />} />
                      <Route path="/social/profile" element={<ProfilePage />} />
                      <Route path="/settings" element={<ProfileSettings />} />
                      <Route path="/social/:id" element={<TweetDetailPage />} />
                      <Route path="/socialcn" element={<ShancnPage />} />
                      <Route path="/notifications" element={<NotificationsPage />} />
                      <Route path="/socialss" element={<SevenShad />} />
                      <Route path="/feed" element={<TestSevenShad />}>
                        <Route index element={<FeedMain />} />
                        <Route path=":id" element={<TestTweetDetailInner />} />{' '}
                      </Route>
                      {/* <Route path="/home" element={<HomePage />} /> */}
                      {/* <Route path="/finalhome" element={<Home />}></Route> */}
                      {/* 공통 레이아웃 (좌측 Sidebar / 중앙 Outlet / 우측 Trends) */}
                      <Route path="/finalhome" element={<Layout />}>
                        <Route index element={<Home />} />
                        <Route path=":id" element={<TweetDetail />} />
                        <Route path="user/:username" element={<ProfileAsap />} />
                        <Route path="profileasap" element={<ProfileAsap />} />
                        <Route path="notifications1" element={<HNotificationsPage />} />
                        <Route path="studyList" element={<StudyListPage />} />
                        <Route path="chat" element={<DirectChatPage />} />
                        </Route>
                      </Route>
                    </Route>
                  </Route>

                  {/* 존재하지 않는 경로 */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </main>
            </div>
        <Toaster />
            {/* <InflearnNav /> */}
          </Router>
        </DirectChatProider>
      </NewChatNotificationProvider>
    </AuthProvider>
  );
};

export default App;
