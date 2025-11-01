import { useEffect, useState } from 'react';
import Button from '../common/Buttons';

export type ProfileEditInitial = {
  name?: string;
  bio?: string;
  birth?: string; // "YYYY-MM-DD"
  gender?: '남' | '여';
  country?: string;
  avatarUrl?: string;
  coverUrl?: string;
};

type ProfileEditProps = {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    bio: string;
    birth: string;
    gender: '남' | '여';
    country: string;
    avatarUrl?: string;
    avatarFile?: File | null;
    coverUrl?: string;
    coverFile?: File | null;
    avatarRemoved?: boolean;
    coverRemoved?: boolean;
  }) => void;
  // 기존 프로필로 모달 열 때 필드 채우기
  initial?: ProfileEditInitial;
};

const ProfileEdit = ({ open, onClose, onSave, initial }: ProfileEditProps) => {
  const [gender, setGender] = useState<'남' | '여'>('남');
  // 아바타 상태
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);

  // 커버 상태
  const [coverUrl, setCoverUrl] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverRemoved, setCoverRemoved] = useState(false);

  // 모달 열릴 때 초기값 반영
  useEffect(() => {
    if (open) {
      setGender(initial?.gender ?? '남');

      setAvatarUrl(initial?.avatarUrl ?? '');
      setAvatarFile(null);
      setAvatarRemoved(false);

      setCoverUrl(initial?.coverUrl ?? '');
      setCoverFile(null);
      setCoverRemoved(false);
    }
  }, [open, initial]);

  if (!open) return null;

  const handlePickCover = (file: File | null) => {
    // 새 파일을 고르면 삭제 플래그 해제
    setCoverRemoved(false);
    setCoverFile(file);
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      // 기존 blob URL 회수
      if (coverUrl?.startsWith('blob:')) URL.revokeObjectURL(coverUrl);
      setCoverUrl(url);
    }
  };

  // 미리보기/파일 모두 초기화 + 삭제 플래그 on
  const handleRemoveCover = () => {
    if (coverUrl?.startsWith('blob:')) URL.revokeObjectURL(coverUrl);
    setCoverUrl('');
    setCoverFile(null);
    setCoverRemoved(true);
  };

  const handlePickAvatar = (file: File | null) => {
    setAvatarRemoved(false);
    setAvatarFile(file);
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      if (avatarUrl?.startsWith('blob:')) URL.revokeObjectURL(avatarUrl);
      setAvatarUrl(url);
    }
  };

  // 아바타제이미지 삭제
  const handleRemoveAvatar = () => {
    if (avatarUrl?.startsWith('blob:')) URL.revokeObjectURL(avatarUrl);
    setAvatarUrl('');
    setAvatarFile(null);
    setAvatarRemoved(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-edit-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      {/* Card */}
      <div className="relative z-10 w-[min(720px,92vw)] max-w-full rounded-2xl bg-white shadow-xl border border-gray-200 mx-auto max-h-[min(85vh,800px)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 id="profile-edit-title" className="text-lg font-semibold text-gray-900">
            프로필 수정
          </h2>
        </div>
        {/* Body */}
        <form
          className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-5 scrollbar-hidden hide-scrollbar"
          onSubmit={e => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget as HTMLFormElement);
            onSave({
              name: (fd.get('name') as string) || '',
              bio: (fd.get('bio') as string) || '',
              birth: (fd.get('birth') as string) || '',
              gender,
              country: (fd.get('country') as string) || '',
              avatarUrl,
              avatarRemoved,
              coverUrl,
              coverRemoved,
            });
          }}
        >
          {/* 아바타 & 커버 */}
          <div className="relative">
            {/* 커버 이미지 업로드 */}
            <label className="group block w-full overflow-hidden cursor-pointer bg-gray-100 h-28 xs:h-32 sm:h-40 md:h-48 lg:h-56 relative rounded-lg">
              <input
                name="cover"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={e => handlePickCover(e.currentTarget.files?.[0] || null)}
              />
              {/* 미리보기 */}
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt="커버 미리보기"
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="h-full w-full grid place-items-center text-xs sm:text-sm text-gray-500">
                  커버 이미지를 업로드하려면 클릭하세요 (권장 1500×500px 이상)
                </div>
              )}
              {/* Hover 힌트 */}
              <div className="absolute inset-0 hidden place-items-center bg-black/20 group-hover:grid group-focus-within:grid">
                <img src="images/camera.svg" alt="커버 변경하기" className="opacity-90" />
              </div>

              {/* 커버 삭제 버튼 (여기 '한 번만') */}
              {coverUrl && (
                <button
                  type="button"
                  onClick={handleRemoveCover}
                  className="absolute right-2 bottom-2 sm:right-3 sm:bottom-3 rounded-md bg-white/90 hover:bg-white text-xs px-2 py-1 border border-gray-200 shadow-sm"
                  aria-label="커버 이미지 삭제"
                >
                  삭제
                </button>
              )}
            </label>

            {/* 아바타 업로더 (커버에 겹치게) */}
            <div className="absolute left-3 sm:left-6 -bottom-10 sm:-bottom-12">
              <label className="relative cursor-pointer group inline-block">
                <input
                  name="avatar"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={e => handlePickAvatar(e.currentTarget.files?.[0] || null)}
                />
                <div className="relative size-20 xs:size-22 sm:size-28 md:size-32 rounded-full ring-4 ring-white shadow-md overflow-hidden">
                  {avatarUrl ? (
                    <img
                      alt="프로필 미리보기"
                      className="size-full object-cover bg-white"
                      src={avatarUrl}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="size-full grid place-items-center bg-gray-100 text-gray-400 text-xs">
                      아바타
                    </div>
                  )}
                  <div className="absolute inset-0 hidden place-items-center bg-black/25 text-white text-xs group-hover:grid group-focus-within:grid">
                    <img src="images/camera.svg" alt="프로필 변경하기" />
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* 필드 */}
          <div className="mt-12 sm:mt-14 grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                이름
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="닉네임"
                className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 focus:ring-offset-0"
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                자기소개
              </label>
              <input
                id="bio"
                name="bio"
                placeholder="프로필에 자기소개를 입력해주세요"
                className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 focus:ring-offset-0"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="birth" className="block text-sm font-medium text-gray-700">
                  생년월일
                </label>
                <input
                  id="birth"
                  name="birth"
                  type="date"
                  required
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 focus:ring-offset-0"
                />
              </div>

              <div>
                <span className="block text-sm font-medium text-gray-700">성별</span>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(['남', '여'] as const).map(g => (
                    <label
                      key={g}
                      className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-3 py-2 cursor-pointer has-[:checked]:bg-primary/90 has-[:checked]:text-white"
                    >
                      <input
                        type="radio"
                        name="gender"
                        value={g}
                        className="peer sr-only"
                        checked={gender === g}
                        onChange={() => setGender(g)}
                      />
                      <span className="text-sm">{g}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                나라
              </label>
              <select
                id="country"
                name="country"
                className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 focus:ring-offset-0"
                defaultValue="대한민국"
              >
                <option>대한민국</option>
                <option>일본</option>
                <option>미국</option>
                <option>영국</option>
                <option>기타</option>
              </select>
            </div>
            <div>
              {/* <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  웹사이트
                </label>
                <input
                  id="website"
                  name="website"
                  type="url"
                  placeholder="https://example.com"
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-[15px] sm:text-[16px] text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/50"
                  pattern="https?://.*" // (선택) http:// 또는 https:// 로 시작하도록 검사
                />
                <p className="ml-2 mt-2 text-[11px] text-gray-400">
                  웹사이트 주소는 <code>https://</code> 또는 <code>http://</code>로 시작해야 합니다.
                </p>
              </div> */}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-0 flex items-center justify-end gap-2 px-4 sm:px-6 py-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              취소
            </Button>
            <Button type="submit">저장</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileEdit;
