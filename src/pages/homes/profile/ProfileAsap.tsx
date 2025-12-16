import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import ProfileHeader from './components/ProfileHeader';
import ProfileTabs, { type ProfileTabKey } from './components/ProfileTabs';
import ProfileTweets from './components/ProfileTweets';
import EditProfileModal from './components/EditProfileModal';
import ScrollToTopButton from '@/components/common/ScrollToTopButton';

interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  joinDate: string;
  followers: number;
  following: number;
  banner?: string | null;
  website?: string | null;
  country?: string | null;
  countryFlagUrl?: string | null;
  nickname_updated_at?: string | null;
  country_updated_at?: string | null;
}

export default function ProfileAsap() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<ProfileTabKey>('posts');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // URL에서 username 추출 + 디코딩
  const { username } = useParams<{ username: string }>();
  const decodedUsername = username ? decodeURIComponent(username) : '';

  useEffect(() => {
    if (!decodedUsername && !user) return;

    const fetchProfile = async () => {
      try {
        // 1) 프로필만 먼저 가져오기
        let baseQuery = supabase.from('profiles').select(
          `
        id,
        user_id,
        nickname,
        avatar_url,
        banner_url,
        bio,
        country,
        followers_count,
        following_count,
        created_at,
        nickname_updated_at,
        country_updated_at
      `,
        );

        if (!decodedUsername && user) {
          baseQuery = baseQuery.eq('user_id', user.id);
        } else {
          baseQuery = baseQuery.eq('nickname', decodedUsername);
        }

        const { data: profile, error: profileError } = await baseQuery.single();
        if (profileError || !profile) throw profileError;

        // 2) country 값이 "countries.id" 라고 가정하고 조회
        let countryName: string | null = null;
        let countryFlagUrl: string | null = null;

        if (profile.country) {
          // profile.country가 숫자든 문자열이든 eq에서 캐스팅해줌
          const { data: countryRow, error: countryError } = await supabase
            .from('countries')
            .select('id, name, flag_url')
            .eq('id', profile.country) // 🔥 여기: iso_code가 아니라 id로 조회
            .maybeSingle();

          if (!countryError && countryRow) {
            countryName = countryRow.name ?? null;
            countryFlagUrl = countryRow.flag_url ?? null;
          }
        }

        // 디버깅용으로 한 번 확인해보고 싶으면 잠깐 켜두셔도 됨
        // console.log('ProfileAsap userProfile:', {
        //   profile,
        //   countryName,
        //   countryFlagUrl,
        // });

        // 3) 최종 상태 세팅
        setUserProfile({
          id: profile.id,
          user_id: profile.user_id,
          name: profile.nickname ?? 'Unknown',
          username: profile.user_id,
          avatar: profile.avatar_url ?? '/default-avatar.svg',
          bio: profile.bio ?? t('profile.no_bio_placeholder', 'No bio yet.'),
          country: countryName, // 화면에 보여줄 국가명
          countryFlagUrl: countryFlagUrl, // 국기 URL
          joinDate: new Date(profile.created_at).toLocaleDateString(i18n.language, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          following: profile.following_count ?? 0,
          followers: profile.followers_count ?? 0,
          banner: profile.banner_url ?? null,
          nickname_updated_at: profile.nickname_updated_at,
          country_updated_at: profile.country_updated_at,
        });
      } catch (err) {
        console.error('프로필 불러오기 실패:', err);
        setUserProfile(null);
      }
    };

    fetchProfile();
  }, [decodedUsername, user, i18n.language]);

  // 프로필 저장 후 상태 갱신
  const handleSaveProfile = (updatedProfile: Partial<UserProfile>) => {
    setUserProfile(prev => (prev ? { ...prev, ...updatedProfile } : prev));
  };

  // 로딩 / 에러 상태
  if (!userProfile) {
    return (
      <div className="min-h-screen bg-white dark:bg-background">
        <div className="flex justify-center">
          <div className="w-full max-w-2xl lg:max-w-3xl border-x border-gray-200 dark:border-gray-700 dark:bg-background">
            <div className="flex items-center justify-center py-20">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <i className="ri-user-line text-6xl text-gray-300 dark:text-gray-600 mb-4" />
                <p>{t('common.error_loading_profile', 'Unable to load profile.')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    // 홈 피드처럼: 전체 배경 + 가운데 정렬 + 가운데 컬럼만 border-x
    <div className="min-h-screen bg-white dark:bg-background">
      <ScrollToTopButton className="bottom-10 right-6 lg:right-16 xl:right-[calc(50vw-500px)]" />
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
