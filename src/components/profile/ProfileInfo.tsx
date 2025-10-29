// 프로필 정보

import type { ProfileData } from '@/types/profile';
import Button from '../common/Buttons';

type ProfileInfoProps = {
  profile: ProfileData;
  onClickEdit: () => void;
};

function ProfileInfo({ profile, onClickEdit }: ProfileInfoProps) {
  const {
    nickname,
    handle,
    bio,
    location,
    joined,
    birth,
    followingCount,
    followerCount,
    coverUrl,
    avatarUrl,
  } = profile;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* ===== 커버 + 아바타 영역 ===== */}
      <div className="relative">
        <div className="h-48 overflow-hidden relative">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt="커버이미지"
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div className="w-full h-full bg-slate-200" />
          )}
        </div>

        <div className="absolute -bottom-12 ml-5 mb-3">
          <div className="w-24 h-24 rounded-full border-4 border-white bg-white overflow-hidden">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="아바타이미지"
                className="w-full h-full object-cover object-top"
              />
            ) : (
              <img src="/default-avatar.svg" alt="기본아바타이미지" />
            )}
          </div>
        </div>
      </div>

      {/* ===== 프로필 정보 ===== */}
      <div className="ml-5">
        <div className="text-right mt-4">
          <Button type="submit" className="mr-10" onClick={onClickEdit}>
            프로필 편집
          </Button>
        </div>

        <div>
          <div className="mb-3">
            <h1 className="text-2xl font-bold text-[#111827] mb-0.5">{nickname}</h1>
            <p className="text-[#6b7280] text-sm">@{handle}</p>
          </div>

          {bio && <p className="text-[#111827] mb-4 leading-relaxed">{bio}</p>}

          <div className="flex flex-wrap items-center gap-4 text-[13px] text-[#6b7280] mb-4">
            {location && (
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-map-pin-line" />
                </div>
                <span>{location}</span>
              </div>
            )}

            {joined && (
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-calendar-line" />
                </div>
                <span>가입일 {joined}</span>
              </div>
            )}

            {birth && (
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-calendar-event-line" />
                </div>
                <span>생년월일 {birth}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-1">
              <button className="hover:underline cursor-pointer transition-all duration-200">
                <span className="font-bold text-[#111827]">{followingCount}</span>
              </button>
              <span className="text-[#6b7280] ml-1">팔로잉</span>
            </div>
            <div className="flex items-center gap-1">
              <button className="hover:underline cursor-pointer transition-all duration-200">
                <span className="font-bold text-[#111827]">{followerCount}</span>
              </button>
              <span className="text-[#6b7280] ml-1">팔로워</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileInfo;
