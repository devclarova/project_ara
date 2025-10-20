import React, { useEffect, useMemo, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { supabase } from '../../lib/supabase';

type Consents = { terms: boolean; privacy: boolean; age: boolean; marketing: boolean };

type DraftProfile = {
  bio: string;
  file: File | null;
  preview: string | null; // ObjectURL
};

type Props = {
  email: string;
  pw: string;
  nickname: string;
  gender: string;
  birth: Date | null;
  country: string;
  consents?: Consents;
  onBack: () => void;
  onDone: () => void;

  /** 부모가 기억하는 프로필 드래프트 (되돌아왔을 때 그대로 보여줌) */
  draft?: DraftProfile;
  /** 프로필 드래프트가 바뀔 때 부모에게 즉시 알림 */
  onChangeDraft?: (d: DraftProfile) => void;
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
  draft,
  onChangeDraft,
}: Props) {
  const [file, setFile] = useState<File | null>(draft?.file ?? null);
  const [preview, setPreview] = useState<string | null>(draft?.preview ?? null);
  const [bio, setBio] = useState(draft?.bio ?? '');

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // 부모 드래프트로 동기화 (되돌아왔을 때 초기화 방지)
  useEffect(() => {
    if (!draft) return;
    setFile(draft.file ?? null);
    setPreview(draft.preview ?? null);
    setBio(draft.bio ?? '');
  }, [draft]);

  const commitDraft = (next: DraftProfile) => onChangeDraft?.(next);

  // ObjectURL 누수 방지
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const disabled = useMemo(() => loading, [loading]);

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) return setMsg('이미지는 2MB 이하만 가능합니다.');
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(f.type))
      return setMsg('JPG/PNG/GIF만 가능합니다.');

    // 기존 미리보기 URL 정리
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    const url = URL.createObjectURL(f);
    setFile(f);
    setPreview(url);
    setMsg('');
    commitDraft({ bio, file: f, preview: url }); // 부모 저장
  };

  async function uploadPendingAvatar(): Promise<string | null> {
    if (!file) return null;
    const ext = (file.name.split('.').pop() || 'jpg').replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
    const path = `pending/${uuid()}.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return data?.publicUrl ?? null;
  }

  async function finalizeNickname(accessToken: string, nick: string) {
    const res = await fetch('/functions/v1/validate-nickname', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: nick }),
    });
    const data = await res.json().catch(() => ({}));
    if (!data?.ok) throw new Error(`닉네임 설정 실패 (${data?.reason ?? 'server_error'})`);
  }

  async function uploadAvatarToUser(file: File, uid: string) {
    const ext = (file.name.split('.').pop() || 'jpg').replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
    const path = `${uid}/${uuid()}.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return data?.publicUrl ?? null;
  }

  const submit = async () => {
    try {
      setLoading(true);
      setMsg('');

      // (선택) 세션 없이도 썸네일 노출하려고 pending 업로드
      const pendingAvatarUrl = await uploadPendingAvatar();

      // 가입
      const { error: signErr } = await supabase.auth.signUp({
        email,
        password: pw,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            gender,
            nickname, // Edge에서 확정되지만 메타로도 보관(최초 표시용)
            birthday: birth ? birth.toISOString().slice(0, 10) : null,
            country,
            avatar_url: pendingAvatarUrl,
            bio,
            consents: consents ?? null,
          },
        },
      });
      if (signErr) throw new Error(signErr.message);

      // 세션이 있으면 즉시 후처리 (인증 OFF 환경)
      const session = (await supabase.auth.getSession()).data.session;
      if (session?.access_token) {
        const uid = session.user.id;
        await finalizeNickname(session.access_token, nickname);

        let avatarUrl = pendingAvatarUrl;
        if (file) avatarUrl = await uploadAvatarToUser(file, uid);

        await supabase
          .from('profiles')
          .update({
            avatar_url: avatarUrl,
            bio,
            gender,
            birthday: birth ? birth.toISOString().slice(0, 10) : null,
            country,
          })
          .eq('user_id', uid);
      }

      setMsg('회원가입 신청 완료! 이메일로 발송된 인증 메일을 확인해주세요.');
      onDone();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : '예상치 못한 오류');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 shadow">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">프로필</h2>

      {/* 아바타 */}
      <div className="flex flex-col items-center mt-1 sm:mt-2">
        <label className="mb-2 font-semibold text-gray-700 text-sm sm:text-base">
          프로필 이미지
        </label>
        <label
          htmlFor="avatar-upload"
          className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden bg-gray-50 cursor-pointer hover:ring-2 hover:ring-[var(--ara-ring)]"
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
            onChange={pick}
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
          onChange={e => {
            setBio(e.target.value);
            commitDraft({ bio: e.target.value, file, preview });
          }}
          rows={4}
          placeholder="간단한 소개를 작성해주세요."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--ara-ring)]"
        />
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
          onClick={submit}
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
