import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import ProfileHeader from './components/ProfileHeader';
import ProfileTabs from './components/ProfileTabs';
import ProfileTweets from './components/ProfileTweets';

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
}

export default function ProfileAsap() {
  const [activeTab, setActiveTab] = useState('posts');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { username } = useParams<{ username: string }>();

  useEffect(() => {
    if (!username && !user) return;

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

        // ✅ 로그인 유저가 자신의 프로필을 보는 경우
        if (!username && user) {
          query = query.eq('user_id', user.id);
        } else {
          query = query.eq('nickname', username);
        }

        const { data, error } = await query.single();
        if (error || !data) throw error;

        setUserProfile({
          id: data.id,
          user_id: data.user_id,
          name: data.nickname,
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
        });
      } catch (err) {
        console.error('❌ 프로필 불러오기 실패:', err);
        setUserProfile(null);
      }
    };

    fetchProfile();
  }, [username, user]);

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

      <ProfileHeader userProfile={userProfile} />
      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <ProfileTweets activeTab={activeTab} userProfile={userProfile} />
    </div>
  );
}
