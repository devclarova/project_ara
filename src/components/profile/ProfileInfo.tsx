// 프로필 정보

export type ProfileData = {
  nickname: string;
  handle: string;
  bio?: string;
  location?: string;
  website?: string;
  joined?: string; // 예: "2025.10"
  birth?: string;
  followingCount: number;
  followerCount: number;
  coverUrl?: string | null;
  avatarUrl?: string;
};

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
    website,
    joined,
    birth,
    followingCount,
    followerCount,
    coverUrl,
    avatarUrl = '/default-avatar.svg',
  } = profile;

  return (
    <>
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
            <img
              src={avatarUrl}
              alt="아바타이미지"
              className="w-full h-full object-cover object-top"
            />
          </div>
        </div>
      </div>

      {/* ===== 프로필 정보 ===== */}
      <div className="ml-5">
        <div className="text-right mt-4">
          <button
            className="bg-primary/80 text-white px-4 py-2 mr-5 rounded-full text-sm hover:bg-primary"
            onClick={onClickEdit}
          >
            프로필 편집
          </button>
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

            {website && (
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-link" />
                </div>
                <a
                  href={website}
                  className="text-primary/80 hover:text-primary hover:underline cursor-pointer"
                  target="_blank"
                  rel="noreferrer"
                >
                  웹사이트
                </a>
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
    </>
  );
}

export default ProfileInfo;
