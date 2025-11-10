import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileHeaderProps {
  userProfile: {
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
  };
  onEditClick?: () => void; // ✅ 모달 오픈 콜백
}

export default function ProfileHeader({ userProfile, onEditClick }: ProfileHeaderProps) {
  const { user } = useAuth();
  const isOwnProfile = user && user.id === userProfile.user_id;

  return (
    <div className="relative bg-white dark:bg-background">
      {/* ✅ 배너 */}
      {userProfile.banner ? (
        <div className="h-48 sm:h-64 relative overflow-hidden">
          <img
            src={userProfile.banner}
            alt="Profile banner"
            className="w-full h-full object-cover object-center"
          />
        </div>
      ) : (
        <div className="h-48 sm:h-64 bg-gradient-to-r from-[#00dbaa] via-[#00bfa5] to-[#009e89]" />
      )}

      <div className="px-4 pb-4">
        {/* ✅ 아바타 */}
        <div className="relative -mt-16 mb-4">
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

        {/* ✅ 내 프로필일 때만 “프로필 편집” 버튼 */}
        {isOwnProfile && (
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              onClick={onEditClick}
              className="rounded-full px-6 font-medium text-[#009e89] border-[#009e89] hover:bg-[#00bfa5]/10 dark:hover:bg-primary/10 transition-colors"
            >
              프로필 편집
            </Button>
          </div>
        )}

        {/* ✅ 사용자 정보 */}
        <div className="space-y-3">
          {/* 이름 */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {userProfile.name}
          </h1>

          {/* 자기소개 */}
          {userProfile.bio && (
            <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line leading-snug">
              {userProfile.bio}
            </p>
          )}

          {/* 위치, 가입일 */}
          <div className="flex flex-wrap gap-3 text-gray-500 dark:text-gray-400 text-sm mt-2">
            {userProfile.location && (
              <span className="flex items-center gap-1">
                <i className="ri-map-pin-line" />
                {userProfile.location}
              </span>
            )}

            <span className="flex items-center gap-1">
              <i className="ri-calendar-line" />
              {userProfile.joinDate} 가입
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
