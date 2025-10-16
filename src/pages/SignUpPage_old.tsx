import React, { useState } from 'react';
import CountrySelect from '../components/auth/CountrySelect';
import BirthInput from '../components/auth/BirthInput';
import GenderSelect from '../components/auth/GenderSelect';
import { useNavigate } from 'react-router-dom';
import InputField from '../components/auth/InputField';
import { supabase } from '../lib/supabase';
import { v4 as uuid } from 'uuid';
import type { Database } from '../types/database';

type Gender = Database['public']['Enums']['gender_enum'];
const GENDERS: readonly Gender[] = ['Male', 'Female'] as const;
const isGender = (v: string): v is Gender => (GENDERS as readonly string[]).includes(v);

async function uploadAvatar(file: File) {
  // 로그인된 사용자 정보 가져오기
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) throw new Error('로그인된 사용자만 업로드할 수 있습니다.');

  // 확장자, 경로 설정
  const ext = (file.name.split('.').pop() || 'jpg').replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
  const path = `${uid}/${uuid()}.${ext}`; // ✅ uuid() 호출

  // Supabase Storage에 업로드
  const { error: upErr } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true });
  if (upErr) throw new Error(upErr.message);

  // 공개 URL 얻기
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  const publicUrl = data?.publicUrl ?? null;

  // 프로필 테이블에 반영
  if (publicUrl) {
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('user_id', uid);
  }

  return publicUrl;
}

