import { deleteMyVoca, isSavedMyVoca, upsertMyVoca } from '@/lib/userVoca';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAutoTranslation } from '@/hooks/useAutoTranslation';
import { useBatchAutoTranslation } from '@/hooks/useBatchAutoTranslation';
import { romanizeKorean, hasKorean } from '@/utils/romanize';
import {
  Bookmark,
  BookmarkCheck,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export type EpisodeWord = {
  id: string;
  ko: string;
  meaning?: string;
  en: string;
  exampleKo?: string;
  exampleEn?: string;
  difficulty?: 1 | 2 | 3;
  imageEmoji?: string;
  image_url?: string | null;
  pos?: string;
  pronKo?: string;
  pron?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  words: EpisodeWord[];
  initialWordId?: string;
  title?: string;

  getEpisodeHref?: (word: EpisodeWord) => string | null;
  episodeCtaLabel?: string;

  sourceEpisodeId?: string;
  sourceEpisodeTitle?: string;

  sourceStudyPath?: string;
  sourceStudyTitle?: string;
};

const normalize = (v?: string | null) => (v ?? '').trim();

export default function EpisodeVocaModal({
  isOpen,
  onClose,
  words,
  initialWordId,
  title,
  getEpisodeHref,
  episodeCtaLabel,
  sourceEpisodeId,
  sourceEpisodeTitle,
  sourceStudyPath,
  sourceStudyTitle,
}: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const displayModalTitle = title ?? t('study.voca.modal_default_title', '단어 카드');

  const targetLang = i18n.language || 'en';
  const isKorean = targetLang.toLowerCase().startsWith('ko');

  const hasWords = Array.isArray(words) && words.length > 0;
  const isVocaPage = location.pathname.startsWith('/voca');

  const initialIndex = useMemo(() => {
    if (!hasWords) return 0;
    if (!initialWordId) return 0;
    const target = String(initialWordId);
    const idx = words.findIndex(w => String(w.id) === target);
    return idx >= 0 ? idx : 0;
  }, [initialWordId, words, hasWords]);

  const [index, setIndex] = useState(0);
  const [showOriginal, setShowOriginal] = useState(false);
  const [saved, setSaved] = useState(false);
  const [ttsSpeaking, setTtsSpeaking] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setIndex(initialIndex);
    setShowOriginal(false);
  }, [isOpen, initialIndex]);

  useEffect(() => {
    if (!isOpen) return;
    setShowOriginal(false);
    setImgError(false);
  }, [index, isOpen]);

  // 뷰포트 고정 — 모달 활성화 시 배경 스크롤을 차단하고 현재 스크롤 위치를 고정 (Scroll Jump 방지)
  useEffect(() => {
    if (!isOpen) return;

    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (!hasWords) return;

    setIndex(prev => {
      const maxIdx = words.length - 1;
      return Math.min(Math.max(prev, 0), maxIdx);
    });
  }, [isOpen, hasWords, words.length]);

  const word = hasWords ? words[index] : null;

  useEffect(() => {
    setImgError(false);
  }, [word?.image_url, index]);

  const meaningSrc = normalize(word?.meaning || word?.en);
  const exampleSrc = normalize(word?.exampleEn || word?.exampleKo);
  const pronSrc = normalize(word?.pronKo || word?.pron);
  const POS_KEY_MAP: Record<string, string> = {
    '명사': 'voca.pos.noun',
    '동사': 'voca.pos.verb',
    '형용사': 'voca.pos.adjective',
    '부사': 'voca.pos.adverb',
    '대명사': 'voca.pos.pronoun',
    '수사': 'voca.pos.numeral',
    '조사': 'voca.pos.particle',
    '감탄사': 'voca.pos.interjection',
  };
  const posSrc = useMemo(() => {
    const p = normalize(word?.pos).replace(/[()]/g, '');
    const k = POS_KEY_MAP[p];
    return k ? t(k) : p;
  }, [word?.pos, t, POS_KEY_MAP]);

  // 글로벌 번역 페이징 파이프라인 — 모달 내 전체 단어 리스트를 사전에 번역하여 탐색 중 끊김 현상 제거
  const combinedTexts = useMemo(() => {
    const meanings = words.map(w => normalize(w.meaning || w.en));
    const prons = words.map(w => {
      const p = normalize(isVocaPage ? (w.pronKo || w.pron) : (w.pron || w.pronKo));
      return (!isKorean && p) ? `[${p}]` : p;
    });
    const examples = words.map(w => normalize(w.exampleEn || w.exampleKo));
    
    const poses = words.map(w => {
      const p = normalize(w.pos).replace(/[()]/g, '');
      const k = POS_KEY_MAP[p];
      return k ? t(k) : p;
    });
    return [...meanings, ...prons, ...examples, ...poses];
  }, [words, isKorean, t, isVocaPage]);

  const combinedKeys = useMemo(() => {
    const meanings = words.map(w => `episode_voca_meaning_${w.id}`);
    const prons = words.map(w => `episode_voca_pron_v4_${w.id}`);
    const examples = words.map(w => `episode_voca_example_${w.id}`);
    const poses = words.map(w => `episode_voca_pos_${w.id}`);
    return [...meanings, ...prons, ...examples, ...poses];
  }, [words]);

  const { translatedTexts: allTranslated } = useBatchAutoTranslation(combinedTexts, combinedKeys, targetLang);

  const getTr = (fieldIdx: number) => {
    let tr = allTranslated[fieldIdx * words.length + index] || '';
    if (fieldIdx === 1 && tr.startsWith('[') && tr.endsWith(']')) {
      tr = tr.slice(1, -1);
    }
    return tr;
  };

  const displayMeaning = showOriginal ? meaningSrc : (isKorean ? meaningSrc : getTr(0) || meaningSrc);
  const displayPron = showOriginal ? pronSrc : (isKorean ? pronSrc : getTr(1) || pronSrc);
  const displayExample = showOriginal ? exampleSrc : (isKorean ? exampleSrc : getTr(2) || exampleSrc);
  const displayPos = showOriginal ? posSrc : (isKorean ? posSrc : getTr(3) || posSrc);

  // 단어(Term)는 번역하지 않고 항상 원문 노출 (User Request)
  const displayTerm = word?.ko;

  const imageSrc = useMemo(() => {
    const raw = normalize(word?.image_url);
    if (!raw) return '';

    try {
      return encodeURI(raw);
    } catch {
      return raw;
    }
  }, [word?.image_url]);

  const toImageSrc = (url?: string | null) => {
    const raw = normalize(url);
    if (!raw) return '';

    try {
      return encodeURI(raw);
    } catch {
      return raw;
    }
  };

  // 이미지 프리로딩 파이프라인 — 사용자 인터랙션 전 가용 범위(현재 인덱스 기준 정방향 2개, 역방향 1개)의 이미지를 메모리에 캐싱
  useEffect(() => {
    if (!isOpen || !hasWords) return;

    const preloadTargets = [words[index + 1], words[index + 2], words[index - 1]]
      .filter(Boolean)
      .map(w => toImageSrc(w?.image_url))
      .filter(Boolean);

    preloadTargets.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, [isOpen, hasWords, index, words]);

  // [DELETED redundant single-hook calls]

  useEffect(() => {
    if (!isOpen) return;
    if (!word) return;

    let alive = true;

    (async () => {
      try {
        const exists = await isSavedMyVoca(String(word.id));
        if (alive) setSaved(exists);
      } catch (e) {
        console.error(e);
        if (alive) setSaved(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [isOpen, word?.id]);

  const isFirst = !hasWords || index === 0;
  const isLast = !hasWords || index === words.length - 1;

  const goNext = () => {
    if (!hasWords) return;
    if (index >= words.length - 1) return;
    setIndex(prev => prev + 1);
  };

  const goPrev = () => {
    if (!hasWords) return;
    if (index <= 0) return;
    setIndex(prev => prev - 1);
  };

  // 키보드 접근성 인터페이스 — Escape(닫기), Arrow(이동), Space(원문 전환) 등 전역 단축키 이벤트 바인딩
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === ' ') {
        e.preventDefault();
        setShowOriginal(v => !v);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, index, words.length, onClose]);

  const handleToggleBookmark = async () => {
    if (!word) return;

    const word_key = String(word.id);

    try {
      if (saved) {
        await deleteMyVoca(word_key);
        setSaved(false);
        return;
      }

      await upsertMyVoca({
        word_key,
        term: word.ko,
        meaning: word.en,
        example_ko: word.exampleKo ?? null,
        example_tr: word.exampleEn ?? null,
        pos: word.pos ?? null,
        pron: word.pronKo ?? word.pron ?? null,
        image_url: word.image_url ?? null,
        status: 'unknown',
        wrong_count: 0,
        source_study_path: sourceStudyPath ?? null,
        source_study_title: sourceStudyTitle ?? null,
        source_episode_id: sourceEpisodeId ?? null,
        source_episode_title: sourceEpisodeTitle ?? null,
      });

      setSaved(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSpeak = () => {
    if (!word) return;
    const synth = window.speechSynthesis;
    if (!synth) return;

    if (ttsSpeaking) {
      synth.cancel();
      setTtsSpeaking(false);
      return;
    }

    const utter = new SpeechSynthesisUtterance(word.ko);
    
    // 타겟 언어 설정에 따른 TTS 발음 코드 동적 할당 (영어만 나오는 문제 해결)
    if (targetLang.startsWith('en')) utter.lang = 'en-US';
    else if (targetLang.startsWith('ja')) utter.lang = 'ja-JP';
    else if (targetLang.startsWith('zh')) utter.lang = 'zh-CN';
    else if (targetLang.startsWith('vi')) utter.lang = 'vi-VN';
    else utter.lang = 'ko-KR'; // ARA의 주 학습 대상인 한국어를 기본값으로 유지하되 타켓 매칭

    utter.onstart = () => setTtsSpeaking(true);
    utter.onend = () => setTtsSpeaking(false);
    utter.onerror = () => setTtsSpeaking(false);

    synth.cancel();
    synth.speak(utter);
  };

  useEffect(() => {
    if (isOpen) return;
    window.speechSynthesis?.cancel?.();
    setTtsSpeaking(false);
  }, [isOpen]);

  const episodeHref = useMemo(() => {
    if (!word) return null;
    return getEpisodeHref?.(word) ?? null;
  }, [word, getEpisodeHref]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[3px]" aria-hidden="true" />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-2 sm:p-6">
        <div className="relative w-[min(92vw,420px)] sm:w-full sm:max-w-[560px] h-[85dvh] max-h-[760px]">
          <div className="h-full rounded-[22px] sm:rounded-[32px] bg-white dark:bg-secondary shadow-2xl overflow-hidden flex flex-col">
            <div className="px-4 sm:px-6 pt-4 sm:pt-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-emerald-500">
                    <span className="truncate">{displayModalTitle}</span>
                    {hasWords && (
                      <>
                        <span className="text-gray-300">·</span>
                        <span className="text-xs font-normal text-gray-500 dark:text-gray-300">
                          {index + 1} / {words.length}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleToggleBookmark}
                    disabled={!word}
                    className={`h-10 w-10 rounded-full flex items-center justify-center transition disabled:opacity-50 ${
                      saved
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15'
                    }`}
                    aria-label={saved ? t('study.voca.aria_bookmark_remove', '북마크 해제') : t('study.voca.aria_bookmark_save', '북마크 저장')}
                    title={saved ? t('study.voca.aria_bookmark_remove', '저장됨 (클릭하면 해제)') : t('study.voca.aria_bookmark_save', '저장하기')}
                  >
                    {saved ? <BookmarkCheck size={22} /> : <Bookmark size={22} />}
                  </button>

                  <button
                    onClick={onClose}
                    className="h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 flex items-center justify-center"
                    aria-label="닫기"
                    title="닫기"
                  >
                    <X size={22} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 px-4 sm:px-7 pt-3 sm:pt-5 pb-3 sm:pb-6 overflow-y-auto overscroll-contain scrollbar-thin">
              <div className="pt-2 sm:pt-5">
                <div className="text-center">
                  <div className="text-[26px] leading-[1] sm:text-[34px] font-extrabold text-gray-900 dark:text-gray-100">
                    {(showOriginal ? word?.ko : displayTerm) ?? t('study.voca.word_card', '단어 카드')}
                  </div>

                  <div className="mt-2 min-h-[20px] text-[13px] sm:text-[15px] text-gray-500 dark:text-gray-300">
                    {displayPron ? (
                      `[${displayPron}]`
                    ) : (
                      <span className="invisible">placeholder</span>
                    )}
                  </div>

                  <div className="mt-2 min-h-[18px] text-[12px] sm:text-xs text-gray-400">
                    {displayPos ? (
                      `(${displayPos})`
                    ) : (
                      <span className="invisible">placeholder</span>
                    )}
                  </div>
                </div>

                <div className="mt-3 sm:mt-2">
                  <div className="mt-2 text-center text-[18px] sm:text-[22px] font-bold text-gray-900 dark:text-gray-100 px-2 break-keep min-h-[22px] sm:min-h-[30px]">
                    {displayMeaning || '-'}
                  </div>
                </div>

                <div className="mt-3 sm:mt-2">
                  <div className="mt-2 px-3 sm:px-5 text-center text-[13px] sm:text-[15px] leading-relaxed text-gray-600 dark:text-gray-300 break-keep min-h-[28px] sm:min-h-[42px]">
                    {displayExample ? `“${displayExample}”` : '-'}
                  </div>
                </div>

                <div className="mt-2 sm:mt-2 flex items-center justify-center">
                  <div className="h-[min(22dvh,180px)] w-[min(78vw,240px)] sm:h-[260px] sm:w-[410px] rounded-[22px] sm:rounded-[36px] bg-gradient-to-b from-emerald-50 to-white dark:from-white/10 dark:to-transparent flex items-center justify-center shadow-inner overflow-hidden">
                    {imageSrc && !imgError ? (
                      <img
                        src={imageSrc}
                        alt={word?.ko ?? t('study.voca.word_image', '단어 이미지')}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                        loading="eager"
                        decoding="async"
                        fetchPriority="high"
                        onError={() => setImgError(true)}
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2">
                        <span className="text-[min(9dvh,78px)] sm:text-[78px]">
                          {word?.imageEmoji ?? '📚'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 sm:px-7 pb-4 sm:pb-7 pt-3 sm:pt-5">
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <button
                  onClick={() => setShowOriginal(v => !v)}
                  aria-label={showOriginal ? t('study.voca.view_translation', '번역 보기') : t('study.voca.view_original', '원문 보기')}
                  title={showOriginal ? t('study.voca.view_translation', '번역 보기') : t('study.voca.view_original', '원문 보기')}
                  className="h-[44px] sm:h-[56px] rounded-[16px] sm:rounded-[18px]
                             bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-lg
                             active:scale-[0.99] transition flex items-center justify-center gap-0 sm:gap-2"
                >
                  <RefreshCw size={22} />
                  <span className="hidden sm:inline text-[14px]">
                    {showOriginal ? t('study.voca.view_translation', '번역 보기') : t('study.voca.view_original', '원문 보기')}
                  </span>
                </button>

                <button
                  onClick={handleSpeak}
                  disabled={!word}
                  aria-label={ttsSpeaking ? t('study.voca.stop_tts', '발음 중지') : t('study.voca.play_tts', '발음 듣기')}
                  title={ttsSpeaking ? t('study.voca.stop_tts', '중지') : t('study.voca.play_tts', '발음')}
                  className="h-[42px] sm:h-[56px] rounded-[16px] sm:rounded-[18px]
                             bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold
                             active:scale-[0.99] transition flex items-center justify-center gap-0 sm:gap-2
                             disabled:opacity-50 dark:bg-white/10 dark:hover:bg-white/15 dark:text-gray-100"
                >
                  {ttsSpeaking ? <VolumeX size={22} /> : <Volume2 size={22} />}
                  <span className="hidden sm:inline text-[14px]">
                    {ttsSpeaking ? t('study.voca.stop_tts_short', '중지') : t('study.voca.play_tts_short', '발음')}
                  </span>
                </button>

                {user && (
                  <button
                    onClick={() => {
                      if (isVocaPage) {
                        if (!episodeHref) return;
                        navigate(episodeHref);
                      } else {
                        navigate('/voca');
                      }
                    }}
                    disabled={isVocaPage ? !episodeHref : false}
                    aria-label={isVocaPage ? t('study.voca.go_episode', '에피소드로 이동') : t('study.voca.go_voca', '단어장으로 이동')}
                    title={isVocaPage ? t('study.voca.go_episode_short', '에피소드로') : t('study.voca.go_voca_short', '단어장')}
                    className="h-[48px] sm:h-[56px] rounded-[16px] sm:rounded-[18px]
                             bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold
                             active:scale-[0.99] transition flex items-center justify-center gap-0 sm:gap-2
                             disabled:opacity-50 dark:bg-white/10 dark:hover:bg-white/15 dark:text-gray-100"
                  >
                    <BookOpen size={22} />
                    <span className="hidden sm:inline text-[14px]">
                      {isVocaPage ? (episodeCtaLabel ?? t('study.voca.go_episode_short', '에피소드')) : t('study.voca.go_voca_short', '단어장')}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {!isFirst && (
            <button
              onClick={goPrev}
              className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20
                        h-10 w-10 sm:h-12 sm:w-12 rounded-full
                         bg-white/90 hover:bg-white shadow-lg
                         flex items-center justify-center
                         ring-1 ring-black/5 hover:ring-emerald-200 transition
                         dark:bg-black/40 dark:hover:bg-black/50"
              aria-label="이전 단어"
              title="이전"
            >
              <span className="text-emerald-700 dark:text-emerald-200">
                <ChevronLeft size={22} strokeWidth={2.2} />
              </span>
            </button>
          )}

          {!isLast && (
            <button
              onClick={goNext}
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20
                         h-12 w-12 rounded-full
                         bg-white/90 hover:bg-white shadow-lg
                         flex items-center justify-center
                         ring-1 ring-black/5 hover:ring-emerald-200 transition
                         dark:bg-black/40 dark:hover:bg-black/50"
              aria-label="다음 단어"
              title="다음"
            >
              <span className="text-emerald-700 dark:text-emerald-200">
                <ChevronRight size={22} strokeWidth={2.2} />
              </span>
            </button>
          )}

          {!hasWords && (
            <div className="mt-3 text-center text-sm text-gray-200">{t('study.voca.no_words_to_show', '표시할 단어가 없어요.')}</div>
          )}
        </div>
      </div>
    </div>
  );
}
