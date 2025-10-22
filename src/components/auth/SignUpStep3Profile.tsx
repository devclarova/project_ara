import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { supabase } from '../../lib/supabase';
import type { ConsentResult } from './SignUpStep1Consent'; // 경로 맞춰주세요

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
          onChangeDraft(d => ({ ...d /* file 유지, preview 유지 */ }));
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

      // 5) 요구사항: "회원가입 누르면 user는 넘기라고."
      // 응답 user.id / user.email 기반으로 users upsert 시도 (세션 없어도 가능)
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
    <div className="space-y-4">
      {/* 프로필 추가 입력(소개 등) — draft.bio 바인딩 예시 */}
      <div className="space-y-2">
        <label htmlFor="bio" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          소개(선택)
        </label>
        <textarea
          value={draft.bio}
          onChange={e => onChangeDraft(d => ({ ...d, bio: e.target.value.slice(0, 500) }))} // 500자 컷
          rows={4}
          placeholder="간단한 자기소개 (최대 300자)"
        />
      </div>

      {/* 아바타 업로드 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          프로필 이미지(선택)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={e => {
            const f = e.target.files?.[0] ?? null;
            if (!f) return onChangeDraft(d => ({ ...d, file: null, preview: null }));
            const url = URL.createObjectURL(f);
            onChangeDraft(d => ({ ...d, file: f, preview: url }));
          }}
        />
        {draft.preview && (
          <img
            src={draft.preview}
            alt="미리보기"
            className="mt-2 h-24 w-24 rounded-full object-cover ring-1 ring-black/10"
          />
        )}
      </div>

      {!!msg && <p className="text-sm text-red-500">{msg}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-lg border px-4 py-3 font-medium"
        >
          이전
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={handleSubmit}
          className="flex-1 rounded-lg px-4 py-3 font-semibold text-white"
          style={{ background: 'var(--ara-primary)' }}
        >
          {loading ? '처리 중…' : '회원가입'}
        </button>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">
          <div className="w-[320px] rounded-xl bg-white p-6 text-center dark:bg-neutral-900">
            <h2 className="mb-2 text-lg font-bold">회원가입 완료!</h2>
            <p className="mb-4 text-sm">인증 메일을 확인해주세요.</p>
            <button
              onClick={() => {
                setShowSuccess(false);
                onDone?.(); // 필요하면 플로우 종료 콜백
                navigate('/signin'); // 로그인 페이지로 이동
              }}
              className="w-full rounded-lg py-2 font-medium text-white"
              style={{ background: 'var(--ara-primary)' }}
            >
              로그인 페이지로 이동
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
