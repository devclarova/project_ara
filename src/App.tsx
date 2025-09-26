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
import Modal from './components/Modal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import CommunityDetailPage from './pages/CommunityDetailPage';
import SignInPage from './pages/SignInPage';
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
import TopHeader from './components/TopHeader';
import SignUpPage from './pages/SignupPage';
import LearningPage from './pages/LearningPage';

const App = () => {
  return (
    <AuthProvider>
      <PostProvider>
        <Router>
          <div className="layout min-h-screen flex flex-col">
            {/* 공통 헤더 */}
            <TopHeader />

            <main className="flex-1">
              <Routes>
                <Route path="/" element={<LandingPage />}></Route>
                <Route path="/landing" element={<LandingPage />}></Route>
                <Route path="/home" element={<HomePage />}></Route>
                <Route path="/signup" element={<SignUpPage />}></Route>
                <Route path="/signin" element={<SignInPage />}></Route>
                <Route path="/profile" element={<ProfilePage />}></Route>
                <Route path="/studyList" element={<StudyListPage />}></Route>
                <Route path="/studyList/:id" element={<LearningPage />}></Route>
                <Route path="/study/:id" element={<StudyPage />}></Route>
                <Route path="/voca" element={<VocaPage />}></Route>
                <Route path="/communitywrite" element={<CommunityWritePage />}></Route>
                <Route path="/communitylist" element={<CommunityListPage />}></Route>
                <Route path="/communitydetail" element={<CommunityDetailPage />}></Route>
                <Route path="/notfound" element={<NotFound />}></Route>
              </Routes>
            </main>

            {/* <Footer /> */}
            <div className={`${styles.footer} mb-16 md:mb-0`}>
              <div className={styles.footerContent}>
                <img className={styles.textLogo} src={textLogo} alt="Foodit" />
                <span>서비스 이용약관 | 개인정보 처리방침</span>
              </div>
              {/* 햄버거 */}
              {/* <div className="h-[calc(4rem+env(safe-area-inset-bottom))] md:hidden" aria-hidden /> */}
            </div>
          </div>
          <InflearnNav />
        </Router>
      </PostProvider>
    </AuthProvider>
  );
};

export default App;
