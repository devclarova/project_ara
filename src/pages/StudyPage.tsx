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

// 이 페이지에서 실제로 사용하는 video 행 타입을 로컬로 정의(컬럼명과 일치)
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

  // Auto Translation Hooks
  const { i18n, t } = useTranslation();
  const targetLang = i18n.language;

  const handleSelectDialogue = (s: Subtitle) => setSelectedSubtitle(s);
  const vref = useRef<VideoPlayerHandle>(null);

  const dec = (v?: string | null) => (v == null ? v : decodeURIComponent(v));
  const enc = (v?: string | number | null) => encodeURIComponent(String(v ?? ''));

  // 페이지 메타
  const baseTitle = 'ARA - Learn Korean with K-Content';
  const pageTitleOriginal = study
    ? `${study.contents ?? 'ARA Study'}${study.episode ? ` ${study.episode}` : ''}${
        study.scene ? ` - Scene ${study.scene}` : ''
      } | ${baseTitle}`
    : `Study | ${baseTitle}`;

  // Title Logic (Korean Mode & Auto Translation)
  const isKoreanTitle = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(study?.contents ?? '');
  // Study List와 동일한 제목(부모 Study의 title)을 우선 사용
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

  // 음악 카테고리 여부 (제목 표시 및 에피소드 노출 여부에 사용)
  const isMusic = study?.categories?.includes('음악') || study?.categories?.includes('Music') || study?.categories?.includes(t('study.category.music'));

  let displayTitle = effectiveTitle || t('study.no_title');

  // 번역 적용 로직
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

  // URL 생성기: scene이 없으면 세그먼트 생략
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

  // 게스트용 콘텐츠인지 확인
  const checkIsFeatured = async (studyId: number): Promise<boolean> => {
    const { data, error } = await supabase
      .from('study')
      .select('is_featured')
      .eq('id', studyId)
      .maybeSingle();

    if (error) return false;
    return !!data?.is_featured;
  };

  useEffect(() => {
    const fetchStudy = async () => {
      if (!contents || !episode) return;
      setLoading(true);

      const c = dec(contents);
      const e = dec(episode);

      // CASE 1: scene 존재하는 경우
      if (scene != null) {
        const s = dec(scene);

        const { data, error } = await supabase
          .from('video')
          .select(
            'id,study_id,categories,contents,episode,scene,level,runtime,runtime_bucket,image_url,view_count, study:study_id(title,short_description)',
          )
          .eq('contents', c)
          .eq('episode', e)
          .eq('scene', s)
          .limit(1)
          .maybeSingle();

        if (error) console.error('[video fetch error]', error);

        // 보호처리 — 게스트 접근 차단
        if (isGuest && data) {
          const free = await checkIsFeatured(data.study_id);
          if (!free) {
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

      // CASE 2: scene 없이 들어온 경우 → 첫 scene 선택
      const { data } = await supabase
        .from('video')
        .select(
          'id,study_id,categories,contents,episode,scene,level,runtime,runtime_bucket,image_url,view_count, study:study_id(title,short_description)',
        )
        .eq('contents', c)
        .eq('episode', e)
        .order('scene', { ascending: true })
        .limit(1);

      const row = (data?.[0] as unknown as VideoRow) ?? null;

      // 게스트 보호 처리
      if (isGuest && row) {
        const free = await checkIsFeatured(row.study_id);
        if (!free) {
          setShowSignIn(true);
          setStudy(null);
          setLoading(false);
          return;
        }
      }

      setStudy(row);

      // URL 정규화
      if (row) {
        const canonical = buildStudyUrl(row);
        if (canonical !== location.pathname) navigate(canonical, { replace: true });
      }

      setLoading(false);
    };

    void fetchStudy();
  }, [contents, episode, scene, navigate]);

  // Next/Prev 이동 보호 처리
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

    // 게스트 보호조건
    if (isGuest) {
      const free = await checkIsFeatured(next);
      if (!free) {
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

    // 게스트 보호조건
    if (isGuest) {
      const free = await checkIsFeatured(prev);
      if (!free) {
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

        {/* Open Graph */}
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

        {/* Twitter */}
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
                {/* 링크 */}
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

                {/* 콘텐츠명 */}
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
                
                {/* 설명글 */}
                {!loading && (translatedDescription || parentShortDesc) && (
                  <div className="mt-3 px-4 sm:px-6 md:px-8">
                    <p className="text-center text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed max-w-3xl mx-auto">
                      {translatedDescription || parentShortDesc}
                    </p>
                  </div>
                )}
              </div>

              {/* 메타 정보 라인: 시간/난이도/카테고리 */}
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

              {/* 영상 플레이어 */}
              <VideoPlayer key={`${contents}-${episode}-${scene}`} ref={vref} />

              {/* 자막 리스트 */}
              <StudySubtitles
                onSelectDialogue={handleSelectDialogue}
                studyId={study?.study_id}
                subscribeRealtime
                onSeek={start => {
                  vref.current?.playDialogue(start);
                }}
              />

              {/* 학습 카드 */}
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
