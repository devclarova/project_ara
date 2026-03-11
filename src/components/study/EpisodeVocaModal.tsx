import { deleteMyVoca, isSavedMyVoca, upsertMyVoca } from '@/lib/userVoca';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
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

export type EpisodeWord = {
  id: string;
  ko: string;
  meaning?: string;
  en: string;
  ja?: string;
  zh?: string;
  exampleKo?: string;
  exampleEn?: string;
  difficulty?: 1 | 2 | 3;
  imageEmoji?: string;
  pos?: string; // 품사
  pronKo?: string; // 발음(한글)
  pron?: string; // 발음(기타)
};

function pickBackText(word: EpisodeWord, targetLang: string) {
  const lang = (targetLang || 'en').toLowerCase();
  if (lang.startsWith('ko')) return word.ko;
  if (lang.startsWith('ja')) return word.ja || word.en;
  if (lang.startsWith('zh')) return word.zh || word.en;
  return word.en;
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  words: EpisodeWord[];
  initialWordId?: string;
  title?: string;

  // 단어 -> 에피소드 이동 링크 만들어주는 함수 (단어장에서만 넘겨도 됨)
  getEpisodeHref?: (word: EpisodeWord) => string | null;
  episodeCtaLabel?: string; // 버튼 라벨 커스텀

  sourceEpisodeId?: string;
  sourceEpisodeTitle?: string;

  sourceStudyPath?: string;
  sourceStudyTitle?: string;
};

