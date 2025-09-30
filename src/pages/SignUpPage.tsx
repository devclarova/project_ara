import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CountrySelect from '../components/common/CountrySelect';
import BirthInput from '../components/common/BirthInput';
import GenderSelect from '../components/common/GenderSelect';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import InputField from '../components/auth/InputField';

function SignUpPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState('');
  const [birth, setBirth] = useState<Date | null>(null);
  const [country, setCountry] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Error state
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

  // 유효성 검사 함수
  const validateField = (field: string, value: any) => {
    switch (field) {
      case 'email':
        if (!value) return 'Please enter your email.';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Invalid email format.';
        return '';
      case 'pw':
        if (!value) return 'Please enter your password.';
        if (value.length < 6) return 'Password must be at least 6 characters.';
        return '';
      case 'confirmPw':
        if (!value) return 'Please confirm your password.';
        if (value !== pw) return 'Passwords do not match.';
        return '';
      case 'nickname':
        if (!value) return 'Please enter your nickname.';
        return '';
      case 'gender':
        if (!value) return 'Please select your gender.';
        return '';
      case 'birth':
        if (!value) return 'Please select your birth date.';
        return '';
      case 'country':
        if (!value) return 'Please select your country.';
        return '';
      case 'profileImage':
        return '';
      default:
        return '';
    }
  };

  // 비밀번호 강도 판단 함수
  const getPasswordStrength = (pw: string) => {
    if (!pw) return '';
    const hasNumber = /\d/.test(pw);
    const hasLetter = /[a-zA-Z]/.test(pw);
    const hasSpecial = /[!@#$%^&*]/.test(pw);
    if (pw.length < 6) return 'Password must be at least 6 characters';
    if (!(hasNumber && hasLetter && hasSpecial))
      return 'Use letters, numbers, and special characters';
    return '';
  };

  const handleChange = (field: keyof typeof errors, value: any) => {
    setErrors(prev => ({ ...prev, [field]: '' }));

    switch (field) {
      case 'email':
        setEmail(value);
        setErrors(prev => ({ ...prev, email: validateField('email', value) }));
        break;
      case 'pw':
        setPw(value);
        // 비밀번호 강도 체크
        const strengthMsg = getPasswordStrength(value);
        setErrors(prev => ({
          ...prev,
          pw: validateField('pw', value) || strengthMsg,
          confirmPw: validateField('confirmPw', confirmPw),
        }));
        break;

      case 'confirmPw':
        setConfirmPw(value);
        setErrors(prev => ({
          ...prev,
          confirmPw: validateField('confirmPw', value),
        }));
        break;
      case 'nickname':
        setNickname(value);
        setErrors(prev => ({ ...prev, nickname: validateField('nickname', value) }));
        break;
      default:
        break;
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, profileImage: 'File size must be under 2MB' }));
      setProfileImage(null);
      setPreviewUrl(null);
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      setErrors(prev => ({ ...prev, profileImage: 'Only JPG, PNG, GIF allowed' }));
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
      // Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: pw,
      });

      // 이메일 인증 확인 필요 안내
      if (signUpData?.user?.confirmation_sent_at) {
        // setMsg('Sign-up successful! Please verify your email before logging in.');
        // 회원가입 성공 후
        setShowSuccess(true); // 모달 띄우기
        setLoading(false); // 버튼 로딩 해제
      }

      if (signUpError || !signUpData.user) {
        setMsg(signUpError?.message || 'Sign-up failed.');
        setLoading(false);
        return;
      }

      const userId = signUpData.user.id;

      // Profile Image Upload
      let avatar_url: string | null = null;
      if (profileImage) {
        const fileExt = profileImage.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, profileImage);

        if (uploadError) {
          setErrors(prev => ({ ...prev, profileImage: 'Image upload failed.' }));
          setProfileImage(null);
          setPreviewUrl(null);
          setLoading(false);
          return;
        }

        const urlData: any = supabase.storage.from('avatars').getPublicUrl(filePath);
        avatar_url = urlData.data.publicUrl;
      }

      // Insert Profile
      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: userId,
        nickname,
        avatar_url,
        bio: '',
        birthday: birth,
        gender,
        country,
      });

      if (profileError) {
        setMsg(`Profile creation failed: ${profileError.message}`);
        setLoading(false);
        return;
      }

      setMsg('Sign-up successful! Please verify your email.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setMsg(`Unexpected error: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-16 flex items-center justify-center">
      <div className="w-full max-w-md sm:max-w-lg md:max-w-2xl rounded-2xl p-4 sm:p-6 md:p-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-gray-800 mb-4 sm:mb-6">
          Create an Ara Account
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4 md:gap-5">
          {/* Profile Image */}
          <div className="flex flex-col items-center mt-1 sm:mt-2">
            <label className="mb-2 font-semibold text-gray-700 text-sm sm:text-base">
              Select Profile Picture
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
                <span className="text-gray-400 text-xs sm:text-sm text-center">
                  Click to upload
                </span>
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

          {/* Email */}
          <InputField
            id="email"
            label="Email"
            value={email}
            onChange={val => handleChange('email', val)}
            error={errors.email}
          />

          {/* Password */}
          <InputField
            id="pw"
            label="Password"
            type="password"
            value={pw}
            onChange={val => handleChange('pw', val)}
            error={errors.pw}
          />

          {/* Confirm Password */}
          <InputField
            id="confirmPw"
            label="Confirm Password"
            type="password"
            value={confirmPw}
            onChange={val => handleChange('confirmPw', val)}
            error={errors.confirmPw}
          />

          {/* Nickname */}
          <InputField
            id="nickname"
            label="Nickname"
            value={nickname}
            onChange={val => handleChange('nickname', val)}
            error={errors.nickname}
          />

          {/* Gender / Birth / Country */}
          <GenderSelect
            value={gender}
            onChange={val => {
              setGender(val);
              setErrors(prev => ({ ...prev, gender: '' }));
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
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>

        {msg && <p className="mt-3 sm:mt-4 text-center text-red-500 text-sm sm:text-base">{msg}</p>}

        {showSuccess && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-xl p-6 w-80 text-center">
              <h2 className="text-lg font-bold mb-4">Sign Up Successful!</h2>
              <p className="mb-4">Please check your email to verify your account.</p>
              <button
                onClick={() => {
                  setShowSuccess(false); // 모달 닫기
                  navigate('/signin'); // 로그인 페이지로 이동
                }}
                className="bg-primary text-white py-2 px-4 rounded-lg hover:opacity-75"
              >
                Go to Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SignUpPage;
