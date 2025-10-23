import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { supabase } from '../../lib/supabase';
import type { ConsentResult } from './SignUpStep1Consent';

// SignUpPage에서 사용하는 draft 타입을 그대로 명시
type ProfileDraft = {
  bio: string;
  file: File | null; // 아바타 원본 파일
  preview: string | null; // blob: URL (미리보기)
};

type Props = {
  // 2단계에서 넘어온 필드들
  email: string;
  pw: string;
  nickname: string;
  gender: string;
  birth: Date | null;
  country: string;

  // 1단계 동의정보(3단계에서 꼭 안 써도, 부모가 넘기므로 타입에 포함)
  consents?: ConsentResult;

  // 상단 스텝 내비
  onBack: () => void;
  onDone: () => void;

  // 3단계 프로필 드래프트(왕복 시 유지)
  draft: ProfileDraft;
  onChangeDraft: React.Dispatch<React.SetStateAction<ProfileDraft>>;
};

const DRAFT_KEY = 'signup-profile-draft';

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
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async () => {
    setMsg('');
    try {
      setLoading(true);

      // 1) 필수값 프론트 검증
      const birthdayStr = birth ? birth.toISOString().slice(0, 10) : '';
      if (!email.trim()) return setMsg('이메일을 입력해 주세요.');
      if (!pw.trim()) return setMsg('비밀번호를 입력해 주세요.');
      if (!nickname.trim()) return setMsg('닉네임을 입력해 주세요.');
      if (!gender.trim()) return setMsg('성별을 선택해 주세요.');
      if (!birthdayStr) return setMsg('생년월일을 입력해 주세요.');
      if (!country.trim()) return setMsg('국적을 선택해 주세요.');

      // 2) (선택) 아바타 임시 업로드 → public URL을 draft에 저장해 로그인 후 profiles insert 시 사용
      let pendingAvatarUrl: string | null = null;
      if (draft.file) {
        try {
          const ext =
            (draft.file.name.split('.').pop() || 'jpg').replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
          const path = `pending/${uuid()}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from('avatars')
            .upload(path, draft.file, { upsert: true });
          if (upErr) throw upErr;
          const { data } = supabase.storage.from('avatars').getPublicUrl(path);
          pendingAvatarUrl = data?.publicUrl ?? null;

          // draft에도 반영(선택)
          onChangeDraft(d => ({ ...d /* file/preview 유지 */ }));
        } catch (e) {
          console.warn('avatar upload skipped:', e);
        }
      }

      // 3) 프로필 드래프트를 localStorage에 저장(로그인 성공 시 profiles 생성에 사용)
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          nickname: nickname.trim(),
          gender: gender.trim(),
          birthday: birthdayStr,
          country: country.trim(),
          bio: (draft.bio ?? '').toString(),
          pendingAvatarUrl,
        }),
      );

      // 4) 실제 "가입" (이메일 인증 필요). 자동 로그인 없음
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pw,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw new Error(error.message);

      // 5) 요구사항: "회원가입 누르면 user는 넘기라고." (세션 없어도 가능)
      try {
        const authId = data.user?.id;
        const authEmail = data.user?.email ?? email;
        if (authId) {
          await supabase.from('users').upsert(
            {
              auth_user_id: authId,
              email: authEmail,
              created_at: new Date().toISOString(),
              last_login: new Date().toISOString(),
            },
            { onConflict: 'auth_user_id' },
          );
        }
      } catch (uErr) {
        console.warn('users upsert at signUp skipped:', uErr);
      }

      // 6) 성공 모달
      setShowSuccess(true);
    } catch (e: any) {
      setMsg(e?.message || '회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // ▼▼▼ UI만 두 번째 코드 스타일로 변경 (카드, 원형 업로더, 버튼 톤 등) ▼▼▼
    <section className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 shadow dark:bg-neutral-900">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
        프로필
      </h2>

      {/* 아바타 업로드 (원형, 점선 보더, 호버 링) */}
      <div className="flex flex-col items-center mt-1 sm:mt-2">
        <label className="mb-2 font-semibold text-gray-700 dark:text-gray-200 text-sm sm:text-base">
          프로필 이미지
        </label>

        <label
          htmlFor="avatar-upload"
          className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-dashed border-gray-300 dark:border-white/20 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-neutral-800 cursor-pointer hover:ring-2 hover:ring-[var(--ara-ring)] transition"
        >
          {draft.preview ? (
            <img
              src={draft.preview}
              alt="미리보기"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <span className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm text-center">
              이미지 선택
            </span>
          )}
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0] ?? null;
              if (!f) return onChangeDraft(d => ({ ...d, file: null, preview: null }));
              const url = URL.createObjectURL(f);
              onChangeDraft(d => ({ ...d, file: f, preview: url }));
            }}
          />
        </label>

        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">최대 2MB · JPG/PNG/GIF</p>
      </div>

      {/* 자기소개 */}
      <div className="mt-5">
        <label htmlFor="bio" className="block font-semibold text-gray-800 dark:text-gray-100 mb-2">
          자기소개
        </label>
        <textarea
          id="bio"
          value={draft.bio}
          onChange={e => onChangeDraft(d => ({ ...d, bio: e.target.value.slice(0, 300) }))}
          rows={4}
          placeholder="간단한 소개를 작성해주세요."
          className="w-full h-32 resize-none rounded-lg border border-gray-300 dark:border-white/15 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--ara-ring)]"
        />
        <div className="mt-1 text-right text-[11px] text-gray-400 dark:text-gray-500">
          {draft.bio.length}/300
        </div>
      </div>

      {/* 에러 메시지 */}
      {!!msg && (
        <p className="mt-3 text-center text-sm sm:text-base text-gray-700 dark:text-gray-300">
          {msg}
        </p>
      )}

      {/* 액션 버튼: 좌 아웃라인 / 우 프라이머리 */}
      <div className="flex justify-between sm:justify-end gap-2 sm:gap-3 mt-6">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-gray-100 font-semibold py-2 px-4 rounded-lg hover:opacity-80 transition disabled:opacity-50"
        >
          이전
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={handleSubmit}
          className="bg-[var(--ara-primary)] text-white font-semibold py-2 px-4 rounded-lg hover:opacity-85 transition disabled:opacity-50"
        >
          {loading ? '회원가입 중...' : '회원가입 완료'}
        </button>
      </div>

      {/* 성공 모달 (톤 통일) */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">
          <div className="w-[360px] rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-6 text-center shadow-xl">
            <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-gray-100">
              회원가입 완료!
            </h3>
            <p className="mb-5 text-sm text-gray-600 dark:text-gray-300">
              인증 메일을 확인해주세요.
            </p>
            <button
              onClick={() => {
                setShowSuccess(false);
                onDone?.(); // 필요하면 플로우 종료 콜백
                navigate('/signin'); // 로그인 페이지로 이동
              }}
              className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
              style={{ background: 'var(--ara-primary)' }}
            >
              로그인 페이지로 이동
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