export default function EpisodeVocaModal({
  isOpen,
  onClose,
  words,
  initialWordId,
  title = '단어 카드',
  getEpisodeHref,
  episodeCtaLabel,

  sourceEpisodeId,
  sourceEpisodeTitle,

  sourceStudyPath,
  sourceStudyTitle,
}: Props) {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const targetLang = i18n.language || 'en';

  const hasWords = Array.isArray(words) && words.length > 0;

  const initialIndex = useMemo(() => {
    if (!hasWords) return 0;
    if (!initialWordId) return 0;
    const target = String(initialWordId);
    const idx = words.findIndex(w => String(w.id) === target);
    return idx >= 0 ? idx : 0;
  }, [initialWordId, words, hasWords]);

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [saved, setSaved] = useState(false);
  const [ttsSpeaking, setTtsSpeaking] = useState(false);

  const location = useLocation();
  const isVocaPage = location.pathname.startsWith('/voca');

  useEffect(() => {
    if (!isOpen) return;
    setIndex(initialIndex);
    setFlipped(false);
  }, [isOpen, initialIndex]);

  useEffect(() => {
    if (!isOpen) return;
    setFlipped(false);
  }, [index, isOpen]);

  // 바디 스크롤 잠금
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

  // 인덱스 클램프
  useEffect(() => {
    if (!isOpen) return;
    if (!hasWords) return;
    setIndex(prev => {
      const maxIdx = words.length - 1;
      return Math.min(Math.max(prev, 0), maxIdx);
    });
  }, [isOpen, hasWords, words.length]);

  const word = hasWords ? words[index] : null;

  const backText = useMemo(() => {
    if (!word) return '';
    return pickBackText(word, targetLang);
  }, [word, targetLang]);

  // DB에서 저장 여부 확인
  useEffect(() => {
    if (!isOpen) return;
    if (!word) return;

    let alive = true;
    (async () => {
      try {
        const exists = await isSavedMyVoca(String(word.id)); // word.id === word_key
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

  // 키보드
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return;
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === ' ') {
        e.preventDefault();
        setFlipped(v => !v);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, hasWords, index, words.length]);

  // 북마크 토글 (DB)
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
        pron: word.pron ?? null,
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

  // TTS
  const handleSpeak = () => {
    if (!word) return;
    const synth = window.speechSynthesis;
    if (!synth) return;

    if (ttsSpeaking) {
      synth.cancel();
      setTtsSpeaking(false);
      return;
    }

    const text = flipped ? backText : word.ko;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = flipped ? (targetLang.startsWith('ko') ? 'ko-KR' : targetLang) : 'ko-KR';

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

  // 에피소드 이동 링크는 "외부에서"만 결정
  const episodeHref = useMemo(() => {
    if (!word) return null;
    return getEpisodeHref?.(word) ?? null;
  }, [word, getEpisodeHref]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[3px]" aria-hidden="true" />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-3 sm:p-6">
        <div className="w-full max-w-[520px] h-[92dvh] max-h-[720px] sm:h-[680px]">
          <div className="h-full rounded-[28px] sm:rounded-[32px] bg-white dark:bg-secondary shadow-2xl overflow-hidden flex flex-col">
            {/* top bar */}
            <div className="px-4 sm:px-6 pt-4 sm:pt-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-emerald-500">
                    <span className="truncate">{title}</span>
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
                    className={`h-10 w-10 rounded-full flex items-center justify-center transition disabled:opacity-50
                      ${
                        saved
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15'
                      }`}
                    aria-label={saved ? '북마크 해제' : '북마크 저장'}
                    title={saved ? '저장됨 (클릭하면 해제)' : '저장하기'}
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

            {/* content */}
            <div className="flex-1 px-4 sm:px-7 pt-3 sm:pt-6 pb-3 sm:pb-6 overflow-y-auto overscroll-contain scrollbar-thin">
              <div className="pt-2 sm:pt-6">
                <div className="text-center">
                  <div className="text-[22px] leading-[1.25] sm:text-[30px] sm:leading-snug font-extrabold text-gray-900 dark:text-gray-100">
                    {word ? (flipped ? word.en : word.ko) : '단어 카드'}
                  </div>

                  {/* pos + pron */}
                  <div className="mt-1 min-h-[18px] sm:min-h-[20px] text-[12px] sm:text-sm text-gray-500 dark:text-gray-300 text-center">
                    {word?.pronKo && !flipped ? (
                      <>{`[${word.pronKo}]`}</>
                    ) : (
                      <span className="invisible">placeholder</span>
                    )}
                  </div>

                  <div className="mt-2 min-h-[16px] sm:min-h-[18px] text-[11px] sm:text-xs text-gray-400">
                    {word && (word.pos || word.pron) ? (
                      <>
                        {word.pos ? `(${word.pos})` : ''}
                        {word.pron ? ` · ${word.pron}` : ''}
                      </>
                    ) : (
                      <span className="invisible">placeholder</span>
                    )}
                  </div>
                </div>

                {/* image + 좌우 버튼 */}
                <div className="relative mt-[clamp(10px,2.2vh,28px)] flex items-center justify-center">
                  {!isFirst && (
                    <button
                      onClick={goPrev}
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full
                                bg-white/80 hover:bg-white shadow-md flex items-center justify-center
                                ring-1 ring-black/5 hover:ring-emerald-200 transition
                                dark:bg-black/30 dark:hover:bg-black/40 dark:ring-white/10"
                      aria-label="이전 단어"
                      title="이전"
                    >
                      <span className="text-emerald-700 dark:text-emerald-200">
                        <ChevronLeft size={22} strokeWidth={2.2} />
                      </span>
                    </button>
                  )}

                  <div
                    className="h-[min(28dvh,240px)] w-[min(28dvh,240px)] sm:h-[240px] sm:w-[240px]
                               rounded-[30px] sm:rounded-[40px]
                               bg-gradient-to-b from-emerald-50 to-white
                               dark:from-white/10 dark:to-transparent
                               flex items-center justify-center shadow-inner"
                  >
                    <span className="text-[min(11dvh,92px)] sm:text-[92px]">
                      {word?.imageEmoji ?? (flipped ? '🔁' : '📚')}
                    </span>
                  </div>

                  {!isLast && (
                    <button
                      onClick={goNext}
                      className="absolute right-0 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full
                                bg-white/80 hover:bg-white shadow-md flex items-center justify-center
                                ring-1 ring-black/5 hover:ring-emerald-200 transition
                                dark:bg-black/30 dark:hover:bg-black/40 dark:ring-white/10"
                      aria-label="다음 단어"
                      title="다음"
                    >
                      <span className="text-emerald-700 dark:text-emerald-200">
                        <ChevronRight size={22} strokeWidth={2.2} />
                      </span>
                    </button>
                  )}
                </div>

                {/* example */}
                {word?.exampleKo && !flipped && (
                  <div className="mt-[clamp(8px,2vh,24px)] text-[clamp(11px,3vw,14px)] text-gray-600 dark:text-gray-300 text-center px-2">
                    “{word.exampleKo}”
                  </div>
                )}

                {word?.exampleEn && flipped && !targetLang.toLowerCase().startsWith('ko') && (
                  <div className="mt-4 sm:mt-7 text-[12px] sm:text-sm text-gray-600 dark:text-gray-300 text-center px-2">
                    “{word.exampleEn}”
                  </div>
                )}
              </div>
            </div>

            {/* bottom actions */}
            <div className="px-5 sm:px-7 pb-4 sm:pb-7 pt-3 sm:pt-5">
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <button
                  onClick={() => setFlipped(v => !v)}
                  aria-label={flipped ? '앞면 보기' : '뒤집기'}
                  title={flipped ? '앞면 보기' : '뒤집기'}
                  className="h-[44px] sm:h-[56px] rounded-[16px] sm:rounded-[18px]
                             bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-lg
                             active:scale-[0.99] transition flex items-center justify-center gap-0 sm:gap-2"
                >
                  <RefreshCw size={22} />
                  <span className="hidden sm:inline text-[14px]">
                    {flipped ? '앞면' : '뒤집기'}
                  </span>
                </button>

                <button
                  onClick={handleSpeak}
                  disabled={!word}
                  aria-label={ttsSpeaking ? '발음 중지' : '발음 듣기'}
                  title={ttsSpeaking ? '중지' : '발음'}
                  className="h-[48px] sm:h-[56px] rounded-[16px] sm:rounded-[18px]
                             bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold
                             active:scale-[0.99] transition flex items-center justify-center gap-0 sm:gap-2
                             disabled:opacity-50 dark:bg-white/10 dark:hover:bg-white/15 dark:text-gray-100"
                >
                  {ttsSpeaking ? <VolumeX size={22} /> : <Volume2 size={22} />}
                  <span className="hidden sm:inline text-[14px]">
                    {ttsSpeaking ? '중지' : '발음'}
                  </span>
                </button>

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
                  aria-label={isVocaPage ? '에피소드로 이동' : '단어장으로 이동'}
                  title={isVocaPage ? '에피소드로' : '단어장'}
                  className="h-[48px] sm:h-[56px] rounded-[16px] sm:rounded-[18px]
                             bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold
                             active:scale-[0.99] transition flex items-center justify-center gap-0 sm:gap-2
                             disabled:opacity-50 dark:bg-white/10 dark:hover:bg-white/15 dark:text-gray-100"
                >
                  <BookOpen size={22} />
                  <span className="hidden sm:inline text-[14px]">
                    {isVocaPage ? (episodeCtaLabel ?? '에피소드') : '단어장'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {!hasWords && (
            <div className="mt-3 text-center text-sm text-gray-200">표시할 단어가 없어요.</div>
          )}
        </div>
      </div>
    </div>
  );
}
