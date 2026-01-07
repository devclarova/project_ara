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
import FollowersModal from './FollowersModal';
import { useFollow } from '@/hooks/useFollow';
import { BanBadge } from '@/components/common/BanBadge';
import { getBanMessage } from '@/utils/banUtils';
import { OnlineIndicator } from '@/components/common/OnlineIndicator';

interface ProfileHeaderProps {
  userProfile: UserProfile;
  isOwnProfile: boolean;
  onProfileUpdated?: (updated: UserProfile) => void;
  onEditClick?: () => void;
  hideFollowButton?: boolean;
  showPersonalDetails?: boolean;
}

export default function ProfileHeader({
  userProfile,
  isOwnProfile,
  onProfileUpdated,
  onEditClick,
  hideFollowButton = false,
  showPersonalDetails = false,
}: ProfileHeaderProps) {
  const { t } = useTranslation();
  const { user, isBanned, bannedUntil } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState(userProfile.avatar);
  const [previewBanner, setPreviewBanner] = useState(userProfile.banner ?? null);
  const [bannerPosY, setBannerPosY] = useState(userProfile.bannerPositionY ?? 50);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const startPosRef = useRef(bannerPosY);
  const bannerPosYRef = useRef(bannerPosY);
  const [translated, setTranslated] = useState<string>('');
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followersModalTab, setFollowersModalTab] = useState<'followers' | 'following'>('followers');
  const [showFollowMenu, setShowFollowMenu] = useState(false);
  const [followNotificationsEnabled, setFollowNotificationsEnabled] = useState(true);
  const followMenuRef = useRef<HTMLDivElement>(null);
  
  // Real follow hook integration
  // IMPORTANT: Use profile.id (not user_id) for foreign key relations
  const { 
    isFollowing, 
    isLoading: followLoading, 
    followersCount, 
    followingCount, 
    toggleFollow, 
    refreshCounts 
  } = useFollow(userProfile.id);  // ✅ Use profile.id for DB relations

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

  const handleFollowToggle = async () => {
    if (isBanned && bannedUntil) {
       // '팔로우' directly or use t('profile.action_follow') if created, but user seemed ok with hardcoded for now or I stick to Korean as primary.
       // The banUtils uses Korean hardcoded, so '팔로우' is consistent.
      toast.error(getBanMessage(bannedUntil, '팔로우'));
      return;
    }
    await toggleFollow();
  };
  
  const handleFollowersClick = () => {
    setFollowersModalTab('followers');
    setShowFollowersModal(true);
  };
  
  const handleFollowingClick = () => {
    setFollowersModalTab('following');
    setShowFollowersModal(true);
  };
  
  // 팔로우 메뉴 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (followMenuRef.current && !followMenuRef.current.contains(event.target as Node)) {
        setShowFollowMenu(false);
      }
    };

    if (showFollowMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFollowMenu]);
  
  const handleUnfollow = async () => {
    setShowFollowMenu(false);
    await toggleFollow();
  };
  
  const handleToggleNotifications = () => {
    setFollowNotificationsEnabled(!followNotificationsEnabled);
    toast.info(t('profile.notifications_updated', '알림 설정이 변경되었습니다'));
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
              <span className="text-sm text-muted-foreground">{followersCount.toLocaleString()}</span>
          </div>
        )}
        {/* 내 프로필일 때만 “프로필 편집” 버튼 */}
        {isOwnProfile ? (
          <div className="flex justify-end mb-4 -mt-8 relative z-">
            <Button
              variant="outline"
              onClick={onEditClick}
              className="rounded-full px-6 font-medium bg-primary/10 text-[#009e89] border-[#009e89] hover:bg-primary/50 hover:text-white dark:hover:bg-primary/30 transition-colors"
            >
              {t('profile.edit_profile')}
            </Button>
          </div>
        ) : !hideFollowButton ? (
          <div className="flex justify-end mb-4 -mt-8 relative z-10" ref={followMenuRef}>
            {isFollowing ? (
              <div className="relative">
                <Button
                  onClick={() => setShowFollowMenu(!showFollowMenu)}
                  className="rounded-full px-6 font-medium transition-all group min-w-[120px] border-2 border-gray-300 dark:border-gray-600 bg-transparent text-gray-700 dark:text-gray-300 hover:border-primary hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10"
                >
                  <span className="flex items-center gap-1.5">
                    <i className="ri-user-follow-line" />
                    {t('profile.following')}
                    <i className={`ri-arrow-down-s-line transition-transform ${showFollowMenu ? 'rotate-180' : ''}`} />
                  </span>
                </Button>
                
                {showFollowMenu && (
                  <div className="absolute top-full right-0 mt-2 min-w-[120px] rounded-xl border border-gray-100/80 bg-white/95 shadow-lg shadow-black/5 backdrop-blur-sm z-[200] dark:bg-secondary/95 dark:border-gray-700/70 overflow-hidden">
                    <div className="py-1">
                      <button
                        onClick={handleUnfollow}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-100 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      >
                        <i className="ri-user-unfollow-line text-base" />
                        <span>{t('profile.unfollow')}</span>
                      </button>
                      <button
                        onClick={handleToggleNotifications}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-100 hover:bg-primary/5 dark:hover:bg-primary/20 transition-colors"
                      >
                        <i className={`text-base ${followNotificationsEnabled ? 'ri-notification-off-line' : 'ri-notification-line'}`} />
                        <span>
                          {followNotificationsEnabled 
                            ? t('profile.turn_off_notifications') 
                            : t('profile.turn_on_notifications')}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Button
                onClick={handleFollowToggle}
                className="rounded-full px-6 font-medium transition-all group min-w-[120px] bg-gradient-to-r from-[#00dbaa] to-[#009e89] text-white border-transparent hover:opacity-90"
              >
                <span className="flex items-center gap-1.5">
                  <i className="ri-user-add-line" />
                  {t('profile.follow')}
                </span>
              </Button>
            )}
          </div>
        ) : null}
        {/* 사용자 정보 */}
        <div className="space-y-3">
          {/* 이름 */}
          {/* 이름 */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center flex-wrap gap-2">
            <div className="relative inline-flex items-center pr-2.5">
              <span>{userProfile.name}</span>
              <OnlineIndicator 
                userId={userProfile.user_id} 
                size="md" 
                className="absolute top-0.5 right-0 z-10 border-white dark:border-gray-900 border-2"
              />
            </div>
            <BanBadge bannedUntil={userProfile.banned_until} size="md" />
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

          {/* 팔로워/팔로잉 카운트 */}
          <div className="flex items-center gap-4 text-sm mt-2">
            <button
              onClick={handleFollowersClick}
              className="flex items-center gap-1.5 hover:underline transition-all group"
            >
              <span className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary">
                {followersCount}
              </span>
              <span className="text-gray-600 dark:text-gray-400 group-hover:text-primary">
                {t('profile.followers')}
              </span>
            </button>
            <button
              onClick={handleFollowingClick}
              className="flex items-center gap-1.5 hover:underline transition-all group"
            >
              <span className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary">
                {followingCount}
              </span>
              <span className="text-gray-600 dark:text-gray-400 group-hover:text-primary">
                {t('profile.following')}
              </span>
            </button>
          </div>

          {/* 국적 + 성별 + 나이 + 가입일 */}
          <div className="flex flex-wrap gap-4 text-gray-500 dark:text-gray-400 text-sm mt-2 items-center">
            {/* Country */}
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
            
            {/* Gender & Age (Specific for Report Details e.g.) */}
            {showPersonalDetails && (
                <>
                {userProfile.gender && (
                    <span className="flex items-center gap-1">
                        <i className={`ri-${userProfile.gender === 'Male' ? 'men' : 'women'}-line`} />
                        <span>{userProfile.gender === 'Male' ? t('signup.gender_male', '남성') : t('signup.gender_female', '여성')}</span>
                    </span>
                )}
                {userProfile.age && (
                    <span className="flex items-center gap-1">
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium">
                            {userProfile.age}세
                        </span>
                    </span>
                 )}
                 </>
            )}
            <span className="flex items-center gap-1">
              <i className="ri-calendar-line" />
              {t('profile.joined', { date: userProfile.joinDate })}
            </span>
          </div>
        </div>
      </div>
      
      {/* 팔로워/팔로잉 모달 */}
      <FollowersModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        initialTab={followersModalTab}
        followers={[]} // Mock data - will be populated with real data later
        following={[]} // Mock data - will be populated with real data later
      />
    </div>
  );
}
