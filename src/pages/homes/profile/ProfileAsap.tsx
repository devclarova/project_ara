import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import ProfileHeader from './components/ProfileHeader';
import ProfileTabs, { type ProfileTabKey } from './components/ProfileTabs';
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
  const [activeTab, setActiveTab] = useState<ProfileTabKey>('posts');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // ✅ URL에서 username 추출 + 디코딩
  const { username } = useParams<{ username: string }>();
  const decodedUsername = username ? decodeURIComponent(username) : '';

  // ✅ 프로필 불러오기 (로직 그대로 유지)
  useEffect(() => {
    if (!decodedUsername && !user) return;

    const fetchProfile = async () => {
      try {
        let query = supabase.from('profiles').select(
          `
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
        `,
        );

        if (!decodedUsername && user) {
          // 🔹 /profile 처럼 username 없이 접속했을 때 → 내 프로필
          query = query.eq('user_id', user.id);
        } else {
          // 🔹 /profile/:username → 닉네임으로 조회
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
        });
      } catch (err) {
        console.error('프로필 불러오기 실패:', err);
        setUserProfile(null);
      }
    };

    fetchProfile();
  }, [decodedUsername, user]);

  // ✅ 프로필 저장 후 상태 갱신
  const handleSaveProfile = (updatedProfile: Partial<UserProfile>) => {
    setUserProfile(prev => (prev ? { ...prev, ...updatedProfile } : prev));
  };

  // ✅ 로딩 / 에러 상태
  if (!userProfile) {
    return (
      <div className="min-h-screen bg-white dark:bg-background">
        <div className="flex justify-center">
          <div className="w-full max-w-2xl lg:max-w-3xl border-x border-gray-200 dark:border-gray-700 dark:bg-background">
            <div className="flex items-center justify-center py-20">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <i className="ri-user-line text-6xl text-gray-300 dark:text-gray-600 mb-4" />
                <p>프로필을 불러올 수 없습니다.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    // 🔹 홈 피드처럼: 전체 배경 + 가운데 정렬 + 가운데 컬럼만 border-x
    <div className="min-h-screen bg-white dark:bg-background">
      <div className="flex justify-center">
        {/* 가운데 프로필 컬럼 */}
        <div className="w-full max-w-2xl lg:max-w-3xl border-x border-gray-200 dark:border-gray-700 dark:bg-background">
          {/* 상단 스티키 헤더 (뒤로가기 + 이름) */}
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

          {/* 프로필 헤더 (배너, 아바타, 팔로워 수 등) */}
          <ProfileHeader userProfile={userProfile} onEditClick={() => setIsEditModalOpen(true)} />

          {/* 탭 (게시물 / 답글 / 좋아요) */}
          <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {/* 탭에 따른 트윗 리스트 */}
          <ProfileTweets activeTab={activeTab} userProfile={userProfile} />

          {/* 프로필 편집 모달 */}
          <EditProfileModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            userProfile={userProfile}
            onSave={handleSaveProfile}
          />
        </div>
      </div>
    </div>
  );
}
