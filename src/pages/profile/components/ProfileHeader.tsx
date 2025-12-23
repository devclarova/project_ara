import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { uploadProfileImage } from '@/utils/profileImage';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { UserProfile } from '../ProfileAsap';
import { useTranslation } from 'react-i18next';
import TranslateButton from '@/components/common/TranslateButton';
interface ProfileHeaderProps {
  userProfile: UserProfile;
  onProfileUpdated?: (updated: UserProfile) => void;
  onEditClick?: () => void;
}
export default function ProfileHeader({
  userProfile,
  onProfileUpdated,
  onEditClick,
}: ProfileHeaderProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isOwnProfile = user && user.id === userProfile.user_id;
  const [uploading, setUploading] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState(userProfile.avatar);
  const [previewBanner, setPreviewBanner] = useState(userProfile.banner ?? null);
  const [bannerPosY, setBannerPosY] = useState(userProfile.bannerPositionY ?? 50);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const startPosRef = useRef(bannerPosY);
  const bannerPosYRef = useRef(bannerPosY);
  const [translated, setTranslated] = useState<string>('');
  // 프로필 바뀌면 동기화
  useEffect(() => {
    setBannerPosY(userProfile.bannerPositionY ?? 50);
  }, [userProfile.bannerPositionY]);
  // 배너 위치 이동
  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientY - startYRef.current;
      const next = startPosRef.current + diff / 2;
      setBannerPosY(Math.max(0, Math.min(100, next)));
    };
    const stopDragging = async () => {
      setIsDragging(false);
      await saveBannerPosition(bannerPosYRef.current);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopDragging);
    window.addEventListener('mouseleave', stopDragging);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopDragging);
      window.removeEventListener('mouseleave', stopDragging);
    };
  }, [isDragging]);
  // 최신 위치 보존
  useEffect(() => {
    bannerPosYRef.current = bannerPosY;
  }, [bannerPosY]);
  useEffect(() => {
    setPreviewAvatar(userProfile.avatar);
    setPreviewBanner(userProfile.banner ?? null);
  }, [userProfile.avatar, userProfile.banner]);
  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'avatar' | 'banner',
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    type === 'avatar' ? setPreviewAvatar(previewUrl) : setPreviewBanner(previewUrl);
    try {
      setUploading(true);
      const imageUrl = await uploadProfileImage(
        userProfile.user_id,
        file,
        type === 'avatar' ? 'avatars' : 'banners',
      );
      const { error } = await supabase
        .from('profiles')
        .update(type === 'avatar' ? { avatar_url: imageUrl } : { banner_url: imageUrl })
        .eq('user_id', userProfile.user_id);
      if (error) throw error;
      onProfileUpdated?.({
        ...userProfile,
        banner: type === 'banner' ? imageUrl : userProfile.banner,
      });

      // Dispatch event for Header update if it's avatar
      if (type === 'avatar') {
        window.dispatchEvent(new CustomEvent('profile:updated', {
          detail: {
             nickname: userProfile.name, // keep existing nickname
             avatar_url: imageUrl
          }
        }));
      }
      toast.success(t('common.image_updated', '이미지가 업데이트되었습니다.'));
    } catch (err) {
      console.error(err);
      toast.error(t('common.upload_failed', '이미지 업로드 실패'));
    } finally {
      setUploading(false);
    }
  };
  const saveBannerPosition = async (pos: number) => {
    const { error } = await supabase
      .from('profiles')
      .update({
        banner_position_y: Math.round(pos),
      })
      .eq('user_id', userProfile.user_id);
    if (error) {
      toast.error(t('common.save_failed', '저장 실패'));
    } else {
      onProfileUpdated?.({
        ...userProfile,
        bannerPositionY: Math.round(pos),
      });
    }
  };
  return (
    <div className="relative bg-white dark:bg-background">
      {/* 배너 */}
      <div className="relative group">
        {userProfile.banner ? (
          <div className="h-48 sm:h-64 relative overflow-hidden">
            <img
              src={previewBanner ?? userProfile.banner ?? ''}
              alt="Profile banner"
              draggable={false}
              onDragStart={e => e.preventDefault()}
              onMouseDown={e => {
                if (!isOwnProfile) return;
                setIsDragging(true);
                startYRef.current = e.clientY;
                startPosRef.current = bannerPosY;
              }}
              className={`w-full h-full object-cover object-center ${
                isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
              }`}
              style={{ objectPosition: `center ${bannerPosY}%` }}
              decoding="async"
            />
          </div>
        ) : (
          <div className="h-48 sm:h-64 bg-gradient-to-r from-[#00dbaa] via-[#00bfa5] to-[#009e89]" />
        )}
        {isOwnProfile && !isDragging && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-white bg-black/50 px-2 py-1 rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {t('profile.drag_to_reposition', '드래그해서 위치 조절')}
          </div>
        )}
        {isOwnProfile && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition pointer-events-none">
            <label className="w-10 h-10 bg-black/60 rounded-full flex items-center justify-center cursor-pointer pointer-events-auto">
              <i className="ri-camera-line text-white text-lg" />
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
      <div className="px-4 pb-4">
        {/* 아바타 */}
        <div className="relative -mt-16 mb-1 group w-32 h-32">
          <div className="w-32 h-32 rounded-full border-4 border-white bg-white overflow-hidden shadow-md dark:border-gray-900 dark:bg-gray-900">
            <Avatar className="w-full h-full">
              <AvatarImage
                src={previewAvatar || userProfile.avatar || '/default-avatar.svg'}
                alt={userProfile.name}
              />
              <AvatarFallback>{userProfile.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
          {isOwnProfile && (
            <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition pointer-events-none">
              <label className="w-9 h-9 bg-black/60 rounded-full flex items-center justify-center cursor-pointer pointer-events-auto">
                <i className="ri-camera-line text-white" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => handleFileChange(e, 'avatar')}
                />
              </label>
            </div>
          )}
        </div>
        {uploading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
            <span className="text-white text-sm">Update...</span>
          </div>
        )}
        {/* 내 프로필일 때만 “프로필 편집” 버튼 */}
        {isOwnProfile && (
          <div className="flex justify-end mb-4 -mt-8 relative z-">
            <Button
              variant="outline"
              onClick={onEditClick}
              className="rounded-full px-6 font-medium bg-primary/10 text-[#009e89] border-[#009e89] hover:bg-primary/50 hover:text-white dark:hover:bg-primary/30 transition-colors"
            >
              {t('profile.edit_profile')}
            </Button>
          </div>
        )}
        {/* 사용자 정보 */}
        <div className="space-y-3">
          {/* 이름 */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {userProfile.name}
          </h1>
          {/* 자기소개 */}
          {userProfile.bio ? (
            <div className="space-y-2">
              <div>
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line leading-snug">
                  {userProfile.bio}
                  {!isOwnProfile && (
                    <span className="inline-block ml-2 align-middle">
                      <TranslateButton
                        text={userProfile.bio}
                        contentId={`profile-bio-${userProfile.user_id}`}
                        setTranslated={setTranslated}
                        size="sm"
                      />
                    </span>
                  )}
                </p>
              </div>

              {/* 번역 결과 */}
              {translated && (
                <div className="p-2 bg-gray-100 dark:bg-gray-800 dark:text-gray-400 rounded-lg text-sm whitespace-pre-line break-words">
                  {translated}
                </div>
              )}
            </div>
          ) : (
            <p className="opacity-0 select-none">.</p>
          )}

          {/* 원래 location 들어가던 자리 → 국적 + 국기 */}
          <div className="flex flex-wrap gap-3 text-gray-500 dark:text-gray-400 text-sm mt-2">
            {(userProfile.country || userProfile.countryFlagUrl) && (
              <span className="flex items-center gap-2">
                {userProfile.countryFlagUrl && (
                  <img
                    src={userProfile.countryFlagUrl}
                    alt={userProfile.country ?? '국가'}
                    className="w-5 h-5 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                    loading="lazy"
                    decoding="async"
                  />
                )}
                <span>{userProfile.country}</span>
              </span>
            )}
            <span className="flex items-center gap-1">
              <i className="ri-calendar-line" />
              {t('profile.joined', { date: userProfile.joinDate })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
