/**
 * 몰입형 비디오 학습 시네라마(Immersive Video Learning Cinerama):
 * - 목적(Why): 비디오 콘텐츠와 실시간 동기화된 자막 및 인터랙티브 학습 카드를 통해 실제 맥락 속 언어 습득을 지원함
 * - 방법(How): VideoPlayer API와 자막 데이터 스트림을 유기적으로 결합하고, SEO 최적화를 위한 다국어 메타데이터 동적 주입을 수행함
 */
import SignInModal from '@/components/auth/SignInModal';
import ShareButton from '@/components/common/ShareButton';
import { InfoItem } from '@/components/study/ContentCard';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useRef, useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { NavLink, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAutoTranslation } from '@/hooks/useAutoTranslation';
import StudyCard from '../components/study/StudyCard';
import StudySubtitles from '../components/study/StudySubtitles';
import VideoPlayer, { type VideoPlayerHandle } from '../components/study/VideoPlayer';
import { supabase } from '../lib/supabase';
import type { Subtitle } from '../types/study';

// 비디오 데이터 매핑을 위한 로컬 타입 정의 — DB 스키마 컬럼과 동기화
type VideoRow = {
  id: number;
  study_id: number;
  categories: string | null;
  contents: string | null; // 작품/콘텐츠 이름
  episode: string | null;
  scene: string | number | null;
  level: string | null;
  runtime: string | null;
  runtime_bucket: string | null;
  image_url: string | null;
  view_count: number | null;
  study: { title: string; short_description: string | null } | Array<{ title: string; short_description: string | null }> | null;
};

