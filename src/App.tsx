import { BookMarked, BookOpen, Home, Menu, UserCircle, Users, X } from 'lucide-react';

import { useEffect, useState } from 'react';
import {
  NavLink,
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import textLogo from './assets/text-logo.svg';
import styles from './components/Layout.module.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import CommunityDetailPage from './pages/CommunityDetailPage';
import ProfilePage from './pages/ProfilePage';
import StudyPage from './pages/StudyPage';
import VocaPage from './pages/VocaPage';
import CommunityWritePage from './pages/CommunityWritePage';
import NotFound from './pages/NotFound';
import StudyListPage, { InflearnNav } from './pages/StudyListPage';
import { PostProvider } from './contexts/PostContext';
import CommunityListPage from './pages/CommunityListPage';
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage';
import SignUpPage from './pages/SignUpPage';
import Header from './components/common/Header';
import SignInPage from './pages/SignInPage';
import TempHomePage from './pages/TempHomePage';
import TempCommunityPage from './pages/temps/TempCommunityPage';
import ScrollToTop from './components/common/ScrollToTop';
import HomeFeed from './pages/temps/HomeFeed';
import TweetDetailPage from './pages/TweetDetail/TweetDetailPage';
import ExplorePage from './pages/TweetDetail/ExplorePage';
import DMPage from './pages/dm/common/DMPage';
import SignUpPage_old from './pages/SignUpPage_old';


const App = () => {
  return (
    <AuthProvider>
      <PostProvider>
        <Router>
          <ScrollToTop />
          <div className="layout min-h-screen flex flex-col">
            {/* 공통 헤더 */}
            <Header />

            <main className="flex-1">
              <Routes>
                <Route path="/" element={<LandingPage />}></Route>
                <Route path="/landing" element={<LandingPage />}></Route>
                <Route path="/home" element={<HomePage />}></Route>
                <Route path="/signup" element={<SignUpPage />}></Route>
                <Route path="/signupo" element={<SignUpPage_old />}></Route>
                <Route path="/signin" element={<SignInPage />}></Route>
                <Route path="/profile" element={<ProfilePage />}></Route>
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
                <Route path="/social/:id" element={<TweetDetailPage />} />
                <Route path="/dm" element={<DMPage />}></Route>
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
