import React, { useMemo, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { supabase } from '../../lib/supabase';

export type ProfileData = {
  bio: string;
  website?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  tiktok?: string;
};

type Props = {
  // 이전 단계 데이터
  email: string;
  pw: string;
  nickname: string;
  gender: string;
  birth: Date | null;
  country: string;

  // 1단계 동의(저장 필요 시 활용)
  consents?: { terms: boolean; privacy: boolean; age: boolean; marketing: boolean };

  onBack: () => void;
  onDone: () => void; // 가입 완료 후 라우팅 등
};

export default function SignUpStep3Profile({
  email,
  pw,
  nickname,
  gender,
  birth,
  country,
  consents,
  onBack,
  onDone,
}: Props) {
  // 이미지 선택
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // 프로필/소개/SNS
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [youtube, setYoutube] = useState('');
  const [tiktok, setTiktok] = useState('');

  // 상태
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>('');

  const disabled = useMemo(() => loading, [loading]);

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) {
      setMsg('이미지는 2MB 이하만 가능합니다.');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(f.type)) {
      setMsg('JPG/PNG/GIF만 가능합니다.');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setMsg('');
  };

  // (선택) 미리 업로드하여 publicUrl 얻기 — 이메일 인증을 켠 프로젝트는 signUp 전에 업로드해두는 편이 안전
  async function uploadPendingAvatarIfAny(): Promise<string | null> {
    if (!file) return null;
    const ext = (file.name.split('.').pop() || 'jpg').replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
    const path = `pending/${uuid()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });
    if (upErr) throw new Error(upErr.message);
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return data?.publicUrl ?? null;
  }

  // 닉네임 확정(Edge API) — 세션 있을 때만 가능
  async function finalizeNickname(accessToken: string, nick: string) {
    const res = await fetch('/functions/v1/validate-nickname', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: nick }),
    });
    const data = await res.json().catch(() => ({}));
    if (!data?.ok) {
      const reason = data?.reason ?? 'server_error';
      throw new Error(`닉네임 설정 실패 (${reason})`);
    }
  }

  // 인증 후(세션 有) 사용자 폴더로 아바타 업로드
  async function uploadAvatarAfterSignup(file: File, uid: string): Promise<string | null> {
    const ext = (file.name.split('.').pop() || 'jpg').replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
    const path = `${uid}/${uuid()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });
    if (upErr) throw new Error(upErr.message);
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return data?.publicUrl ?? null;
  }

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setMsg('');

      // 0) (선택) pending 업로드 — 세션 없어도 URL 확보
      const pendingAvatarUrl = await uploadPendingAvatarIfAny();

      // 1) 가입 요청 (리다이렉트는 기존 페이지와 동일)
      const { data: sign, error: signErr } = await supabase.auth.signUp({
        email,
        password: pw,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            gender,
            // 닉네임은 Edge에서 확정하되, 메타에도 넣어 둠(첫 로그인 전 표시용)
            nickname,
            birthday: birth ? birth.toISOString().slice(0, 10) : null,
            country,
            avatar_url: pendingAvatarUrl, // 이메일 인증 켜진 경우 대비
            bio,
            website,
            instagram,
            twitter,
            youtube,
            tiktok,
            consents: consents ?? null,
          },
        },
      });
      if (signErr) throw new Error(signErr.message);

      // 2) 세션이 있는 경우(이메일 인증 미사용 환경 등) — 즉시 후속 처리
      const session = (await supabase.auth.getSession()).data.session;
      if (session?.access_token) {
        const uid = session.user.id;

        // 2-1) 닉네임 Edge 확정
        await finalizeNickname(session.access_token, nickname);

        // 2-2) 프로필 업데이트
        let avatarUrl = pendingAvatarUrl;
        if (file) {
          // 세션이 있으므로 사용자 폴더로 올리는 게 이상적
          avatarUrl = await uploadAvatarAfterSignup(file, uid);
        }
        const update: Record<string, any> = {
          avatar_url: avatarUrl,
          bio,
          website,
          instagram,
          twitter,
          youtube,
          tiktok,
          gender,
          birthday: birth ? birth.toISOString().slice(0, 10) : null,
          country,
        };
        await supabase.from('profiles').update(update).eq('user_id', uid);
      }

      // 3) 완료 UX
      setMsg('회원가입 신청 완료! 이메일로 발송된 인증 메일을 확인해주세요.');
      onDone();
    } catch (e) {
      const m = e instanceof Error ? e.message : '예상치 못한 오류';
      setMsg(m);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 shadow">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">프로필 & SNS</h2>

      {/* 아바타 업로드 */}
      <div className="flex flex-col items-center mt-1 sm:mt-2">
        <label className="mb-2 font-semibold text-gray-700 text-sm sm:text-base">
          프로필 이미지
        </label>
        <label
          htmlFor="avatar-upload"
          className={[
            'relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden bg-gray-50 cursor-pointer',
            'hover:ring-2 hover:ring-[var(--ara-ring)]',
          ].join(' ')}
        >
          {preview ? (
            <img
              src={preview}
              alt="Profile preview"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <span className="text-gray-400 text-xs sm:text-sm text-center">이미지 선택</span>
          )}
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePick}
          />
        </label>
        <p className="text-gray-400 text-xs mt-1">최대 2MB · JPG/PNG/GIF</p>
      </div>

      {/* 자기소개 */}
      <div className="mt-5">
        <label htmlFor="bio" className="block font-semibold text-gray-800 mb-2">
          자기소개
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={e => setBio(e.target.value)}
          rows={4}
          placeholder="간단한 소개를 작성해주세요."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--ara-ring)]"
        />
      </div>

      {/* SNS/웹 */}
      <div className="mt-4 grid sm:grid-cols-2 gap-3">
        <TextInput
          label="웹사이트"
          value={website}
          onChange={setWebsite}
          placeholder="https://example.com"
        />
        <TextInput
          label="Instagram"
          value={instagram}
          onChange={setInstagram}
          placeholder="@yourid"
        />
        <TextInput label="Twitter(X)" value={twitter} onChange={setTwitter} placeholder="@yourid" />
        <TextInput label="YouTube" value={youtube} onChange={setYoutube} placeholder="채널/URL" />
        <TextInput label="TikTok" value={tiktok} onChange={setTiktok} placeholder="@yourid" />
      </div>

      {/* 액션 */}
      <div className="flex justify-between sm:justify-end gap-2 sm:gap-3 mt-6">
        <button
          type="button"
          onClick={onBack}
          disabled={disabled}
          className="bg-gray-100 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:opacity-80 transition-colors disabled:opacity-50"
        >
          이전
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled}
          className="bg-[var(--ara-primary)] text-white font-semibold py-2 px-4 rounded-lg hover:opacity-85 transition-colors disabled:opacity-50"
        >
          {loading ? '회원가입 중...' : '회원가입 완료'}
        </button>
      </div>

      {msg && <p className="mt-3 text-center text-sm sm:text-base text-gray-700">{msg}</p>}
    </section>
  );
}

// 공용 텍스트 인풋(프라이머리 포커스)
function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block font-semibold text-gray-800 mb-2">{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--ara-ring)]"
      />
    </div>
  );
}
