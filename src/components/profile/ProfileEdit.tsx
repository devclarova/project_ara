import { useState } from 'react';
import Button from '../common/Buttons';

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
  }) => void;
};

const ProfileEdit = ({ open, onClose, onSave }: ProfileEditProps) => {
  const [gender, setGender] = useState<'남' | '여'>('남');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-edit-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      {/* Card */}
      <div className="relative z-10 w-[min(720px,92vw)] rounded-2xl bg-white shadow-xl border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">프로필 수정</h2>
        </div>

        {/* Body */}
        <form
          className="px-6 py-5"
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
              avatarFile,
            });
          }}
        >
          {/* 아바타 */}
          <div className="flex flex-col items-center gap-3">
            <label className="relative cursor-pointer">
              <input
                name="avatar"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={e => {
                  const file = e.currentTarget.files?.[0] || null;
                  setAvatarFile(file);
                  if (file && file.type.startsWith('image/')) {
                    const url = URL.createObjectURL(file);
                    setAvatarUrl(url);
                  }
                }}
              />
              <div className="group relative size-24 rounded-full ring-2 ring-white shadow-md overflow-hidden">
                <img alt="프로필 미리보기" className="size-full object-cover" src={avatarUrl} />
                <div className="absolute inset-0 hidden place-items-center bg-black/20 text-white text-xs group-hover:grid">
                  <img src="/camera.svg" alt="프로필 변경하기" />
                </div>
              </div>
            </label>
          </div>

          {/* 필드 */}
          <div className="mt-6 grid grid-cols-1 gap-4">
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
                className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-gray-400"
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                자기소개
              </label>
              <textarea
                id="bio"
                name="bio"
                placeholder="프로필에 자기소개를 입력해주세요"
                className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-gray-400"
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
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-gray-400"
                />
                <p className="mt-1 text-[11px] text-gray-500">YYYY-MM-DD</p>
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
                className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-gray-400"
                defaultValue="대한민국"
              >
                <option>대한민국</option>
                <option>일본</option>
                <option>미국</option>
                <option>영국</option>
                <option>기타</option>
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-7 flex items-center justify-end gap-2 px-1 pt-4">
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