function SignUpPage_old() {
  const navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [birth, setBirth] = useState<Date | null>(null);
  const [country, setCountry] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailCheckResult, setEmailCheckResult] = useState<'available' | 'taken' | ''>('');
  const [nickChecking, setNickChecking] = useState(false);
  const [nickCheckResult, setNickCheckResult] = useState<'available' | 'taken' | ''>('');

  const AVATAR_BUCKET = 'avatars';

  // Error/UI state
  const [errors, setErrors] = useState<{
    email?: string;
    pw?: string;
    confirmPw?: string;
    nickname?: string;
    gender?: string;
    birth?: string;
    country?: string;
    profileImage?: string;
  }>({});
  const [msg, setMsg] = useState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [loading, setLoading] = useState(false);

  // 유효성 검사
  type FieldKey =
    | 'email'
    | 'pw'
    | 'confirmPw'
    | 'nickname'
    | 'gender'
    | 'birth'
    | 'country'
    | 'profileImage';
  const validateField = (field: FieldKey, value: string | Date | null): string => {
    switch (field) {
      case 'email': {
        const v = typeof value === 'string' ? value : '';
        if (!v) return '이메일을 입력해주세요.';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(v)) return '잘못된 이메일 형식입니다.';
        return '';
      }
      case 'pw': {
        const v = typeof value === 'string' ? value : '';
        if (!v) return '비밀번호를 입력해주세요.';
        if (v.length < 6) return '비밀번호는 최소 6자 이상이어야 합니다.';
        return '';
      }
      case 'confirmPw': {
        const v = typeof value === 'string' ? value : '';
        if (!v) return '비밀번호를 확인해주세요.';
        if (v !== pw) return '비밀번호가 일치하지 않습니다.';
        return '';
      }
      case 'nickname': {
        if (!(typeof value === 'string' && value)) return '닉네임을 입력해주세요.';
        return '';
      }
      case 'gender': {
        if (!(typeof value === 'string' && value)) return '성별을 선택해주세요.';
        return '';
      }
      case 'birth': {
        if (!(value instanceof Date)) return '생년월일을 입력해주세요.';
        return '';
      }
      case 'country': {
        if (!(typeof value === 'string' && value)) return '국적을 선택해주세요.';
        return '';
      }
      default:
        return '';
    }
  };

  const getPasswordStrength = (pwVal: string) => {
    if (!pwVal) return '';
    const hasNumber = /\d/.test(pwVal);
    const hasLetter = /[a-zA-Z]/.test(pwVal);
    const hasSpecial = /[!@#$%^&*]/.test(pwVal);
    if (pwVal.length < 6) return '비밀번호는 최소 6자 이상이어야 합니다.';
    if (!(hasNumber && hasLetter && hasSpecial))
      return '문자, 숫자, 특수문자(!/@/#/$/%/^/&/*)를 포함하세요.';
    return '';
  };

  async function checkEmailAvailability(email: string): Promise<boolean> {
    if (!email) return false;
    const { data, error } = await supabase.rpc('email_exists', { _email: email });
    if (error) {
      console.error('email_exists error:', error.message);
      return false;
    }
    // data === true → 이미 존재 → 사용 불가
    return data === false;
  }

  async function checkNicknameAvailability(nickname: string): Promise<boolean> {
    const n = nickname.trim();
    if (!n) return false;

    const { data, error } = await supabase.rpc('nickname_exists', { _nickname: n });
    if (error) {
      console.error('nickname_exists error:', error.message);
      // 실패 시 보수적으로 "사용 불가" 처리해도 되고, 여기선 false 반환
      return false;
    }
    // data === true → 이미 존재 → 사용 불가
    return data === false;
  }

  const handleChange = async (field: keyof typeof errors, value: string) => {
    setErrors(prev => ({ ...prev, [field]: '' }));
    switch (field) {
      case 'email': {
        setEmail(value);
        setEmailCheckResult('');
        const baseErr = validateField('email', value);
        setErrors(prev => ({ ...prev, email: baseErr }));

        // if (!baseErr) {
        //   const ok = await checkEmailAvailability(value);
        //   setErrors(prev => ({
        //     ...prev,
        //     email: ok ? '' : 'This email is already registered.',
        //   }));
        // }
        break;
      }
      case 'pw': {
        setPw(value);
        const strengthMsg = getPasswordStrength(value);
        setErrors(prev => ({
          ...prev,
          pw: validateField('pw', value) || strengthMsg,
          confirmPw: validateField('confirmPw', confirmPw),
        }));
        break;
      }
      case 'confirmPw':
        setConfirmPw(value);
        setErrors(prev => ({
          ...prev,
          confirmPw: validateField('confirmPw', value),
        }));
        break;
      case 'nickname': {
        setNickname(value);
        setNickCheckResult('');
        const baseErr = validateField('nickname', value);
        setErrors(prev => ({ ...prev, nickname: baseErr }));
        break;
      }
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, profileImage: '파일 크기는 2MB 이하만 가능합니다.' }));
      setProfileImage(null);
      setPreviewUrl(null);
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      setErrors(prev => ({ ...prev, profileImage: 'JPG, PNG, GIF만 등록 가능합니다.' }));
      setProfileImage(null);
      setPreviewUrl(null);
      return;
    }

    setProfileImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setErrors(prev => ({ ...prev, profileImage: '' }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitAttempted(true);

    // 1) 폼 유효성
    const newErrors: typeof errors = {
      email: validateField('email', email),
      pw: validateField('pw', pw),
      confirmPw: validateField('confirmPw', confirmPw),
      nickname: validateField('nickname', nickname),
      gender: validateField('gender', gender),
      birth: validateField('birth', birth),
      country: validateField('country', country),
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    setLoading(true);
    setMsg('');

    try {
      // 2) Supabase Auth로 회원가입(메타데이터 포함)
      // 프로필 사진 업로드 시 먼저 업로드
      let avatarUrl: string | null = null;
      if (profileImage) {
        const ext =
          (profileImage.name.split('.').pop() || 'jpg').replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
        const path = `pending/${uuid()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('avatars')
          .upload(path, profileImage, { upsert: true });
        if (upErr) throw new Error(upErr.message);
        const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
        avatarUrl = pub?.publicUrl ?? null;
      }

      const [emailOK, nicknameOK] = await Promise.all([
        checkEmailAvailability(email),
        checkNicknameAvailability(nickname),
      ]);
      if (!emailOK || !nicknameOK) {
        setErrors(prev => ({
          ...prev,
          email: emailOK ? prev.email : '이 이메일은 사용 중입니다.',
          nickname: nicknameOK ? prev.nickname : '이 닉네임은 사용 중입니다.',
        }));
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password: pw,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            gender, // enum 라벨과 정확히 일치해야 함
            nickname,
            birthday: birth!.toISOString().slice(0, 10),
            country,
            avatar_url: avatarUrl,
          },
        },
      });

      if (error) {
        setMsg(error.message);
        setLoading(false);
        return;
      }

      // 3) 성공 모달 (이메일 인증 유도)
      setShowSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      setMsg(`Unexpected error: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-16 flex items-center justify-center">
      <div className="w-full max-w-md sm:max-w-lg md:max-w-2xl rounded-2xl p-4 sm:p-6 md:p-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-gray-800 mb-4 sm:mb-6">
          회원가입
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4 md:gap-5">
          {/* Profile Image (프리뷰만; 업로드는 인증 후 별도 플로우) */}
          <div className="flex flex-col items-center mt-1 sm:mt-2">
            <label className="mb-2 font-semibold text-gray-700 text-sm sm:text-base">
              프로필 이미지 선택
            </label>
            <label
              htmlFor="profile-upload"
              className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden bg-gray-50 cursor-pointer
                ${errors.profileImage ? 'border-red-500' : 'border-gray-300'} hover:ring-2 hover:ring-primary`}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Profile Preview"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400 text-xs sm:text-sm text-center">사진 등록</span>
              )}
              <input
                type="file"
                accept="image/*"
                id="profile-upload"
                className="hidden"
                onChange={handleProfileChange}
              />
            </label>
            {errors.profileImage && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.profileImage}</p>
            )}
          </div>

          <InputField
            id="email"
            label="이메일"
            value={email}
            onChange={val => handleChange('email', val)}
            error={errors.email}
            onCheck={async () => {
              const v = email.trim();
              if (!v) {
                setEmailCheckResult('');
                setErrors(prev => ({ ...prev, email: '이메일을 입력해주세요.' }));
                return;
              }
              // 형식 오류면 중복체크 하지 않음
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(v)) {
                setEmailCheckResult('');
                setErrors(prev => ({ ...prev, email: '올바르지 않은 이메일 형식입니다.' }));
                return;
              }

              setEmailChecking(true);
              const ok = await checkEmailAvailability(v);
              setEmailChecking(false);

              if (ok) {
                setEmailCheckResult('available');
                setErrors(prev => ({ ...prev, email: '' })); // ✅ 에러 비워서 안내문구가 보이도록
              } else {
                setEmailCheckResult('taken');
                setErrors(prev => ({ ...prev, email: '해당 이메일은 이미 사용 중입니다.' }));
              }
            }}
            isChecking={emailChecking}
            checkResult={emailCheckResult}
          />
          <InputField
            id="pw"
            label="비밀번호"
            type="password"
            value={pw}
            onChange={val => handleChange('pw', val)}
            error={errors.pw}
          />
          <InputField
            id="confirmPw"
            label="비밀번호 확인"
            type="password"
            value={confirmPw}
            onChange={val => handleChange('confirmPw', val)}
            error={errors.confirmPw}
          />
          <InputField
            id="nickname"
            label="닉네임"
            value={nickname}
            onChange={val => handleChange('nickname', val)}
            error={errors.nickname}
            onCheck={async () => {
              const n = nickname.trim();
              if (!n) {
                setNickCheckResult('');
                setErrors(prev => ({ ...prev, nickname: '닉네임을 입력해주세요.' }));
                return;
              }

              setNickChecking(true);
              const ok = await checkNicknameAvailability(n);
              setNickChecking(false);

              if (ok) {
                setNickCheckResult('available');
                setErrors(prev => ({ ...prev, nickname: '' })); // ✅ 에러 비우기
              } else {
                setNickCheckResult('taken');
                setErrors(prev => ({ ...prev, nickname: '해당 닉네임은 이미 사용 중입니다.' }));
              }
            }}
            isChecking={nickChecking}
            checkResult={nickCheckResult}
          />

          <GenderSelect
            value={gender}
            onChange={(val: string) => {
              if (isGender(val)) {
                setGender(val); // val은 여기서 Gender로 좁혀짐
                setErrors(prev => ({ ...prev, gender: '' }));
              } else {
                // 안전장치: 예상 밖 값이면 선택 해제
                setGender('');
                setErrors(prev => ({ ...prev, gender: '성별을 선택해주세요.' }));
              }
            }}
            error={!!errors.gender}
          />
          <BirthInput
            value={birth}
            onChange={val => {
              setBirth(val);
              setErrors(prev => ({ ...prev, birth: '' }));
            }}
            error={!!errors.birth}
          />
          <CountrySelect
            value={country}
            onChange={val => {
              setCountry(val);
              setErrors(prev => ({ ...prev, country: '' }));
            }}
            error={!!errors.country}
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-white font-semibold py-2 sm:py-3 rounded-lg hover:opacity-75 transition-colors text-sm sm:text-base disabled:opacity-50"
          >
            {loading ? '회원가입 중...' : '회원가입'}
          </button>
        </form>

        {msg && <p className="mt-3 sm:mt-4 text-center text-red-500 text-sm sm:text-base">{msg}</p>}

        {showSuccess && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-xl p-6 w-80 text-center">
              <h2 className="text-lg font-bold mb-4">회원가입 완료!</h2>
              <p className="mb-4">이메일로 발송된 인증 메일을 확인해주세요.</p>
              <button
                onClick={() => {
                  setShowSuccess(false);
                  navigate('/signin');
                }}
                className="bg-primary text-white py-2 px-4 rounded-lg hover:opacity-75"
              >
                로그인으로 이동
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SignUpPage_old;
