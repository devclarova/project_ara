import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import ProfileHeader from './components/ProfileHeader';
import ProfileTabs from './components/ProfileTabs';
import ProfileTweets from './components/ProfileTweets';
import EditProfileModal from './components/EditProfileModal';

interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  location: string;
  joinDate: string;
  followers: number;
  following: number;
  banner?: string | null;
  website?: string | null;
}

export default function ProfileAsap() {
  const [activeTab, setActiveTab] = useState('posts');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // ✅ username을 디코딩해서 인코딩 문제(406 오류) 방지
  const { username } = useParams<{ username: string }>();
  const decodedUsername = username ? decodeURIComponent(username) : '';

  // 프로필 불러오기
  useEffect(() => {
    if (!decodedUsername && !user) return;

    const fetchProfile = async () => {
      try {
        let query = supabase.from('profiles').select(`
          id,
          user_id,
          nickname,
          avatar_url,
          banner_url,
          bio,
          location,
          followers_count,
          following_count,
          created_at
        `);

        if (!decodedUsername && user) {
          query = query.eq('user_id', user.id);
        } else {
          // ✅ 닉네임 대신 디코딩된 username 사용
          query = query.eq('nickname', decodedUsername);
        }

        const { data, error } = await query.single();
        if (error || !data) throw error;

        setUserProfile({
          id: data.id,
          user_id: data.user_id,
          name: data.nickname ?? 'Unknown',
          username: data.user_id,
          avatar: data.avatar_url ?? '/default-avatar.svg',
          bio: data.bio ?? '자기소개가 아직 없습니다.',
          location: data.location ?? 'Earth 🌍',
          joinDate: new Date(data.created_at).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
          }),
          following: data.following_count ?? 0,
          followers: data.followers_count ?? 0,
          banner: data.banner_url ?? null,
          website: data.website ?? '',
        });
      } catch (err) {
        console.error('프로필 불러오기 실패:', err);
        setUserProfile(null);
      }
    };

    fetchProfile();
  }, [decodedUsername, user]);

  // 프로필 저장 후 상태 갱신
  const handleSaveProfile = (updatedProfile: any) => {
    setUserProfile(prev => (prev ? { ...prev, ...updatedProfile } : prev));
  };

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-background">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <i className="ri-user-line text-6xl text-gray-300 dark:text-gray-600 mb-4" />
          <p>프로필을 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Profile | ARA</title>
        <meta
          name="description"
          content="나의 프로필/피드와 언어/문화 교류 기록을 관리할 수 있는 ARA 프로필 페이지입니다."
        />

        <meta property="og:title" content="My ARA Profile" />
        <meta
          property="og:description"
          content="나의 교류 내용, 좋아요, 댓글, 팔로워를 확인하세요."
        />
        <meta property="og:image" content="/images/sample_font_logo.png" />
        <meta property="og:url" content="https://project-ara.vercel.app/profile" />
        <link rel="canonical" href="https://project-ara.vercel.app/profile" />
      </Helmet>
      <div className="min-h-screen bg-white dark:bg-background lg:border-x border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="sticky top-0 bg-white/80 dark:bg-background/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 p-4 z-20">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-primary/10 transition-colors cursor-pointer"
            >
              <i className="ri-arrow-left-line text-xl text-gray-700 dark:text-gray-100" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {userProfile.name}
              </h1>
            </div>
          </div>
        </div>

      {/* 프로필 헤더 */}
      <ProfileHeader
        userProfile={userProfile}
        onEditClick={() => setIsEditModalOpen(true)}
      />

      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <ProfileTweets activeTab={activeTab} userProfile={userProfile} />

      {/* 프로필 편집 모달 */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        userProfile={userProfile}
        onSave={handleSaveProfile}
      />
    </div>
  );
}
