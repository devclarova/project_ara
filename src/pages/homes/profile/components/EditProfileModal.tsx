import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import CountrySelect from '@/components/auth/CountrySelect';

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
    bannerPositionY?: number;
    country?: string | null; // 화면에 보이는 "국가 이름" (예: 대한민국)
    countryFlagUrl?: string | null; // 현재 국기 URL
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
  const [charCount, setCharCount] = useState(userProfile.bio?.length || 0);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  // 커버 이미지 이동
  const [bannerPosY, setBannerPosY] = useState(userProfile.bannerPositionY ?? 50); // 다시 열릴때 초기화
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const startPosRef = useRef(50);
  const bannerPosYRef = useRef(bannerPosY);

  // ESC로 모달 닫기
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  // ref 동기화
  useEffect(() => {
    bannerPosYRef.current = bannerPosY;
  }, [bannerPosY]);

  // 드래그 종료
  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

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
      setCharCount(userProfile.bio?.length || 0);
      setSaving(false);
      setBannerPosY(userProfile.bannerPositionY ?? 50);

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
          toast.error('국가 목록을 불러오는 중 오류가 발생했습니다.');
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
    if (field === 'bio') setCharCount(value.length);
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

  // 이전 배너 삭제
  const deleteOldBanner = async () => {
    if (userProfile.banner) {
      const path = userProfile.banner.split('/').pop();
      await supabase.storage.from('tweet_media').remove([`banners/${path}`]);
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

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);

    try {
      let avatarUrl = userProfile.avatar;
      let bannerUrl = userProfile.banner ?? null;

      // 아바타 및 배너 업로드
      if (avatarFile) avatarUrl = await uploadImage(avatarFile, 'avatars');
      // 1) 사용자가 삭제 버튼 눌렀다면 → previewBanner가 null
      if (previewBanner === null) {
        await deleteOldBanner();
        bannerUrl = null; // DB에서 제거할 값
      }
      // 2) 새 배너 파일 업로드한 경우
      else if (bannerFile) {
        bannerUrl = await uploadImage(bannerFile, 'banners');
      }

      // formData.country = countries.id (문자열)
      const selectedCountry = countries.find(c => String(c.id) === formData.country) || null;

      // Supabase 프로필 업데이트
      const { error } = await supabase
        .from('profiles')
        .update({
          nickname: formData.name,
          bio: formData.bio,
          // DB에는 id 저장 (profiles.country = countries.id)
          country: formData.country || null,
          avatar_url: avatarUrl,
          banner_url: bannerUrl,
          banner_position_y: Math.round(bannerPosYRef.current),
        })
        .eq('id', userProfile.id);

      if (error) throw error;

      // 로컬 상태 업데이트
      const updated = {
        ...userProfile,
        name: formData.name,
        bio: formData.bio,
        country: selectedCountry?.name ?? userProfile.country ?? null, // 화면용 "국가 이름"
        countryFlagUrl: selectedCountry?.flag_url ?? userProfile.countryFlagUrl ?? null,
        avatar: avatarUrl,
        banner: bannerUrl,
        bannerPositionY: bannerPosY,
      };
      onSave(updated);

      // 닉네임 변경 후 URL도 새 닉네임으로 이동
      navigate(`/profile/${encodeURIComponent(formData.name)}`);

      toast.success('프로필이 성공적으로 업데이트되었습니다.');

      setTimeout(() => {
        onClose();
      }, 300);
    } catch (err: any) {
      console.error('프로필 업데이트 실패:', err?.message || err);
      toast.error('프로필 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  // 현재 선택된 국가의 플래그 (미리보기용)
  const currentCountry = countries.find(c => String(c.id) === formData.country) || null;
  const currentFlagUrl = currentCountry?.flag_url ?? userProfile.countryFlagUrl ?? null;
  const currentFlagEmoji = currentCountry?.flag ?? null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">프로필 편집</h2>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-primary text-white hover:bg-primary/80 dark:bg-gray-900 rounded-full font-medium hover:bg-gray-800 transition disabled:opacity-60"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Cover */}
          <div className="relative">
            <div className="h-32 sm:h-40 bg-gray-200 rounded-t-xl overflow-hidden relative">
              {previewBanner && (
                <>
                  <img
                    src={previewBanner}
                    alt="Banner"
                    draggable={false}
                    onDragStart={e => e.preventDefault()}
                    onMouseDown={e => {
                      setIsDragging(true);
                      startYRef.current = e.clientY;
                      startPosRef.current = bannerPosY;
                    }}
                    onMouseMove={e => {
                      if (!isDragging) return;
                      const diff = e.clientY - startYRef.current;
                      const next = startPosRef.current + diff / 2;
                      setBannerPosY(Math.max(0, Math.min(100, next)));
                    }}
                    onMouseUp={() => setIsDragging(false)}
                    className="w-full h-full object-cover cursor-grab"
                    style={{ objectPosition: `center ${bannerPosY}%` }}
                  />

                  {/* 삭제 버튼 */}
                  {!isDragging && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setPreviewBanner(null);
                        setBannerFile(null);
                      }}
                      className="absolute top-2 right-2 bg-black/60 text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/80 transition z-50"
                    >
                      <i className="ri-delete-bin-line text-lg" />
                    </button>
                  )}
                </>
              )}
              {previewBanner && !isDragging && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-white bg-black/50 px-2 py-1 rounded pointer-events-none">
                  드래그해서 위치 조절
                </div>
              )}

              {!isDragging && (
                <div
                  className="absolute inset-0 bg-black/30 flex items-center justify-center
                opacity-0 hover:opacity-100 transition
                pointer-events-none"
                >
                  <label className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center cursor-pointer hover:bg-black/70 pointer-events-auto">
                    <i className="ri-camera-line text-white text-lg"></i>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => handleFileChange(e, 'banner')}
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Avatar */}
            <div className="absolute -bottom-8 left-2">
              <div className="w-20 h-20 rounded-full border-4 border-white bg-white overflow-hidden relative dark:border-gray-900 dark:bg-gray-900">
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
          <div className="mt-12 space-y-4">
            {/* 닉네임 */}
            <div className="mt-10">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                닉네임
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                maxLength={50}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:text-gray-300 rounded-lg bg-white dark:bg-background focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <p className="text-right text-xs text-gray-500">{formData.name.length}/50</p>
            </div>

            {/* 소개글 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                소개글
              </label>
              <textarea
                value={formData.bio}
                onChange={e => handleInputChange('bio', e.target.value)}
                maxLength={160}
                rows={3}
                placeholder="자기소개를 작성해보세요."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:text-gray-300 rounded-lg bg-white dark:bg-background focus:ring-2 focus:ring-primary focus:outline-none resize-none"
              />
              <p className="text-right text-xs text-gray-500 ">{charCount}/160</p>
            </div>

            {/* 국가 선택 (CountrySelect 사용) */}
            <div>
              <CountrySelect
                value={formData.country} // countries.id (문자열)
                onChange={value => handleInputChange('country', value)}
                error={false}
              />
              {/* 필요하면 로딩 표시 추가 가능 */}
              {countriesLoading && (
                <p className="text-xs text-gray-400 mt-1">국가 목록 불러오는 중...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
