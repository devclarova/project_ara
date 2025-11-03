// src/pages/ProfileAsap.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import ProfileHeader from './components/ProfileHeader';
import ProfileTabs from './components/ProfileTabs';
import ProfileTweets from './components/ProfileTweets';
import type { Profile } from '@/types/database';

interface UserProfile {
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

  // DB에서 현재 로그인한 사용자의 프로필 불러오기
  useEffect(() => {
    if (!username) return;

    const fetchProfile = async () => {
      // ✅ username(nickname)으로 프로필 검색
      const { data, error } = await supabase
        .from('profiles')
        .select(
          `
          id,
          user_id,
          nickname,
          username,
          avatar_url,
          banner_url,
          bio,
          location,
          followers_count,
          following_count,
          created_at
        `,
        )
        .eq('nickname', username) // 🔥 여기! username 대신 nickname으로 조회
        .single();

      if (error || !data) {
        console.error('❌ 프로필 불러오기 실패:', error?.message);
        setUserProfile(null);
        return;
      }

      setUserProfile({
        user_id: data.user_id,
        name: data.nickname,
        username: data.username ?? data.nickname,
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
    };

    fetchProfile();
  }, [username]);

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-gray-500">
          <i className="ri-user-line text-6xl text-gray-300 mb-4"></i>
          <p>프로필을 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:border-x border-gray-200">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 p-4 z-20">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <i className="ri-arrow-left-line text-xl text-gray-700"></i>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{userProfile.name}</h1>
            <p className="text-sm text-gray-500">
              @{userProfile.username} • {userProfile.followers} followers
            </p>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <ProfileHeader userProfile={userProfile} />
      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <ProfileTweets activeTab={activeTab} userProfile={userProfile} />
    </div>
  );
}
