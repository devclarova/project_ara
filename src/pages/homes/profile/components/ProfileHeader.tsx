// src/pages/components/ProfileHeader.tsx

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface ProfileHeaderProps {
  userProfile: {
    name: string;
    username: string;
    avatar: string;
    bio: string;
    location: string;
    joinDate: string;
    followers: number;
    following: number;
    banner?: string | null;
  };
}

export default function ProfileHeader({ userProfile }: ProfileHeaderProps) {
  return (
    <div className="relative">
      {/* ✅ Cover Image / Banner */}
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

      {/* Profile Info */}
      <div className="px-4 pb-4">
        {/* ✅ Avatar */}
        <div className="relative -mt-16 mb-4">
          <div className="w-32 h-32 rounded-full border-4 border-white bg-white overflow-hidden shadow-md">
            <Avatar className="w-full h-full">
              <AvatarImage
                src={userProfile.avatar || '/default-avatar.svg'}
                alt={userProfile.name}
                className="object-cover"
              />
              <AvatarFallback>
                {userProfile.name
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* ✅ Edit Profile Button */}
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            className="
              rounded-full px-6 font-medium
              text-[#009e89]
              border-[#009e89]
              hover:bg-[#00bfa5]/10
              transition-colors
            "
          >
            Edit profile
          </Button>
        </div>

        {/* ✅ User Info */}
        <div className="space-y-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{userProfile.name}</h1>
            <p className="text-gray-500">@{userProfile.username}</p>
          </div>

          {/* Bio */}
          {userProfile.bio && (
            <p className="text-gray-900 whitespace-pre-line">{userProfile.bio}</p>
          )}

          {/* Location & Join Date */}
          <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-gray-500">
            {userProfile.location && (
              <div className="flex items-center space-x-1">
                <i className="ri-map-pin-line text-sm"></i>
                <span className="text-sm">{userProfile.location}</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <i className="ri-calendar-line text-sm"></i>
              <span className="text-sm">Joined {userProfile.joinDate}</span>
            </div>
          </div>

          {/* ✅ Followers / Following */}
          <div className="flex items-center space-x-6">
            <button className="hover:underline cursor-pointer">
              <span className="font-bold text-gray-900">
                {userProfile.following.toLocaleString()}
              </span>
              <span className="text-gray-500 ml-1">Following</span>
            </button>
            <button className="hover:underline cursor-pointer">
              <span className="font-bold text-gray-900">
                {userProfile.followers.toLocaleString()}
              </span>
              <span className="text-gray-500 ml-1">Followers</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
