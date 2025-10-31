import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import CommunityDetailPage from './pages/CommunityDetailPage';

import ScrollToTop from './components/common/ScrollToTop';
import { PostProvider } from './contexts/PostContext';
import CommunityListPage from './pages/CommunityListPage';
import CommunityWritePage from './pages/CommunityWritePage';
import DMPage from './pages/dm/common/DMPage';
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage';
import NotFound from './pages/NotFound';
import ShancnPage from './pages/ShancnPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import SignUpPage_old from './pages/SignUpPage_old';
import StudyListPage from './pages/StudyListPage';
import StudyPage from './pages/StudyPage';
import TempHomePage from './pages/TempHomePage';
import HomeFeed from './pages/temps/HomeFeed';
import SevenShad from './pages/temps/SevenShad';
import TempCommunityPage from './pages/temps/TempCommunityPage';
import ExplorePage from './pages/TweetDetail/ExplorePage';
import NotificationsPage from './pages/TweetDetail/NotificationsPage';
import TweetDetailPage from './pages/TweetDetail/TweetDetailPage';
import VocaPage from './pages/VocaPage';

import ProfileSettings from './components/profile/ProfileSettings';
import Home from './pages/homes/Home';
import HomesTest from './pages/homes/HomesTest';
import Layout from './pages/homes/Layout';
import NotFoundPage from './pages/homes/NotFoundPage';
import ProfilePage from './pages/ProfilePage';
import ProfilePage_old from './pages/ProfilePage_old';
import FeedMain from './pages/temps/FeedMain';
import TestSevenShad from './pages/temps/TestSevenShad';
import TestTweetDetailInner from './pages/temps/TestTweetDetailInner';
import ProfileAsap from './pages/homes/profile/ProfileAsap';
import TweetDetail from './pages/homes/tweet/TweetDetail';

const App = () => {
  return (
    <AuthProvider>
      <PostProvider>
        <Router>
          <ScrollToTop />
          <div className="layout min-h-screen flex flex-col">
            {/* 공통 헤더 */}
            {/* <Header /> */}

            <main className="flex-1">
              {/* <main className="flex-1 mt-[calc(97px)]"> */}
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/signupo" element={<SignUpPage_old />} />
                <Route path="/signin" element={<SignInPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/profileo" element={<ProfilePage_old />} />
                <Route path="/studyList" element={<StudyListPage />} />
                <Route path="/study/:id" element={<StudyPage />} />
                <Route path="/voca" element={<VocaPage />} />
                <Route path="/communitywrite" element={<CommunityWritePage />} />
                <Route path="/communitylist" element={<CommunityListPage />} />
                <Route path="/communitydetail/:id" element={<CommunityDetailPage />} />
                <Route path="/notfound" element={<NotFound />} />
                <Route path="/test" element={<TempHomePage />} />
                <Route path="/testC" element={<TempCommunityPage />} />
                <Route path="/social" element={<HomeFeed />} />
                <Route path="/social/explore" element={<ExplorePage />} />
                <Route path="/social/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<ProfileSettings />} />
                <Route path="/social/:id" element={<TweetDetailPage />} />
                <Route path="/dm" element={<DMPage />} />
                <Route path="/socialcn" element={<ShancnPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/socialss" element={<SevenShad />} />
                <Route path="/feed" element={<TestSevenShad />}>
                  <Route index element={<FeedMain />} /> {/* 기본 피드 */}
                  <Route path=":id" element={<TestTweetDetailInner />} /> {/* 중앙 컨텐츠만 교체 */}
                </Route>
                {/* <Route path="/finalhome" element={<Home />}></Route> */}

                {/* 공통 레이아웃 (좌측 Sidebar / 중앙 Outlet / 우측 Trends) */}
                <Route path="/finalhome" element={<Layout />}>
                  {/* 기본 진입은 홈으로 */}
                  <Route index element={<Home />} />
                  <Route path=":id" element={<TweetDetail />} />
                  <Route path="user/:username" element={<ProfileAsap />} />
                  {/* <Route path="finalhome" element={<Home />} /> */}
                  <Route path="hometest" element={<HomesTest />} />
                  <Route path="profileasap" element={<ProfileAsap />} />
                  <Route path="studyList" element={<StudyListPage />} />
                </Route>

                {/* 존재하지 않는 경로 */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>

            {/* <Footer /> */}
            {/* <div className={`${styles.footer} mb-16 md:mb-0`}>
              <div className={styles.footerContent}>
                <img className={styles.textLogo} src={textLogo} alt="Foodit" />
                <span>서비스 이용약관 | 개인정보 처리방침</span>
              </div>
              햄버거
              <div className="h-[calc(4rem+env(safe-area-inset-bottom))] md:hidden" aria-hidden />
            </div> */}
          </div>
          {/* <InflearnNav /> */}
        </Router>
      </PostProvider>
    </AuthProvider>
  );
};

export default App;
