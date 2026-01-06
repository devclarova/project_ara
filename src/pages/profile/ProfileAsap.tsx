import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import ProfileHeader from './components/ProfileHeader';
import ProfileTabs, { type ProfileTabKey } from './components/ProfileTabs';
import ProfileTweets from './components/ProfileTweets';
import EditProfileModal from './components/EditProfileModal';
import ReportModal from '@/components/common/ReportModal';
import BlockButton from '@/components/common/BlockButton';
import ScrollToTopButton from '@/components/common/ScrollToTopButton';
import { formatBanPeriod, isBanned } from '@/utils/banUtils';
import { addYears } from 'date-fns';
export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  joinDate: string;
  followers: number;
  following: number;
  banner?: string | null;
  bannerPositionY?: number;
  website?: string | null;
  country?: string | null;
  countryFlagUrl?: string | null;
  nickname_updated_at?: string | null;
  country_updated_at?: string | null;
  gender?: string | null;
  age?: number | null;
  banned_until?: string | null;
}
export default function ProfileAsap() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<ProfileTabKey>('posts');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [banStartDate, setBanStartDate] = useState<string | null>(null);
  const [banCount, setBanCount] = useState<number>(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  // URL에서 username 추출 + 디코딩
  const { username } = useParams<{ username: string }>();
  const decodedUsername = username ? decodeURIComponent(username) : '';
  const isOwnProfile = user && userProfile ? user.id === userProfile.user_id : false;

  // Real-time listener for profile updates (bans)
  useEffect(() => {
    if (!userProfile?.user_id) return;
    
    // Initial fetch of ban details if banned
    if (userProfile.banned_until) {
      fetchBanDetails(userProfile.id);
    }

    const channel = supabase
      .channel(`profile-ban-${userProfile.user_id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userProfile.id}`,
        },
        async (payload) => {
          const newProfile = payload.new as any;
          if (newProfile) {
            // country가 변경되었는지 확인
            let countryName = userProfile.country;
            let countryFlagUrl = userProfile.countryFlagUrl;
            
            if (newProfile.country && String(newProfile.country) !== String(userProfile.country)) {
               // Re-fetch country info if it changed (rare but possible)
               const { data: countryRow } = await supabase
                .from('countries')
                .select('name, flag_url')
                .eq('id', newProfile.country)
                .maybeSingle();
              if (countryRow) {
                countryName = countryRow.name ?? null;
                countryFlagUrl = countryRow.flag_url ?? null;
              }
            }

            setUserProfile(prev => {
              if (!prev) return null;
              return {
                ...prev,
                name: newProfile.nickname ?? prev.name,
                avatar: newProfile.avatar_url ?? prev.avatar,
                banner: newProfile.banner_url ?? prev.banner,
                bannerPositionY: newProfile.banner_position_y ?? prev.bannerPositionY,
                bio: newProfile.bio ?? prev.bio,
                country: countryName,
                countryFlagUrl: countryFlagUrl,
                followers: newProfile.followers_count ?? prev.followers,
                following: newProfile.following_count ?? prev.following,
                banned_until: newProfile.banned_until ?? prev.banned_until,
                nickname_updated_at: newProfile.nickname_updated_at ?? prev.nickname_updated_at,
                country_updated_at: newProfile.country_updated_at ?? prev.country_updated_at,
              };
            });

            // If ban status changed to banned, fetch details
            if (newProfile.banned_until) {
               fetchBanDetails(userProfile.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile?.id, userProfile?.user_id]);

  const fetchBanDetails = async (profileId: string) => {
      // Get start date of current ban
      const { data: sanctionData } = await supabase
        .from('sanction_history')
        .select('created_at')
        .eq('target_user_id', profileId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (sanctionData) {
        setBanStartDate(sanctionData.created_at);
      }
      
      // Get Count
      const { count } = await supabase
        .from('sanction_history')
        .select('*', { count: 'exact', head: true })
        .eq('target_user_id', profileId)
        .in('sanction_type', ['ban', 'permanent_ban']);
        
      setBanCount(count || 0);
  };

  useEffect(() => {
    if (!decodedUsername && !user) return;
    const fetchProfile = async () => {
      try {
        // 1) 프로필만 먼저 가져오기
        let baseQuery = supabase.from('profiles').select(
          `
        id,
        user_id,
        nickname,
        avatar_url,
        banner_url,
        banner_position_y,
        bio,
        country,
        followers_count,
        following_count,
        created_at,
        nickname_updated_at,
        country_updated_at,
        banned_until
      `,
        );
        if (!decodedUsername && user) {
          baseQuery = baseQuery.eq('user_id', user.id);
        } else {
          // UUID 형식 체크
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedUsername);
          
          if (isUuid) {
            baseQuery = baseQuery.eq('id', decodedUsername);
          } else {
            baseQuery = baseQuery.eq('nickname', decodedUsername);
          }
        }
        const { data: profile, error: profileError } = await baseQuery.single();
        if (profileError || !profile) throw profileError;
        // 2) country 값이 "countries.id" 라고 가정하고 조회
        let countryName: string | null = null;
        let countryFlagUrl: string | null = null;
        if (profile.country) {
          // profile.country가 숫자든 문자열이든 eq에서 캐스팅해줌
          const { data: countryRow, error: countryError } = await supabase
            .from('countries')
            .select('id, name, flag_url')
            .eq('id', profile.country) // 여기: iso_code가 아니라 id로 조회
            .maybeSingle();
          if (!countryError && countryRow) {
            countryName = countryRow.name ?? null;
            countryFlagUrl = countryRow.flag_url ?? null;
          }
        }
        // 3) 최종 상태 세팅
        setUserProfile({
          id: profile.id,
          user_id: profile.user_id,
          name: profile.nickname ?? 'Unknown',
          username: profile.user_id,
          avatar: profile.avatar_url ?? '/default-avatar.svg',
          bio: profile.bio ?? t('profile.no_bio_placeholder', 'No bio yet.'),
          country: countryName, // 화면에 보여줄 국가명
          countryFlagUrl: countryFlagUrl, // 국기 URL
          joinDate: new Date(profile.created_at).toLocaleDateString(i18n.language, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          following: profile.following_count ?? 0,
          followers: profile.followers_count ?? 0,
          banner: profile.banner_url ?? null,
          bannerPositionY: profile.banner_position_y ?? 50,
          nickname_updated_at: profile.nickname_updated_at,
          country_updated_at: profile.country_updated_at,
          banned_until: profile.banned_until ?? null,
        });
        
        // Fetch ban details if initially banned
        if (profile.banned_until) {
             fetchBanDetails(profile.id);
        }

      } catch (err) {
        console.error('프로필 불러오기 실패:', err);
        setUserProfile(null);
      }
    };
    fetchProfile();
  }, [decodedUsername, user, i18n.language]);
  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  // 프로필 저장 후 상태 갱신
  const handleSaveProfile = (updatedProfile: Partial<UserProfile>) => {
    setUserProfile(prev => (prev ? { ...prev, ...updatedProfile } : prev));
  };
  // 로딩 / 에러 상태
  if (!userProfile) {
    return (
      <div className="min-h-screen bg-white dark:bg-background">
        <div className="flex justify-center">
          <div className="w-full max-w-2xl lg:max-w-3xl border-x border-gray-200 dark:border-gray-700 dark:bg-background">
            <div className="flex items-center justify-center py-20">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <i className="ri-user-line text-6xl text-gray-300 dark:text-gray-600 mb-4" />
                <p>{t('common.error_loading_profile', 'Unable to load profile.')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    // 홈 피드처럼: 전체 배경 + 가운데 정렬 + 가운데 컬럼만 border-x
    <div className="min-h-screen bg-white dark:bg-background">
      <ScrollToTopButton className="bottom-10 right-6 lg:right-16 xl:right-[calc(50vw-500px)]" />
      <div className="flex justify-center">
        {/* 가운데 프로필 컬럼 */}
        <div className="w-full max-w-2xl lg:max-w-3xl border-x border-gray-200 dark:border-gray-700 dark:bg-background">
          {/* 상단 스티키 헤더 (뒤로가기 + 이름) */}
          <div className="sticky top-0 bg-white/80 dark:bg-background/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 p-4 z-20">
            <div className="flex items-center">
              {/* 뒤로가기 */}
              <button
                onClick={() => navigate(-1)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-primary/10 transition-colors"
              >
                <i className="ri-arrow-left-line text-xl text-gray-700 dark:text-gray-100" />
              </button>
              {/* 이름 */}
              <h1 className="ml-3 text-xl font-bold text-gray-900 dark:text-gray-100">
                {userProfile.name}
              </h1>
              {/* 오른쪽 영역 */}
              {!isOwnProfile && (
                <div className="ml-auto relative" ref={menuRef}>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setShowMenu(prev => !prev);
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-primary/10 transition"
                  >
                    <i className="ri-more-fill text-gray-500 dark:text-gray-400 text-lg" />
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 top-10 w-36 bg-white dark:bg-secondary border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg py-2 z-50 overflow-hidden">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          setShowReportModal(true);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-white/10 flex items-center gap-2 text-gray-800 dark:text-gray-200 text-sm"
                      >
                         <i className="ri-flag-line" />
                         {t('common.report')}
                      </button>
                      
                      {userProfile?.id && (
                        <BlockButton
                          targetProfileId={userProfile.id}
                          onClose={() => setShowMenu(false)}
                        />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          {/* 프로필 헤더 (배너, 아바타, 팔로워 수 등) */}
          <ProfileHeader
            userProfile={userProfile}
            isOwnProfile={isOwnProfile}
            onProfileUpdated={updated => setUserProfile(updated)}
            onEditClick={() => setIsEditModalOpen(true)}
          />
          
          {userProfile.banned_until && isBanned(userProfile.banned_until) && (() => {
            const banInfo = banStartDate 
              ? formatBanPeriod(banStartDate, userProfile.banned_until)
              : null;
            const isPermanent = new Date(userProfile.banned_until) > addYears(new Date(), 50);
            
            return (
              <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-y border-red-200 dark:border-red-800/50 px-4 sm:px-6 py-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                      <i className="ri-error-warning-fill text-xl text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-red-700 dark:text-red-300 mb-2 flex flex-wrap items-center gap-2">
                      {isPermanent ? (
                        <>
                           <span>🚫 이 사용자는 영구 이용 제재되었습니다</span>
                           <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Permanent Ban</span>
                        </>
                      ) : (
                         <span>🚫 이 사용자는 현재 이용 제한 중입니다</span>
                      )}
                    </h3>
                    {!isPermanent && (
                      <>
                        {banInfo ? (
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                              <span className="font-semibold text-red-600 dark:text-red-400">
                                이용제한 기간({banInfo.duration}):
                              </span>
                              <span className="text-red-700 dark:text-red-300 font-mono text-[11px] bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded">
                                {banInfo.startFormatted}
                              </span>
                              <span className="text-red-600 dark:text-red-400">~</span>
                              <span className="text-red-700 dark:text-red-300 font-mono text-[11px] bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded">
                                {banInfo.endFormatted}
                              </span>
                              {banCount > 0 && (
                                <span className="font-bold text-red-700 dark:text-red-300 ml-1">
                                  ({banCount}번째 이용제한)
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-red-600/80 dark:text-red-400/80">
                              • 남은 기간: <span className="font-semibold">{banInfo.daysRemaining}일</span>
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-red-600 dark:text-red-400">
                            이용 제한 종료: {new Date(userProfile.banned_until!).toLocaleString('ko-KR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false
                            }).replace(/\. /g, '.').replace(/\.$/, '')}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
          
          {/* 탭 (게시물 / 답글 / 좋아요) */}
          <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
          {/* 탭에 따른 트윗 리스트 */}
          <ProfileTweets activeTab={activeTab} userProfile={userProfile} />
          {/* 프로필 편집 모달 */}
          <EditProfileModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            userProfile={userProfile}
            onSave={handleSaveProfile}
          />
          
          <ReportModal 
             isOpen={showReportModal}
             onClose={() => setShowReportModal(false)}
             targetType="user"
             targetId={userProfile.id}
          />
        </div>
      </div>
    </div>
  );
}
