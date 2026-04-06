/**
 * 하이엔드 사용자 프로필 엔진(High-end User Profile Engine):
 * - 목적(Why): 사용자의 소셜 정체성을 시각화하고 구독 플랜(Premium)에 따른 차별화된 심미적 경험을 제공함
 * - 방법(How): Supabase Realtime CDC를 연동하여 실시간 프로필 동기화를 처리하고, 제재(Ban) 상태에 따른 UI 가드 로직을 통합함
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import SeagullIcon from '@/components/common/SeagullIcon';
import { Bird } from 'lucide-react';
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
  banned_until?: string | null;
  plan?: 'free' | 'basic' | 'premium';
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
  // 경로 변수 파싱 — URL 세그먼트로부터 대상 식별자(Username/ID) 추출 및 디코딩 처리
  const { username } = useParams<{ username: string }>();
  const decodedUsername = username ? decodeURIComponent(username) : '';
  const isOwnProfile = user && userProfile ? user.id === userProfile.user_id : false;

  useEffect(() => {
    if (!userProfile) {
      document.title = '프로필 | ARA';
      return;
    }

    document.title = isOwnProfile ? `내 프로필 | ARA` : `${userProfile.name} 프로필 | ARA`;
  }, [userProfile, isOwnProfile]);

  // 실시간 프로필 업데이트 리스너 — 계정 제재 상태 등 중요 변경사항 즉시 반영

  const fetchBanDetails = async (authId: string) => {
    // 제재 이력 조회 — 현재 적용 중인 시스템 이용 제한의 시작 시점 추출
    const { data: sanctionData } = await supabase
      .from('sanction_history')
      .select('created_at')
      .eq('target_user_id', authId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sanctionData) {
      setBanStartDate(sanctionData.created_at);
    }

    // 누적 제재 횟수 산출 — 정지/영구정지 이력 전수 조사를 통한 누적 위반 횟수 계산
    const { count } = await supabase
      .from('sanction_history')
      .select('*', { count: 'exact', head: true })
      .eq('target_user_id', authId)
      .in('sanction_type', ['ban', 'permanent_ban']);

    setBanCount(count || 0);
  };

  // 런타임 프로필 식별자 참조 — 실시간 구독(Real-time) 이벤트 핸들러 내에서 최신 상태를 참조하기 위한 Ref 캐싱
  const targetProfileIdRef = useRef<string | null>(null);
  const targetAuthIdRef = useRef<string | null>(null);
  const latestFetchProfile = useRef<() => Promise<void>>();

  const fetchProfile = useCallback(async () => {
    if (!decodedUsername && !user) return;
    try {
      let baseQuery = supabase.from('profiles').select(`
        id, user_id, nickname, avatar_url, banner_url, banner_position_y,
        bio, country, followers_count, following_count, created_at,
        nickname_updated_at, country_updated_at, banned_until, plan
      `);

      if (!decodedUsername && user) {
        baseQuery = baseQuery.eq('user_id', user.id);
      } else {
        const isUuid =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedUsername) ||
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedUsername);
        if (isUuid) baseQuery = baseQuery.eq('id', decodedUsername);
        else baseQuery = baseQuery.eq('nickname', decodedUsername);
      }

      const { data: profile, error: profileError } = await baseQuery.single();
      if (profileError || !profile) throw profileError;

      targetProfileIdRef.current = profile.id;
      targetAuthIdRef.current = profile.user_id;

      let countryName: string | null = null;
      let countryFlagUrl: string | null = null;
      if (profile.country) {
        const { data: countryRow } = await supabase
          .from('countries')
          .select('id, name, flag_url')
          .eq('id', profile.country)
          .maybeSingle();
        if (countryRow) {
          countryName = countryRow.name ?? null;
          countryFlagUrl = countryRow.flag_url ?? null;
        }
      }

      setUserProfile({
        id: profile.id,
        user_id: profile.user_id,
        name: profile.nickname ?? 'Unknown',
        username: profile.user_id,
        avatar: profile.avatar_url ?? '/default-avatar.svg',
        bio: profile.bio ?? t('profile.no_bio_placeholder', 'No bio yet.'),
        country: countryName,
        countryFlagUrl: countryFlagUrl,
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
        plan: profile.plan ?? 'free',
      });

      if (profile.banned_until) fetchBanDetails(profile.user_id);
    } catch (err) {
      setUserProfile(null);
    }
  }, [decodedUsername, user, i18n.language, t]);

  useEffect(() => {
    latestFetchProfile.current = fetchProfile;
  }, [fetchProfile]);

  // 1) 데이터 로딩
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // 실시간 데이터 동기화(CDC) — profiles 테이블 변경 감지 시 즉시 로컬 상태 리프레시 수행
  useEffect(() => {
    const channel = supabase
      .channel(`profile-page-realtime-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        payload => {
          const updated = payload.new as any;
          const isMatch =
            updated &&
            (String(updated.id) === String(targetProfileIdRef.current) ||
              String(updated.user_id) === String(targetAuthIdRef.current));

          if (isMatch) {
            latestFetchProfile.current?.();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // Mount 시 1회 고정
  // UI 이벤트 핸들링 — 메뉴 외부 영역 클릭 감지를 통한 드롭다운 인터페이스 자동 비활성화
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  // 상태 로컬 동기화 — 편집 모달로부터 수신된 최신 프로필 정보를 메모리 내 상태로 반영
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
    // 프로필 레이아웃 컨테이너 — 뷰포트 중앙 정렬 및 플랜별(Premium) 특화 시각 효과 적용
    <div className={`min-h-screen relative overflow-hidden ${userProfile.plan === 'premium' ? 'bg-[#0a1a14] dark:bg-[#050d0a]' : 'bg-white dark:bg-background'}`}>
      {userProfile.plan === 'premium' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[50vh] bg-[#00BFA5]/10 rounded-[100%] blur-[120px] opacity-70 animate-pulse mix-blend-screen" style={{ animationDuration: '8s' }}></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vh] bg-[#00E5FF]/10 rounded-[100%] blur-[100px] opacity-60 animate-pulse mix-blend-screen" style={{ animationDuration: '12s' }}></div>
        </div>
      )}
      <ScrollToTopButton className="bottom-10 right-6 lg:right-16 xl:right-[calc(50vw-500px)] z-50" />
      <div className="flex justify-center relative z-10">
        {/* 가운데 프로필 컬럼 */}
        <div className={`w-full max-w-2xl lg:max-w-3xl border-x ${userProfile.plan === 'premium' ? 'border-[#00BFA5]/20 bg-transparent' : 'border-gray-200 dark:border-gray-700 dark:bg-background'}`}>
          {/* 상단 네비게이션 레이어 — 스티키 레이아웃 기반의 이름 노출 및 뒤로가기 액션 제어 */}
          <div className={`sticky top-0 backdrop-blur-md border-b p-4 z-20 ${userProfile.plan === 'premium' ? 'bg-[#0a1a14]/80 border-[#00BFA5]/20 shadow-[0_4px_20px_rgba(0,191,165,0.05)]' : 'bg-white/80 dark:bg-background/80 border-gray-200 dark:border-gray-700'}`}>
            <div className="flex items-center">
              {/* 뒤로가기 */}
              <button
                onClick={() => navigate(-1)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-primary/10 transition-colors"
              >
                <i className="ri-arrow-left-line text-xl text-gray-700 dark:text-gray-100" />
              </button>
              {/* 이름 */}
              <div className="flex flex-col ml-3 justify-center">
                <h1 className={`text-xl font-bold flex items-center ${userProfile.plan === 'premium' ? 'text-[#00F0FF]' : 'text-gray-900 dark:text-gray-100'}`}>
                  {userProfile.name}
                  {userProfile.plan === 'premium' && (
                    <SeagullIcon size={20} className="ml-1 text-[#00BFA5] drop-shadow-[0_0_8px_rgba(0,191,165,0.8)]" />
                  )}
                </h1>
                {userProfile.plan === 'premium' && (
                  <span className="text-[10px] font-black tracking-widest uppercase text-[#00BFA5] opacity-80 leading-none mt-0.5">
                    Premium Member
                  </span>
                )}
              </div>
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
                        onClick={e => {
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
          {/* 프로필 정보 요약 섹션 — 아바타, 통계, 관리 액션이 포함된 핵심 프로필 헤더 컴포넌트 */}
          <ProfileHeader
            userProfile={userProfile}
            isOwnProfile={isOwnProfile}
            onProfileUpdated={updated => setUserProfile(updated)}
            onEditClick={() => setIsEditModalOpen(true)}
          />

          {userProfile.banned_until &&
            isBanned(userProfile.banned_until) &&
            (() => {
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
                            <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                              Permanent Ban
                            </span>
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
                                • 남은 기간:{' '}
                                <span className="font-semibold">{banInfo.daysRemaining}일</span>
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-red-600 dark:text-red-400">
                              이용 제한 종료:{' '}
                              {new Date(userProfile.banned_until!)
                                .toLocaleString('ko-KR', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false,
                                })
                                .replace(/\. /g, '.')
                                .replace(/\.$/, '')}
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
