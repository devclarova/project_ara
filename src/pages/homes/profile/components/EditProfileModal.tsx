import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import CountrySelect from '@/components/auth/CountrySelect';
import { useTranslation } from 'react-i18next';
import { useNicknameValidator } from '@/hooks/useNicknameValidator';
import NicknameInputField from '@/components/common/NicknameInputField';
import TextAreaField from '@/components/auth/TextAreaField';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: {
    id: string;
    user_id: string;
    name: string;
    username: string;
    avatar: string;
    bio: string;
    banner?: string | null;
    country?: string | null;
    countryFlagUrl?: string | null;
    // New tracking columns
    nickname_updated_at?: string | null;
    country_updated_at?: string | null;
  };
  onSave: (updatedProfile: any) => void;
}

// countries 테이블 구조에 맞게 타입 수정 (id + name 기준)
type CountryOption = {
  id: number;
  name: string;
  flag: string | null;
  flag_url: string | null;
};

export default function EditProfileModal({
  isOpen,
  onClose,
  userProfile,
  onSave,
}: EditProfileModalProps) {
  const { t } = useTranslation();
  
  // Nickname Validator Hook
  const nickValidator = useNicknameValidator();

  const [formData, setFormData] = useState({
    name: userProfile.name,
    bio: userProfile.bio ?? '',
    // 여기서는 일단 빈 문자열로 두고, countries를 불러온 뒤에 id로 다시 채워줄 거라 상관 없음
    country: '',
  });

  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(false);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [previewAvatar, setPreviewAvatar] = useState(userProfile.avatar);
  const [previewBanner, setPreviewBanner] = useState(userProfile.banner ?? null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  // 모달이 열릴 때마다 초기화
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        name: userProfile.name,
        bio: userProfile.bio ?? '',
        // country는 아래 fetchCountries에서 "id"로 다시 세팅
        country: '',
      }));
      setAvatarFile(null);
      setBannerFile(null);
      setPreviewAvatar(userProfile.avatar);
      setPreviewBanner(userProfile.banner ?? null);
      setSaving(false);
      
      // Initialize validator with current nickname to show language hint immediately
      nickValidator.validateInput(userProfile.name);

      const fetchCountries = async () => {
        try {
          setCountriesLoading(true);
          const { data, error } = await supabase
            .from('countries')
            .select('id, name, flag, flag_url') // id + name 기준으로 수정
            .order('id', { ascending: true });

          if (error) throw error;

          const list = data || [];
          setCountries(list);

          // 현재 프로필의 국가 이름(userProfile.country)에 해당하는 id를 찾아서
          //    formData.country를 그 id로 세팅 → CountrySelect가 처음부터 선택된 상태로 표시됨
          if (userProfile.country) {
            const matched = list.find(c => c.name === userProfile.country);
            if (matched) {
              setFormData(prev => ({
                ...prev,
                country: String(matched.id), // CountrySelect는 String(c.id)를 value로 사용
              }));
            }
          }
        } catch (err) {
          console.error('국가 목록 불러오기 실패:', err);
          toast.error(t('common.error_loading_countries', 'Failed to load country list.'));
        } finally {
          setCountriesLoading(false);
        }
      };

      fetchCountries();
    }
  }, [isOpen, userProfile]);

  if (!isOpen) return null;

  const handleInputChange = (field: 'name' | 'bio' | 'country', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    if (type === 'avatar') {
      setAvatarFile(file);
      setPreviewAvatar(previewUrl);
    } else {
      setBannerFile(file);
      setPreviewBanner(previewUrl);
    }
  };

  const uploadImage = async (file: File, folder: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userProfile.user_id}-${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;
    const { error } = await supabase.storage.from('tweet_media').upload(filePath, file);
    if (error) throw error;
    const { data } = supabase.storage.from('tweet_media').getPublicUrl(filePath);
    return data.publicUrl;
  };

  // 🔹 One-Time Change Logic
  const isNickDisabled = !!userProfile.nickname_updated_at;
  const isCountryDisabled = !!userProfile.country_updated_at;

  const handleSave = async () => {
    if (saving) return;
    
    const isNickChanged = formData.name !== userProfile.name;
    const isCountryChanged = formData.country !== (userProfile.country ? String(countries.find(c => c.name === userProfile.country)?.id) : '');
    // Note: comparison above is tricky because userProfile.country is NAME, while formData.country is ID string.
    // Better: Check if `formData.country` matches the ID of the country with name `userProfile.country`.
    // Actually, simpler:
    // We already compute `selectedCountry` later.
    
    // Security / Validation
    if (isNickDisabled && isNickChanged) {
        toast.error(t('profile.nickname_change_forbidden', 'Nickname cannot be changed again.'));
        return;
    }
    if (isCountryDisabled && formData.country !== (countries.find(c => c.name === userProfile.country)?.id?.toString() ?? '')) {
         // Double check if it actually changed
         // If userProfile.country is null and formData is '', it's same.
         const originalCountryId = userProfile.country ? countries.find(c => c.name === userProfile.country)?.id?.toString() : '';
         if (formData.country !== originalCountryId) {
             toast.error(t('profile.country_change_forbidden', 'Country cannot be changed again.'));
             return;
         }
    }

    // Nickname Validation Check
    if (isNickChanged) {
        if (nickValidator.checkResult !== 'available' || nickValidator.lastCheckedNick !== formData.name) {
            const available = await nickValidator.checkAvailability(formData.name);
            if (!available) return;
        }
    } else {
       const { error } = nickValidator.validateFormat(formData.name);
       if (error) {
           nickValidator.setError(error);
           return;
       }
    }
    
    setSaving(true);

    try {
      let avatarUrl = userProfile.avatar;
      let bannerUrl = userProfile.banner ?? null;

      if (avatarFile) avatarUrl = await uploadImage(avatarFile, 'avatars');
      if (bannerFile) bannerUrl = await uploadImage(bannerFile, 'banners');

      const selectedCountry = countries.find(c => String(c.id) === formData.country) || null;
      
      const updates: any = {
          nickname: formData.name,
          bio: formData.bio,
          country: formData.country || null,
          avatar_url: avatarUrl,
          banner_url: bannerUrl,
      };

      // Set timestamp if changed
      if (isNickChanged) updates.nickname_updated_at = new Date().toISOString();
      // Logic for country change detection again to be safe
      const originalCountryId = userProfile.country ? countries.find(c => c.name === userProfile.country)?.id?.toString() : '';
      if (formData.country !== originalCountryId) {
          updates.country_updated_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userProfile.id);

      if (error) throw error;

      // 로컬 상태 업데이트
      const updated = {
        ...userProfile,
        name: formData.name,
        bio: formData.bio,
        country: selectedCountry?.name ?? userProfile.country ?? null,
        countryFlagUrl: selectedCountry?.flag_url ?? userProfile.countryFlagUrl ?? null,
        avatar: avatarUrl,
        banner: bannerUrl,
        // Update local timestamps if they were updated
        nickname_updated_at: updates.nickname_updated_at ?? userProfile.nickname_updated_at,
        country_updated_at: updates.country_updated_at ?? userProfile.country_updated_at,
      };
      onSave(updated);

      if (isNickChanged) {
         navigate(`/profile/${encodeURIComponent(formData.name)}`);
      }

      toast.success(t('profile.save_success_message', 'Profile updated successfully.'));

      setTimeout(() => {
        onClose();
      }, 300);
    } catch (err: any) {
      console.error('프로필 업데이트 실패:', err?.message || err);
      toast.error(t('profile.save_error_message', 'Error saving profile.'));
    } finally {
      setSaving(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  // 현재 선택된 국가의 플래그 (미리보기용)
  const currentCountry = countries.find(c => String(c.id) === formData.country) || null;
  const currentFlagUrl = currentCountry?.flag_url ?? userProfile.countryFlagUrl ?? null;
  const currentFlagEmoji = currentCountry?.flag ?? null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-secondary rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-primary/10 transition-colors"
            >
              <i className="ri-close-line text-xl text-gray-700 dark:text-gray-200"></i>
            </button>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('profile.edit_profile')}</h2>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || (nickValidator.checking)}
            className="px-4 py-2 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition disabled:opacity-60"
          >
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Cover */}
          <div className="relative">
            <div className="h-32 sm:h-40 bg-gray-200 rounded-xl overflow-hidden relative">
              {previewBanner && (
                <img
                  src={previewBanner}
                  alt="Banner"
                  className="w-full h-full object-cover object-center"
                />
              )}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                <label className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center cursor-pointer hover:bg-black/70">
                  <i className="ri-camera-line text-white text-lg"></i>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => handleFileChange(e, 'banner')}
                  />
                </label>
              </div>
            </div>

            {/* Avatar */}
            <div className="absolute -bottom-8 left-4">
              <div className="w-20 h-20 rounded-full border-4 border-white bg-white overflow-hidden relative">
                <img src={previewAvatar} alt="Avatar" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                  <label className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center cursor-pointer hover:bg-black/70">
                    <i className="ri-camera-line text-white text-sm"></i>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => handleFileChange(e, 'avatar')}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="pt-10 space-y-6">
            {/* 닉네임 */}
            <div>
              <NicknameInputField
                value={formData.name}
                onChange={v => {
                  if (isNickDisabled) return;
                  handleInputChange('name', v);
                  nickValidator.validateInput(v);
                }}
                onCheck={() => nickValidator.checkAvailability(formData.name)}
                isChecking={nickValidator.checking}
                checkResult={nickValidator.checkResult}
                error={nickValidator.error}
                detectedLang={nickValidator.detectedLang}
                minLen={nickValidator.detectedLang ? nickValidator.minLen(nickValidator.detectedLang) : 0}
                maxLen={nickValidator.detectedLang ? nickValidator.maxLen(nickValidator.detectedLang) : 0}
                disabled={isNickDisabled}
              />
              {/* Warning / Reason Message */}
              {isNickDisabled ? (
                <p className="text-[11px] text-gray-400 mt-1 ml-3">
                  {t('profile.nickname_disabled_reason', 'Nickname can only be changed once.')}
                </p>
              ) : (
                <p className="text-[11px] text-orange-500 mt-1 ml-3">
                  {t('profile.nickname_change_warning', '⚠️ You can only change your nickname once.')}
                </p>
              )}
            </div>

            {/* 소개글 - Floating Label Pattern applied via TextAreaField */}
            <div>
              <TextAreaField
                id="bio"
                label={t('profile.bio')}
                value={formData.bio}
                onChange={v => handleInputChange('bio', v)}
                maxLength={160}
                rows={3}
              />
            </div>

            {/* 국가 선택 (CountrySelect 사용) */}
            <div>
              <CountrySelect
                value={formData.country}
                onChange={value => {
                    if (isCountryDisabled) return;
                    handleInputChange('country', value);
                }}
                error={false}
                isDisabled={isCountryDisabled}
              />
              {/* Warning / Reason Message */}
                {isCountryDisabled ? (
                <p className="text-[11px] text-gray-400 mt-1 ml-3">
                  {t('profile.country_disabled_reason', 'Country can only be changed once.')}
                </p>
              ) : (
                 !isCountryDisabled && formData.country !== '' && ( // Show warning only if value is selected or general? Just show general
                    <p className="text-[11px] text-orange-500 mt-1 ml-3">
                    {t('profile.country_change_warning', '⚠️ You can only change your country once.')}
                    </p>
                 )
              )}
              {countriesLoading && (
                <p className="text-xs text-gray-400 mt-1">{t('common.loading_countries', 'Loading countries...')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