const StudyPage = () => {
  const { contents, episode, scene } = useParams<{
    contents: string;
    episode: string;
    scene?: string;
  }>();
  const navigate = useNavigate();

  const [selectedSubtitle, setSelectedSubtitle] = useState<Subtitle | null>(null);
  const [study, setStudy] = useState<VideoRow | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const isGuestRoute = location.pathname.startsWith('/guest-study');
  const basePath = isGuestRoute ? '/guest-study' : '/study';

  const { user } = useAuth();
  const isGuest = !user;
  const [showSignIn, setShowSignIn] = useState(false);

  // 텍스트 자동 번역 훅 — 설정 언어별 실시간 데이터 변환 적용
  const { i18n, t } = useTranslation();
  const targetLang = i18n.language;

  const handleSelectDialogue = (s: Subtitle) => setSelectedSubtitle(s);
  const vref = useRef<VideoPlayerHandle>(null);

  const dec = (v?: string | null) => (v == null ? v : decodeURIComponent(v));
  const enc = (v?: string | number | null) => encodeURIComponent(String(v ?? ''));

  // SEO 전용 페이지 메타 데이터 및 기본 타이틀 구성
  const baseTitle = 'ARA - Learn Korean with K-Content';
  const pageTitleOriginal = study
    ? `${study.contents ?? 'ARA Study'}${study.episode ? ` ${study.episode}` : ''}${
        study.scene ? ` - Scene ${study.scene}` : ''
      } | ${baseTitle}`
    : `Study | ${baseTitle}`;

  // 페이지 타이틀 생성 로직 — 언어 모드 및 번역 데이터 조합 처리
  const isKoreanTitle = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(study?.contents ?? '');
  // 데이터 일관성 확보를 위해 부모 Study 레코드의 제목을 최우선 바인딩
  const parentTitle = study?.study && !Array.isArray(study.study) 
    ? study.study.title 
    : (Array.isArray(study?.study) ? study?.study[0]?.title : null);

  const effectiveTitle = parentTitle || study?.contents || '';
  
  const { translatedText: translatedTitle } = useAutoTranslation(effectiveTitle, `study_title_${study?.study_id || study?.id}`, targetLang);
  const { translatedText: translatedRuntime } = useAutoTranslation(study?.runtime || '', `study_runtime_${study?.id}`, targetLang);
  const { translatedText: translatedRuntimeBucket } = useAutoTranslation(study?.runtime_bucket || '', `study_runtime_bucket_${study?.id}`, targetLang);
  const { translatedText: translatedLevel } = useAutoTranslation(study?.level || '', `study_level_${study?.id}`, targetLang);
  const { translatedText: translatedCategory } = useAutoTranslation(study?.categories || '', `category_${study?.id}`, targetLang);
  const { translatedText: translatedEpisode } = useAutoTranslation(study?.episode || '', `study_episode_${study?.id}`, targetLang);
  const parentShortDesc = study?.study && !Array.isArray(study.study) 
    ? study.study.short_description 
    : (Array.isArray(study?.study) ? study?.study[0]?.short_description : null);
  
  const { translatedText: translatedDescription } = useAutoTranslation(parentShortDesc || '', `study_desc_${study?.study_id || study?.id}`, targetLang);

  const formatValue = (key: string, val: string | number | null | undefined) => {
    if (!val) return '';
    const str = String(val).trim();
    // Match "Ep 1", "Episode 01", "제1화", "1" etc.
    const match = str.match(/^(\d+)$/) || str.match(/^(?:ep|episode|제|第)?\.?\s*(\d+)(?:화|회|集|話)?$/i);
    if (match) {
      return t(`study.formats.${key}`, { val: match[1] });
    }
    return str;
  };

  const displayEpisode = formatValue('episode', study?.episode);
  const displayScene = formatValue('scene', study?.scene);

  // 제품 분류 판별 — 음악 카테고리 특화 레이아웃(에피소드 숨김 등) 적용 유무 결정
  const isMusic = study?.categories?.includes('음악') || study?.categories?.includes('Music') || study?.categories?.includes(t('study.category.music'));

  let displayTitle = effectiveTitle || t('study.no_title');

  // 번역 렌더링 로직 — 타겟 언어별 포맷 분기 처리
  if (translatedTitle && effectiveTitle && translatedTitle !== effectiveTitle) {
    if (targetLang.startsWith('ko')) {
      displayTitle = effectiveTitle;
    } else {
      // 음악 카테고리는 중복 느낌을 줄이기 위해 괄호 병기 사용 (가수 - 제목 (번역))
      // 그 외(드라마, 영화 등)는 기존 포맷 유지 (원제 - 번역)
      if (isMusic) {
        displayTitle = `${effectiveTitle} (${translatedTitle})`;
      } else {
        displayTitle = `${effectiveTitle} - ${translatedTitle}`;
      }
    }
  }

  const translatedLevelDisplay = useMemo(() => {
    const lvl = study?.level;
    if (lvl === '초급') return t('study.level.beginner');
    if (lvl === '중급') return t('study.level.intermediate');
    if (lvl === '고급') return t('study.level.advanced');
    return lvl;
  }, [study?.level, t]);

  const pageTitle = study
    ? `${displayTitle} ${displayEpisode} ${displayScene} | ARA`
    : `Study | ARA`;

  const metaDescription = study
    ? t('study.meta_desc_scene', {
        contents: study.contents ?? '',
        episode: study.episode ?? '',
        scene: study.scene ?? '',
      })
    : t('study.meta_desc_default');

  const description = study
    ? `${t('study.share_text_prefix')} ${displayTitle} ${displayEpisode} ${displayScene}`
    : t('study.meta_desc_default');

  const ogImage = study?.image_url ?? '/images/font_slogan_logo.png';

  // 시네마틱 경로 생성 헬퍼 — 씬(Scene) 정보 부재 시 해당 세그먼트 자동 제외
  const buildStudyUrl = (row: {
    contents?: string | null;
    episode?: string | null;
    scene?: string | number | null;
  }) => {
    const c = enc(row.contents);
    const e = enc(row.episode);
    const s = row.scene != null && String(row.scene).length > 0 ? enc(row.scene) : null;
    return s ? `${basePath}/${c}/${e}/${s}` : `${basePath}/${c}/${e}`;
  };


  useEffect(() => {
    const fetchStudy = async () => {
      if (!contents || !episode) return;
      setLoading(true);

      const c = dec(contents);
      const e = dec(episode);

      // CASE 1: 씬(Scene) 지정 접근 — 정밀 필터링 기반 데이터 단일 조회
      if (scene != null) {
        const s = dec(scene);

        const { data, error } = await supabase
          .from('video')
          .select(
            'id,study_id,categories,contents,episode,scene,level,runtime,runtime_bucket,image_url,view_count, study:study_id(title,short_description,is_featured)',
          )
          .eq('contents', c)
          .eq('episode', e)
          .eq('scene', s)
          .limit(1)
          .maybeSingle();

        if (error) console.error('[video fetch error]', error);

        // 보호처리 — 게스트 접근 차단 (추천 콘텐츠는 통과)
        if (isGuest && data) {
          const studyData = data.study as any;
          const isFeatured = Array.isArray(studyData) ? studyData[0]?.is_featured : studyData?.is_featured;
          
          if (!isFeatured) {
            setShowSignIn(true);
            setStudy(null);
            setLoading(false);
            return;
          }
        }

        setStudy((data as unknown as VideoRow) ?? null);
        setLoading(false);
        return;
      }

      // CASE 2: 씬(Scene) 미지정 접근 — 에피소드 내 첫 번째 씬 자동 인덱싱
      const { data } = await supabase
        .from('video')
        .select(
          'id,study_id,categories,contents,episode,scene,level,runtime,runtime_bucket,image_url,view_count, study:study_id(title,short_description,is_featured)',
        )
        .eq('contents', c)
        .eq('episode', e)
        .order('scene', { ascending: true })
        .limit(1);

      const row = (data?.[0] as unknown as VideoRow) ?? null;

      // 게스트 보호 처리 (추천 콘텐츠는 통과)
      if (isGuest && row) {
        const studyData = row.study as any;
        const isFeatured = Array.isArray(studyData) ? studyData[0]?.is_featured : studyData?.is_featured;

        if (!isFeatured) {
          setShowSignIn(true);
          setStudy(null);
          setLoading(false);
          return;
        }
      }

      setStudy(row);

      // URL 정규화 — 씬 정보 누적 시 Canonical URL로 강제 리다이렉션 수행
      if (row) {
        const canonical = buildStudyUrl(row);
        if (canonical !== location.pathname) navigate(canonical, { replace: true });
      }

      setLoading(false);
    };

    void fetchStudy();
  }, [contents, episode, scene, navigate]);

  // 인접 콘텐츠 이동 간 세션 권한 및 유효성 검증 로직
  const goToByStudyId = async (targetStudyId: number) => {
    const { data } = await supabase
      .from('video')
      .select('contents,episode,scene')
      .eq('study_id', targetStudyId)
      .order('id', { ascending: true })
      .limit(1);

    const row = data?.[0];
    if (!row) return;

    navigate(buildStudyUrl(row));
  };

  const gotoNextExisting = async () => {
    if (!study?.study_id) return;

    const { data } = await supabase
      .from('video')
      .select('study_id')
      .gt('study_id', study.study_id)
      .order('study_id', { ascending: true })
      .limit(1);

    const next = data?.[0]?.study_id;
    if (!next) return;

    // 게스트 권한 제어 — 비로그인 사용자 대상 추천 콘텐츠(is_featured) 외 접근 제한
    if (isGuest) {
      const { data: sData } = await supabase
        .from('study')
        .select('is_featured')
        .eq('id', next)
        .maybeSingle();
      
      if (!sData?.is_featured) {
        setShowSignIn(true);
        return;
      }
    }

    await goToByStudyId(next);
  };

  const gotoPrevExisting = async () => {
    if (!study?.study_id) return;

    const { data } = await supabase
      .from('video')
      .select('study_id')
      .lt('study_id', study.study_id)
      .order('study_id', { ascending: false })
      .limit(1);

    const prev = data?.[0]?.study_id;
    if (!prev) return;

    // 게스트 권한 제어 — 이전 콘텐츠 열람 시 featured 필드 검증을 통한 접근 권한 확인
    if (isGuest) {
      const { data: sData } = await supabase
        .from('study')
        .select('is_featured')
        .eq('id', prev)
        .maybeSingle();

      if (!sData?.is_featured) {
        setShowSignIn(true);
        return;
      }
    }

    await goToByStudyId(prev);
  };

  const handleNextPage = () => {
    void gotoNextExisting();
  };
  const handlePrevPage = () => {
    void gotoPrevExisting();
  };

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>

        <meta name="description" content={description} />

        {/* SNS 공유 최적화를 위한 Open Graph 메타 데이터 섹션 */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImage} />
        <meta
          property="og:url"
          content={
            study
              ? `https://ara.com${buildStudyUrl(study)}`
              : `https://ara.com/study/${enc(contents)}/${enc(episode)}${scene ? `/${enc(scene)}` : ''}`
          }
        />
        <meta property="og:type" content="article" />

        {/* 트위터(X) 카드 최적화 메타 데이터 섹션 */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />
      </Helmet>
      <div className="min-h-screen bg-white dark:bg-background">
        <div className="flex justify-center">
          <div className="flex w-full max-w-5xl min-h-screen">
            {/* Left Sidebar */}
            {/* <aside className="w-20 lg:w-64 shrink-0 border-r-2 border-gray-200 dark:border-gray-700 h-screen sticky top-0 bg-white dark:bg-background">
              <Sidebar onTweetClick={() => setShowTweetModal(true)} />
            </aside> */}

            <div className="max-w-4xl mx-auto space-y-6 overflow-y-auto hide-scrollbar flex-1">
              <div className="p-1 max-w-5xl mx-auto">
                {/* 브레드크럼(Breadcrumb) 네비게이션 — 경로 추적 인터페이스 */}
                <nav aria-label="Breadcrumb" className="mb-4">
                  <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 py-2 backdrop-blur">
                    {/* 1) Studylist */}
                    <NavLink
                      to="/studylist"
                      className={({
                        isActive,
                      }) => `group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full leading-none transition-all text-sm
        ${
          isActive
            ? 'ring-indigo-200 text-indigo-700 bg-gradient-to-r from-indigo-500/10 to-fuchsia-500/10'
            : 'ring-gray-200 text-gray-700 hover:ring-indigo-200 hover:bg-white dark:hover:bg-gray-600'
        }`}
                    >
                      <i className="ri-home-5-line text-base opacity-70 group-hover:opacity-100 dark:text-gray-100" />
                      <span className="font-medium hidden sm:inline-block dark:text-gray-100">
                        {t('study.studylist')}
                      </span>
                    </NavLink>

                    {/* chevron */}
                    <span className="text-gray-300 hidden sm:inline-block">/</span>

                    {/* 2) 카테고리 */}
                    <NavLink
                      to={
                        study?.categories
                          ? `/studylist?category=${encodeURIComponent(study.categories)}`
                          : '/studylist'
                      }
                      className={({
                        isActive,
                      }) => `group inline-flex items-center px-3 py-1 rounded-xl leading-[0.9] transition-all text-sm whitespace-normal break-words text-left h-auto
        ${
          isActive
            ? 'ring-indigo-200 text-indigo-700 bg-gradient-to-r from-indigo-500/10 to-fuchsia-500/10'
            : 'ring-gray-200 text-gray-700 hover:ring-indigo-200 hover:bg-white dark:hover:bg-gray-600'
        }`}
                      title={study?.categories ?? t('study.category.all')}
                    >
                      <i className="ri-folder-2-line text-base opacity-70 group-hover:opacity-100 shrink-0 dark:text-gray-100 mr-1" />
                      <span className="font-medium hidden sm:block dark:text-gray-100 leading-[0.9]">
                        {translatedCategory ?? study?.categories ?? t('study.category.all')}
                      </span>
                    </NavLink>

                    {/* chevron (sm↑에서만 보이게) */}
                    <span className="text-gray-300 hidden sm:inline-block">/</span>

                    {/* 3) 콘텐츠(작품명) */}
                    <NavLink
                      to={
                        study?.contents
                          ? {
                              pathname: '/studylist',
                              search: `?category=${encodeURIComponent(
                                study?.categories ?? t('study.category.all'),
                              )}&content=${encodeURIComponent(String(study.contents))}`,
                            }
                          : '/studylist'
                      }
                      className={({ isActive }) =>
                        `group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl leading-none transition-all text-sm whitespace-normal break-words text-left h-auto
        ${
          isActive
            ? 'ring-indigo-200 text-indigo-700 bg-gradient-to-r from-indigo-500/10 to-fuchsia-500/10'
            : 'ring-gray-200 text-gray-700 hover:ring-indigo-200 hover:bg-white dark:hover:bg-gray-600'
        }`
                      }
                      title={loading ? t('common.loading') : (study?.contents ?? t('study.no_title'))}
                    >
                      <i className="ri-movie-2-line text-base opacity-70 group-hover:opacity-100 shrink-0 dark:text-gray-100 mr-1" />
                      <span className="font-medium hidden sm:block dark:text-gray-100 leading-[0.9]">
                        {loading ? t('common.loading') : (displayTitle ?? t('study.no_title'))}
                      </span>
                    </NavLink>

                    {/* chevron (md↑에서만) */}
                    <span className="text-gray-300 hidden md:inline-block">/</span>

                    {/* 4) 에피소드 */}
                    <NavLink
                      to={
                        study?.episode
                          ? {
                              pathname: '/studylist',
                              search: `?category=${encodeURIComponent(
                                study?.categories ?? t('study.category.all'),
                              )}&content=${encodeURIComponent(
                                String(study.contents),
                              )}&episode=${encodeURIComponent(study.episode)}`,
                            }
                          : '/studylist'
                      }
                      className={({ isActive }) =>
                        `group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl leading-none transition-all text-sm whitespace-normal break-words text-left h-auto
        ${
          isActive
            ? 'ring-indigo-200 text-indigo-700 bg-gradient-to-r from-indigo-500/10 to-fuchsia-500/10'
            : 'ring-gray-200 text-gray-700 hover:ring-indigo-200 hover:bg-white hover:dark:bg-gray-600 dark:text-gray-300'
        }`
                      }
                      title={loading ? t('common.loading') : (displayEpisode || t('study.no_episode'))}
                    >
                      <i className={`${isMusic ? 'ri-music-2-line' : 'ri-hashtag'} text-base opacity-70 group-hover:opacity-100 shrink-0 dark:text-gray-100 mr-1`} />
                      <span className="font-medium hidden sm:block dark:text-gray-100 leading-[0.9]">
                        {loading ? t('common.loading') : (
                          isMusic && translatedEpisode && translatedEpisode !== study?.episode
                            ? `${displayEpisode} (${translatedEpisode})`
                            : (displayEpisode || t('study.no_episode'))
                        )}
                      </span>
                    </NavLink>
                  </div>
                </nav>

                {/* 에피소드 네비게이션 헤더 — 타겟 콘텐츠 간 빠른 전환 인터페이스 */}
                <div className="flex justify-between items-center mb-3">
                  {/* 이전 버튼 */}
                  <button
                    onClick={handlePrevPage}
                    className="group shrink-0 flex justify-center items-center py-2 rounded-lg transition-all duration-200 text-gray-700 hover:text-primary dark:text-gray-100"
                    aria-label={t('study.aria_prev_episode')}
                  >
                    <i className="ri-arrow-drop-left-line text-4xl sm:text-5xl transition-transform duration-200 group-hover:-translate-x-1" />
                  </button>

                  {/* 중앙 타이틀 */}
                  <h1 className="flex-1 flex flex-col items-center justify-center font-bold text-gray-900 select-none tracking-tight px-2 min-w-0">
                    {loading ? (
                      <span className="animate-pulse text-gray-400 text-lg sm:text-xl lg:text-2xl dark:text-gray-100">
                        {t('common.loading')}
                      </span>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-center justify-center text-center gap-1 sm:gap-2 w-full">
                        <span className="text-lg sm:text-xl lg:text-2xl xl:text-3xl dark:text-gray-100 break-keep leading-tight">
                          {displayTitle}
                        </span>

                        <div className="flex items-baseline gap-1 shrink-0">
                          {/* 음악 카테고리는 에피소드/씬 정보 숨김 (사용자 요청) */}
                          {!isMusic && displayEpisode && (
                            <span className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300 whitespace-nowrap">
                              {displayEpisode}
                            </span>
                          )}
                          {!isMusic && displayScene && (
                            <span className="text-xs sm:text-sm lg:text-base text-gray-500 dark:text-gray-400 whitespace-nowrap">
                              {displayScene}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </h1>

                  {/* 다음 버튼 */}
                  <button
                    onClick={handleNextPage}
                    className="group shrink-0 flex justify-center items-center py-2 rounded-lg transition-all duration-200 text-gray-700 hover:text-primary dark:text-gray-100"
                    aria-label={t('study.aria_next_episode')}
                  >
                    <i className="ri-arrow-drop-right-line text-4xl sm:text-5xl transition-transform duration-200 group-hover:translate-x-1" />
                  </button>
                </div>
                
                {/* 콘텐츠 상세 요약 정보 노출 영역 — 다국어 설명 지원 */}
                {!loading && (translatedDescription || parentShortDesc) && (
                  <div className="mt-3 px-4 sm:px-6 md:px-8">
                    <p className="text-center text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed max-w-3xl mx-auto">
                      {translatedDescription || parentShortDesc}
                    </p>
                  </div>
                )}
              </div>

              {/* 콘텐츠 메타 정보 대시보드 — 런타임/레벨/실시간 통계 데이터 */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-gray-300 px-1">
                <span className="flex items-center gap-1 shrink-0">
                  {/* 시간(runtime) */}
                  <InfoItem
                    icon="ri-time-line"
                    text={loading ? '—' : (translatedRuntime ?? translatedRuntimeBucket ?? study?.runtime ?? study?.runtime_bucket ?? '—')}
                  />
                </span>
                <span className="flex items-center gap-1 shrink-0">
                  {/* 난이도 */}
                  <InfoItem icon="ri-star-line" text={loading ? '—' : (translatedLevel ?? study?.level ?? '—')} />
                </span>
                {/* 조회수 */}
                <span className="flex items-center gap-1 shrink-0">
                  <InfoItem
                    icon="ri-eye-line"
                    text={loading ? '—' : `${study?.view_count ?? '—'}`}
                  />
                </span>
                {!loading && (
                  <div className="ml-auto shrink-0">
                    <ShareButton
                      title={`${displayTitle}`}
                      text={`${t('study.share_text_prefix')} ${displayTitle} ${!isMusic ? displayEpisode : ''} ${!isMusic ? displayScene : ''}`}
                    />
                  </div>
                )}
              </div>

              {/* 메인 프레임 비디오 재생 엔진 */}
              <VideoPlayer key={`${contents}-${episode}-${scene}`} ref={vref} />

              {/* 실시간 동기화 지원 자막 스트림 레이어 */}
              <StudySubtitles
                onSelectDialogue={handleSelectDialogue}
                studyId={study?.study_id}
                subscribeRealtime
                onSeek={start => {
                  vref.current?.playDialogue(start);
                }}
              />

              {/* 인터랙티브 학습 데이터 카드 섹션 — 자막 연동 */}
              {study?.study_id !== undefined && (
                <StudyCard subtitle={selectedSubtitle} studyId={study?.study_id} />
              )}
            </div>
          </div>
        </div>
        <SignInModal isOpen={showSignIn} onClose={() => setShowSignIn(false)} />
      </div>
    </>
  );
};

export default StudyPage;
