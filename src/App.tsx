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
import ProfilePage from './pages/ProfilePage';
import ProfilePage_old from './pages/ProfilePage_old';
import FeedMain from './pages/temps/FeedMain';
import TestSevenShad from './pages/temps/TestSevenShad';
import TestTweetDetailInner from './pages/temps/TestTweetDetailInner';
import Home from './pages/homes/Home';

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
                <Route path="/" element={<LandingPage />}></Route>
                <Route path="/landing" element={<LandingPage />}></Route>
                <Route path="/home" element={<HomePage />}></Route>
                <Route path="/signup" element={<SignUpPage />}></Route>
                <Route path="/signupo" element={<SignUpPage_old />}></Route>
                <Route path="/signin" element={<SignInPage />}></Route>
                <Route path="/profile" element={<ProfilePage />}></Route>
                <Route path="/profileo" element={<ProfilePage_old />}></Route>
                <Route path="/studyList" element={<StudyListPage />}></Route>
                <Route path="/study/:id" element={<StudyPage />}></Route>
                <Route path="/voca" element={<VocaPage />}></Route>
                <Route path="/communitywrite" element={<CommunityWritePage />}></Route>
                <Route path="/communitylist" element={<CommunityListPage />}></Route>
                <Route path="/communitydetail/:id" element={<CommunityDetailPage />}></Route>
                <Route path="/notfound" element={<NotFound />}></Route>
                <Route path="/test" element={<TempHomePage />}></Route>
                <Route path="/testC" element={<TempCommunityPage />}></Route>
                <Route path="/social" element={<HomeFeed />}></Route>
                <Route path="/social/explore" element={<ExplorePage />} />
                <Route path="/social/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<ProfileSettings />} />
                <Route path="/social/:id" element={<TweetDetailPage />} />
                <Route path="/dm" element={<DMPage />}></Route>
                <Route path="/socialcn" element={<ShancnPage />}></Route>
                <Route path="/notifications" element={<NotificationsPage />}></Route>
                <Route path="/socialss" element={<SevenShad />}></Route>
                <Route path="/feed" element={<TestSevenShad />}>
                  <Route index element={<FeedMain />} /> {/* 기본 피드 */}
                  <Route path=":id" element={<TestTweetDetailInner />} /> {/* 중앙 컨텐츠만 교체 */}
                </Route>
                <Route path="/finalhome" element={<Home />}></Route>
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
