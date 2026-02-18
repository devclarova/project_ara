import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { supabase } from '../../lib/supabase';
import type { ConsentResult } from '@/types/consent';
import { useTranslation } from 'react-i18next';

export type ProfileDraft = {
  bio: string;
  file: File | null;
  preview: string | null;
  coverFile: File | null;
  coverPreview: string | null;
};

type Props = {
  email: string;
  pw: string;
  nickname: string;
  gender: string;
  birth: Date | null;
  country: string;
  consents?: ConsentResult;
  onBack: () => void;
  onDone: () => void;
  draft: ProfileDraft;
  onChangeDraft: React.Dispatch<React.SetStateAction<ProfileDraft>>;
  signupKind: 'email' | 'social';
};

const DRAFT_KEY = 'signup-profile-draft';

// 로컬 기준 YYYY-MM-DD
function toYMDLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// [추가] 오늘 기준 만 14세 이상 여부
function isAge14Plus(dateLike?: Date | null) {
  if (!dateLike) return false;
  const birth = dateLike instanceof Date ? dateLike : new Date(dateLike);
  if (Number.isNaN(birth.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const notHadBirthday = today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  if (notHadBirthday) age -= 1;
  return age >= 14;
}

export default function SignUpStep3Profile(props: Props) {
  const {
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
    signupKind,
  } = props;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successKind, setSuccessKind] = useState<'social' | 'email' | null>(null);

  const handleSubmit = async () => {
    setMsg('');
    setLoading(true);

    try {
      const birthdayStr = birth ? toYMDLocal(birth) : '';

      if (!email?.trim()) {
        setMsg(t('validation.required_email'));
        return;
      }
      if (!nickname?.trim()) {
        setMsg(t('validation.required_nickname'));
        return;
      }
      if (!gender?.trim()) {
        setMsg(t('validation.required_gender'));
        return;
      }
      if (!birthdayStr) {
        setMsg(t('validation.required_birthday'));
        return;
      }
      if (!country?.trim()) {
        setMsg(t('validation.required_country'));
        return;
      }

      if (!isAge14Plus(birth)) {
        setMsg(t('validation.age_restriction'));
        return;
      }

      if (signupKind !== 'social') {
        if (!pw?.trim()) {
          setMsg(t('validation.required_password'));
          return;
        }
      }

      let pendingAvatarUrl: string | null = null;
      let finalAvatarUrl: string | null = null;
      let pendingBannerUrl: string | null = null;
      let finalBannerUrl: string | null = null;

      if (draft.file) {
        const ext =
          (draft.file.name.split('.').pop() || 'jpg').replace(/[^a-zA-Z0-9]/g, '') || 'jpg';

        if (signupKind === 'social') {
          const { data: s1 } = await supabase.auth.getSession();
          const uid = s1.session?.user?.id;
          if (!uid) {
            setMsg(t('auth.session_expired'));
            return;
          }
          const path = `avatars/${uid}/${uuid()}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from('avatars')
            .upload(path, draft.file, { upsert: true });
          if (upErr) {
            setMsg(`${t('auth.avatar_upload_failed')}: ${upErr.message}`);
            return;
          }
          const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
          finalAvatarUrl = pub?.publicUrl ?? null;
        } else {
          const path = `pending/${uuid()}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from('avatars')
            .upload(path, draft.file, { upsert: true });
          if (upErr) {
            console.warn('avatar upload skipped:', upErr);
          } else {
            const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
            pendingAvatarUrl = pub?.publicUrl ?? null;
          }
        }
      } else if (draft.preview && draft.preview.startsWith('http')) {
        finalAvatarUrl = draft.preview;
      }

      if (draft.coverFile) {
        const ext =
          (draft.coverFile.name.split('.').pop() || 'jpg').replace(/[^a-zA-Z0-9]/g, '') || 'jpg';

        if (signupKind === 'social') {
          const { data: s1 } = await supabase.auth.getSession();
          const uid = s1.session?.user?.id;
          if (!uid) {
            setMsg(t('auth.session_expired'));
            return;
          }
          const path = `covers/${uid}/${uuid()}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from('avatars')
            .upload(path, draft.coverFile, { upsert: true });
          if (upErr) {
            console.warn('cover upload skipped:', upErr);
          } else {
            const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
            finalBannerUrl = pub?.publicUrl ?? null;
          }
        } else {
          const path = `pending/covers/${uuid()}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from('avatars')
            .upload(path, draft.coverFile, { upsert: true });
          if (upErr) {
            console.warn('cover upload skipped:', upErr);
          } else {
            const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
            pendingBannerUrl = pub?.publicUrl ?? null;
          }
        }
      }

      if (signupKind === 'email') {
        const { data: s0 } = await supabase.auth.getSession();
        if (s0.session) {
          try {
            await supabase.auth.signOut({ scope: 'local' });
          } catch {
            /* no-op */
          }
        }

        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({
            nickname: nickname.trim(),
            gender: gender.trim(),
            birthday: birthdayStr,
            country: country.trim(),
            bio: (draft.bio ?? '').toString(),
            pendingAvatarUrl,
            pendingBannerUrl,
            tos_agreed: !!consents?.terms,
            privacy_agreed: !!consents?.privacy,
            age_confirmed: !!consents?.age,
            marketing_opt_in: !!consents?.marketing,
          }),
        );

        const { error } = await supabase.auth.signUp({
          email,
          password: pw,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              nickname: nickname.trim(),
              gender: gender.trim(),
              birthday: birthdayStr,
              country: country.trim(),
              bio: (draft.bio ?? '').toString(),
              pendingAvatarUrl,
              pendingBannerUrl,
              tos_agreed: !!consents?.terms,
              privacy_agreed: !!consents?.privacy,
              age_confirmed: !!consents?.age,
              marketing_opt_in: !!consents?.marketing,
            },
          },
        });

        if (error) {
          console.error('[signUp:error]', { message: error.message, name: error.name });
          const low = (error.message || '').toLowerCase();
          if (low.includes('already registered')) {
            setMsg(t('validation.email_already_exists'));
          } else {
            setMsg(t('auth.signup_error'));
          }
          return;
        }

        setSuccessKind('email');
        setShowSuccess(true);
        return;
      }

      const { data: s1 } = await supabase.auth.getSession();
      const uid = s1.session?.user?.id;
      if (!uid) {
        setMsg(t('auth.session_expired'));
        return;
      }

      const { error: upErr } = await supabase.from('profiles').upsert(
        {
          user_id: uid,
          nickname: nickname.trim(),
          avatar_url: finalAvatarUrl,
          banner_url: finalBannerUrl,
          birthday: birthdayStr,
          gender: gender.trim() as any,
          country: country.trim(),
          bio: (draft.bio ?? '').toString(),
          tos_agreed: !!consents?.terms,
          privacy_agreed: !!consents?.privacy,
          age_confirmed: !!consents?.age,
          marketing_opt_in: !!consents?.marketing,
          is_onboarded: true,
          is_public: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );

      if (upErr) {
        setMsg(`${t('auth.profile_save_failed')}: ${upErr.message}`);
        return;
      }

      setSuccessKind('social');
      setShowSuccess(true);
    } catch (e: any) {
      console.error('[handleSubmit:exception]', e);
      setMsg(t('auth.network_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 shadow dark:bg-secondary">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
        {t('profile.profile_optional')}
      </h2>

      <div className="flex flex-col items-center mt-1 sm:mt-2">
        <label className="mb-2 font-semibold text-gray-700 dark:text-gray-200 text-sm sm:text-base">
          {t('profile.profile_image')}
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
              {t('profile.select_image')}
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
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">{t('signup.image_size_hint')}</p>
      </div>

      <div className="mt-5">
        <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-200 text-sm sm:text-base">
          {t('profile.cover_photo')}
        </label>
        <label
          htmlFor="cover-upload"
          className="block w-full h-44 sm:h-48 rounded-2xl border-2 border-dashed border-gray-300 dark:border-white/20 overflow-hidden bg-gray-100 dark:bg-neutral-800 cursor-pointer hover:ring-2 hover:ring-[var(--ara-ring)] transition"
        >
          {draft.coverPreview ? (
            <img
              src={draft.coverPreview}
              alt="커버 미리보기"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm text-center">
                {t('profile.select_cover')}
              </span>
            </div>
          )}
          <input
            id="cover-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0] ?? null;
              if (!f) return onChangeDraft(d => ({ ...d, coverFile: null, coverPreview: null }));
              const url = URL.createObjectURL(f);
              onChangeDraft(d => ({ ...d, coverFile: f, coverPreview: url }));
            }}
          />
        </label>
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">{t('profile.cover_photo_hint')}</p>
      </div>

      <div className="mt-5">
        <label htmlFor="bio" className="block font-semibold text-gray-800 dark:text-gray-100 mb-2">
          {t('profile.bio')}
        </label>
        <textarea
          id="bio"
          value={draft.bio}
          onChange={e => onChangeDraft(d => ({ ...d, bio: e.target.value.slice(0, 300) }))}
          rows={4}
          placeholder={t('profile.bio_placeholder')}
          className="w-full h-32 resize-none rounded-lg border border-gray-300 dark:border-white/15 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--ara-ring)]"
        />
        <div className="mt-1 text-right text-[11px] text-gray-400 dark:text-gray-500">
          {draft.bio.length}/300
        </div>
      </div>

      {!!msg && (
        <p className="mt-3 text-center text-sm sm:text-base text-gray-700 dark:text-gray-300">
          {msg}
        </p>
      )}

      <div className="flex justify-between sm:justify-end gap-2 sm:gap-3 mt-6 xs:mt-4">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="bg-gray-100 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:opacity-80 transition-colors dark:bg-neutral-500 dark:text-gray-100 xs:text-[14px] xs:py-1.5 disabled:opacity-50"
        >
          {t('auth.previous')}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={handleSubmit}
          className="bg-[var(--ara-primary)] text-white font-semibold py-2 px-4 rounded-lg hover:opacity-85 transition-colors disabled:opacity-50 disabled:cursor-not-allowed xs:text-[14px] xs:py-1.5"
        >
          {loading ? t('auth.signing_up') : t('auth.signup_complete')}
        </button>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">
          <div className="w-[360px] rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-6 text-center shadow-xl">
            <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-gray-100">
              {t('auth.signup_complete_message')}
            </h3>

            <p className="mb-5 text-sm text-gray-600 dark:text-gray-300">
              {successKind === 'social'
                ? t('auth.service_ready')
                : t('auth.check_verification_email')}
            </p>

            <button
              onClick={() => {
                setShowSuccess(false);
                onDone?.();
                navigate(successKind === 'social' ? '/studyList' : '/');
              }}
              className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
              style={{ background: 'var(--ara-primary)' }}
            >
              {successKind === 'social' ? t('auth.start_now') : t('auth.go_home')}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
