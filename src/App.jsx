import { Router } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignupPage';
import ProfilePage from './pages/ProfilePage';
import StudyListPage from './pages/StudyListPage';
import StudyPage from './pages/StudyPage';
import VocaPage from './pages/VocaPage';
import CommunityWritePage from './pages/CommunityWritePage';
import CommunityListPage from './pages/CommunityListPage';
import CommunityDetailPage from './pages/CommunityDetailPage';
import NotFound from './pages/NotFound';

function App() {
  const unuse = 1;
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage></HomePage>}></Route>
        <Route path="/landing" element={<LandingPage></LandingPage>}></Route>
        <Route path="/signup" element={<SignUpPage></SignUpPage>}></Route>
        <Route path="/signin" element={<SignInPage></SignInPage>}></Route>
        <Route path="/profile" element={<ProfilePage></ProfilePage>}></Route>
        <Route path="/studyList" element={<StudyListPage></StudyListPage>}></Route>
        <Route path="/study" element={<StudyPage></StudyPage>}></Route>
        <Route path="/voca" element={<VocaPage></VocaPage>}></Route>
        <Route path="/communitywrite" element={<CommunityWritePage></CommunityWritePage>}></Route>
        <Route path="/communitylist" element={<CommunityListPage></CommunityListPage>}></Route>
        <Route
          path="/communitydetail"
          element={<CommunityDetailPage></CommunityDetailPage>}
        ></Route>
        <Route path="/notfound" element={<NotFound></NotFound>}></Route>
      </Routes>
    </Router>
  );
}

export default App;
