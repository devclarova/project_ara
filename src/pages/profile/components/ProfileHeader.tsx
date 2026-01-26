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
import FollowersModal, { type FollowUser } from './FollowersModal';
import { useFollow } from '@/hooks/useFollow';
import { BanBadge } from '@/components/common/BanBadge';
import { getBanMessage } from '@/utils/banUtils';
import { OnlineIndicator } from '@/components/common/OnlineIndicator';
import { useNavigate } from 'react-router-dom';
import { useBlock } from '@/hooks/useBlock';
import Modal from '@/components/common/Modal';
import { useDirectChat } from '@/contexts/DirectChatContext';

interface ProfileHeaderProps {
  userProfile: UserProfile;
  isOwnProfile: boolean;
  onProfileUpdated?: (updated: UserProfile) => void;
  onEditClick?: () => void;
  hideFollowButton?: boolean;
  showPersonalDetails?: boolean;
  onMessageClick?: () => void;
  hideMessageButton?: boolean;
}

export default function ProfileHeader({
  userProfile,
  isOwnProfile,
  onProfileUpdated,
  onEditClick,
  hideFollowButton = false,
  showPersonalDetails = false,
  onMessageClick,
  hideMessageButton = false,
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
  const [followersModalTab, setFollowersModalTab] = useState<'followers' | 'following'>(
    'followers',
  );
  const [showFollowMenu, setShowFollowMenu] = useState(false);
  const [showUnblockConfirm, setShowUnblockConfirm] = useState(false);
  const [followNotificationsEnabled, setFollowNotificationsEnabled] = useState(true);
  const followMenuRef = useRef<HTMLDivElement>(null);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { createDirectChat } = useDirectChat();

  // Real follow hook integration
  // IMPORTANT: Use profile.id (not user_id) for foreign key relations
  const {
    isFollowing,
    isLoading: followLoading,
    followersCount,
    followingCount,
    toggleFollow,
    refreshCounts,
    refreshStatus,
  } = useFollow(userProfile.id); // Use profile.id for DB relations

  const {
    isBlocked, // 내가 상대를 차단했는지
    toggleBlock,
    isLoading: blockLoading,
  } = useBlock(userProfile?.id);

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

  useEffect(() => {
    (async () => {
      const id = await getMyProfileId();
      setMyProfileId(id);
    })();
  }, [user?.id]);

  useEffect(() => {
    if (isBlocked) setShowFollowMenu(false);
  }, [isBlocked]);

  useEffect(() => {
    const handler = () => {
      refreshStatus();
      refreshCounts();
      // 지연 한 번 더 (supabase 반영 딜레이 대비)
      setTimeout(() => {
        refreshStatus();
        refreshCounts();
      }, 200);
    };

    window.addEventListener('REFRESH_BLOCKED_USERS', handler);
    return () => window.removeEventListener('REFRESH_BLOCKED_USERS', handler);
  }, [refreshStatus, refreshCounts]);

  const ensureMyProfileId = async () => {
    if (myProfileId) return myProfileId;

    const id = await getMyProfileId();
    setMyProfileId(id);
    return id;
  };

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
        window.dispatchEvent(
          new CustomEvent('profile:updated', {
            detail: {
              nickname: userProfile.name, // keep existing nickname
              avatar_url: imageUrl,
            },
          }),
        );
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

  const getMyProfileId = async () => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (error) return null;
    return data.id;
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

  const fetchFollowers = async () => {
    const { data, error } = await supabase
      .from('user_follows')
      .select(
        `
    follower:profiles!user_follows_follower_id_fkey (
      id, nickname, username, avatar_url, bio
    )
  `,
      )
      .eq('following_id', userProfile.id)
      .is('ended_at', null) // 활성 팔로우만
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      toast.error('팔로워를 불러오지 못했습니다');
      return;
    }

    // 내가 팔로우 중인 id 목록
    const myId = await ensureMyProfileId();
    if (!myId) return;

    const { data: myFollowing } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', myId)
      .is('ended_at', null);

    const followingSet = new Set(myFollowing?.map(r => r.following_id));

    setFollowers(
      data.map((row: any) => ({
        id: row.follower.id,
        name: row.follower.nickname,
        username: row.follower.username,
        avatar: row.follower.avatar_url,
        bio: row.follower.bio,
        isFollowing: followingSet.has(row.follower.id),
      })),
    );
  };

  const fetchFollowing = async () => {
    const followerProfileId = isOwnProfile ? await ensureMyProfileId() : userProfile.id;
    if (!followerProfileId) return;

    const { data, error } = await supabase
      .from('user_follows')
      .select(
        `
      created_at,
      following:profiles!user_follows_following_id_fkey (
        id, nickname, username, avatar_url, bio
      )
    `,
      )
      .eq('follower_id', followerProfileId)
      .is('ended_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      toast.error('팔로잉을 불러오지 못했습니다');
      return;
    }

    const myId = await ensureMyProfileId();
    if (!myId) return;

    const { data: myFollowing, error: mfErr } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', myId)
      .is('ended_at', null); // 누락 수정

    if (mfErr) console.error(mfErr);

    const followingSet = new Set(myFollowing?.map(r => r.following_id));

    setFollowing(
      (data ?? []).map((row: any) => ({
        id: row.following.id,
        name: row.following.nickname,
        username: row.following.username,
        avatar: row.following.avatar_url,
        bio: row.following.bio,
        isFollowing: followingSet.has(row.following.id),
      })),
    );
  };

  const handleFollowersClick = async () => {
    setFollowersModalTab('followers');
    await fetchFollowers();
    setShowFollowersModal(true);
  };

  const handleFollowingClick = async () => {
    setFollowersModalTab('following');
    await fetchFollowing();
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

  const handleMessageClick = async () => {
    // 차단 상태면 DM 못 열게(원하면)
    if (isBlocked) {
      toast.error(
        t('common.blocked_cannot_message', '차단한 사용자에게는 메시지를 보낼 수 없어요.'),
      );
      return;
    }

    // 본인/로그인 체크
    if (!user) return;

    try {
      // ⭐️ 중요: createDirectChat이 받는 id가 “profile.id”인지 “user_id”인지 통일해야 함
      // DirectChatList에서 createDirectChat(user.id)를 쓰고 있는데,
      // 거기 user.id가 "profile id"라면 여기서도 userProfile.id(=profile id)를 넘겨야 함.
      const chatId = await createDirectChat(userProfile.id);

      if (!chatId) {
        toast.error(t('message.create_room_failed', '메시지 방 생성 실패'));
        return;
      }

      navigate('/chat', { state: { roomId: chatId } });
    } catch (e) {
      console.error(e);
      toast.error(t('message.create_room_failed', '메시지 방 생성 실패'));
    }
  };

  const handleToggleBlock = async () => {
    setShowFollowMenu(false); // 메뉴 닫기
    await toggleBlock(); // 차단/해제 실행
    await refreshCounts(); // 카운트 최신화
  };

  const handleConfirmUnblock = async () => {
    setShowUnblockConfirm(false);
    await handleToggleBlock(); // 기존 로직 재사용 (toggleBlock + refreshCounts)
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
          <div className="flex justify-end mb-4 -mt-8 relative z-10">
            <Button
              variant="outline"
              onClick={onEditClick}
              className="rounded-full px-6 font-medium bg-primary/10 text-[#009e89] border-[#009e89] hover:bg-primary/50 hover:text-white dark:hover:bg-primary/30 transition-colors"
            >
              {t('profile.edit_profile')}
            </Button>
          </div>
        ) : (
          <div className="flex justify-end mb-4 -mt-8 relative z-10" ref={followMenuRef}>
            <div className="flex items-center gap-2">
              {/* 메시지 버튼 (유저프로필에서만) */}
              {!hideMessageButton && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleMessageClick}
                  className="rounded-full px-5 font-medium border-2 border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-secondary/60 text-gray-800 dark:text-gray-100 hover:bg-primary/5 dark:hover:bg-primary/10"
                >
                  <span className="flex items-center gap-2">
                    <i className="ri-chat-3-line" />
                    {t('message.message', '메시지')}
                  </span>
                </Button>
              )}

              {/* 팔로우 버튼 */}
              {!hideFollowButton ? (
                // 1) 차단 상태면 팔로우/팔로잉 대신 "차단됨" 표시
                isBlocked ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={blockLoading}
                    onClick={e => {
                      e.stopPropagation();
                      setShowUnblockConfirm(true);
                    }}
                    className="rounded-full px-6 font-medium min-w-[120px] border-2 border-gray-300 dark:border-gray-600 bg-transparent text-gray-600 dark:text-gray-300"
                  >
                    <span className="flex items-center gap-1.5">
                      <i className="ri-forbid-line" />
                      {t('common.blocked', '차단됨')}
                    </span>
                  </Button>
                ) : // 2) 차단이 아니면 기존 팔로우/팔로잉 UI 그대로
                isFollowing ? (
                  <div className="relative">
                    <Button
                      onClick={() => setShowFollowMenu(!showFollowMenu)}
                      className="rounded-full px-6 font-medium transition-all group min-w-[120px] border-2 border-gray-300 dark:border-gray-600 bg-transparent text-gray-700 dark:text-gray-300 hover:border-primary hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10"
                    >
                      <span className="flex items-center gap-1.5">
                        <i className="ri-user-follow-line" />
                        {t('profile.following')}
                        <i
                          className={`ri-arrow-down-s-line transition-transform ${
                            showFollowMenu ? 'rotate-180' : ''
                          }`}
                        />
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
                            <i
                              className={`text-base ${
                                followNotificationsEnabled
                                  ? 'ri-notification-off-line'
                                  : 'ri-notification-line'
                              }`}
                            />
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
                )
              ) : null}
            </div>
          </div>
        )}

        {/* 사용자 정보 */}
        <div className="space-y-3">
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
                    <span>
                      {userProfile.gender === 'Male'
                        ? t('signup.gender_male', '남성')
                        : t('signup.gender_female', '여성')}
                    </span>
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
        followers={followers}
        following={following}
        onTabChange={async tab => {
          if (tab === 'followers') await fetchFollowers();
          else await fetchFollowing();
        }}
        onUnfollow={async targetProfileId => {
          const myId = await ensureMyProfileId();
          if (!myId) return;

          const { error } = await supabase
            .from('user_follows')
            .update({ ended_at: new Date().toISOString() })
            .eq('follower_id', myId)
            .eq('following_id', targetProfileId)
            .is('ended_at', null);

          if (error) {
            console.error(error);
            toast.error('언팔로우 실패');
            return;
          }

          await fetchFollowing();
          await fetchFollowers();
          await refreshCounts();
        }}
        onFollow={async targetProfileId => {
          // 1) 예전에 언팔했던 row가 있으면 복구
          const myId = await ensureMyProfileId();
          if (!myId) return;

          const revive = await supabase
            .from('user_follows')
            .update({ ended_at: null })
            .eq('follower_id', myId)
            .eq('following_id', targetProfileId)
            .not('ended_at', 'is', null)
            .select();

          if (revive.error) {
            console.error(revive.error);
            toast.error('팔로우 실패');
            return;
          }

          // 2) 복구된 게 없으면 신규 insert
          if (!revive.data || revive.data.length === 0) {
            const { error } = await supabase.from('user_follows').insert({
              follower_id: myId,
              following_id: targetProfileId,
              ended_at: null,
            });

            if (error) {
              console.error(error);
              toast.error('팔로우 실패');
              return;
            }
          }

          await fetchFollowing();
          await fetchFollowers();
          await refreshCounts();
        }}
        myProfileId={myProfileId}
      />
      {/* 차단해제 */}
      <Modal
        isOpen={showUnblockConfirm}
        onClose={() => setShowUnblockConfirm(false)}
        title={t('common.unblock_modal_title', '차단을 해제하시겠습니까?')}
        className="max-w-md h-auto"
      >
        <div className="flex flex-col gap-6 py-4 px-6 text-left">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
              <i className="ri-eye-line text-emerald-500 text-2xl" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {t('common.unblock_notice_title', '프로필과 게시글이 다시 표시돼요')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('common.unblock_notice_desc', '상대가 다시 내 프로필을 볼 수 있어요.')}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowUnblockConfirm(false)}
              className="flex-1 py-2.5 rounded-xl text-sm bg-gray-100 dark:bg-white/10"
            >
              {t('common.cancel', '취소')}
            </button>
            <button
              onClick={handleConfirmUnblock}
              disabled={blockLoading}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              {blockLoading ? t('common.loading', '처리 중…') : t('common.unblock', '차단 해제')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
