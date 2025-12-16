import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

interface ProfileHeaderProps {
  userProfile: {
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
  };
  onEditClick?: () => void;
}

export default function ProfileHeader({ userProfile, onEditClick }: ProfileHeaderProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isOwnProfile = user && user.id === userProfile.user_id;

  return (
    <div className="relative bg-white dark:bg-background">
      {/* 배너 */}
      {userProfile.banner ? (
        <div className="h-48 sm:h-64 relative overflow-hidden">
          <img
            src={userProfile.banner}
            alt="Profile banner"
            className="w-full h-full object-cover object-center"
            decoding="async"
          />
        </div>
      ) : (
        <div className="h-48 sm:h-64 bg-gradient-to-r from-[#00dbaa] via-[#00bfa5] to-[#009e89]" />
      )}

      <div className="px-4 pb-4">
        {/* 아바타 */}
        <div className="relative -mt-16 mb-1">
          <div className="w-32 h-32 rounded-full border-4 border-white bg-white overflow-hidden shadow-md dark:border-gray-900 dark:bg-gray-900">
            <Avatar className="w-full h-full">
              <AvatarImage
                src={userProfile.avatar || '/default-avatar.svg'}
                alt={userProfile.name}
              />
              <AvatarFallback>{userProfile.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* 내 프로필일 때만 “프로필 편집” 버튼 */}
        {isOwnProfile && (
          <div className="flex justify-end mb-4 -mt-8 relative z-10">
            <Button
              variant="outline"
              onClick={onEditClick}
              className="rounded-full px-6 font-medium bg-primary/10 text-[#009e89] border-[#009e89] hover:bg-[#00bfa5]/10 dark:hover:bg-primary/30 transition-colors"
            >
              {t('profile.edit_profile')}
            </Button>
          </div>
        )}

        {/* 사용자 정보 */}
        <div className="space-y-3">
          {/* 이름 */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {userProfile.name}
          </h1>

          {/* 자기소개 */}
          <div className="min-h-[1.25rem]">
            {userProfile.bio ? (
              <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line leading-snug">
                {userProfile.bio}
              </p>
            ) : (
              <p className="opacity-0 select-none">.</p>
            )}
          </div>

          {/* 원래 location 들어가던 자리 → 국적 + 국기 */}
          <div className="flex flex-wrap gap-3 text-gray-500 dark:text-gray-400 text-sm mt-2">
            {(userProfile.country || userProfile.countryFlagUrl) && (
              <span className="flex items-center gap-2">
                {userProfile.countryFlagUrl && (
                  <img
                    src={userProfile.countryFlagUrl}
                    alt={userProfile.country ?? '국가'}
                    className="w-5 h-5 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                    loading="lazy"
                    decoding="async"
                  />
                )}
                <span>{userProfile.country}</span>
              </span>
            )}

            <span className="flex items-center gap-1">
              <i className="ri-calendar-line" />
              {t('profile.joined', { date: userProfile.joinDate })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
