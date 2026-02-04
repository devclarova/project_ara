import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export type EpisodeWord = {
  id: string;
  ko: string;
  en: string;
  ja?: string;
  zh?: string;
  exampleKo?: string;
  exampleEn?: string;
  difficulty?: 1 | 2 | 3;
  imageEmoji?: string;
};

function pickBackText(word: EpisodeWord, targetLang: string) {
  const lang = (targetLang || 'en').toLowerCase();
  if (lang.startsWith('ko')) return word.ko;
  if (lang.startsWith('ja')) return word.ja || word.en;
  if (lang.startsWith('zh')) return word.zh || word.en;
  return word.en;
}

/** --------------------
 * localStorage 저장 (VocaPage와 동일 키)
 * -------------------- */
type VocabItem = {
  id: string;
  term: string;
  meaning: string;
  exampleKo?: string;
  exampleTr?: string;
  status: 'unknown' | 'learning' | 'known';
  wrongCount: number;
  createdAt: string;
  updatedAt: string;
};

const VOCAB_LS_KEY = 'ara_vocab_mock_v1';
const nowISO = () => new Date().toISOString();

function loadVocab(): VocabItem[] {
  try {
    const raw = localStorage.getItem(VOCAB_LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as VocabItem[]) : [];
  } catch {
    return [];
  }
}

function saveVocab(items: VocabItem[]) {
  localStorage.setItem(VOCAB_LS_KEY, JSON.stringify(items));
}

function upsertVocab(item: VocabItem) {
  const current = loadVocab();
  const idx = current.findIndex(v => v.id === item.id);

  if (idx >= 0) {
    const next = [...current];
    const createdAt = next[idx].createdAt ?? item.createdAt;
    next[idx] = { ...next[idx], ...item, createdAt, updatedAt: nowISO() };
    saveVocab(next);
    return;
  }

  saveVocab([item, ...current]);
}

function removeVocab(id: string) {
  const current = loadVocab();
  saveVocab(current.filter(v => v.id !== id));
}

/** 북마크 아이콘 (채움/라인) */
function BookmarkIcon({ filled }: { filled?: boolean }) {
  return filled ? (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M6 3.75C6 2.784 6.784 2 7.75 2h8.5C17.216 2 18 2.784 18 3.75V22l-6-3.2L6 22V3.75Z"
        fill="currentColor"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M7.75 2h8.5C17.216 2 18 2.784 18 3.75V22l-6-3.2L6 22V3.75C6 2.784 6.784 2 7.75 2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 4.2V19.5l4.5-2.4 4.5 2.4V4.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 카드 뒤집기 아이콘 */
function FlipIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M7.5 7.5h9A3 3 0 0 1 19.5 10.5v6A3 3 0 0 1 16.5 19.5h-9A3 3 0 0 1 4.5 16.5v-6A3 3 0 0 1 7.5 7.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 6.3l3-2.3 3 2.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 4v3.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M9.2 13.2h5.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M14.2 11.6l1.6 1.6-1.6 1.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 스피커(TTS) 아이콘 */
function SpeakerIcon({ on }: { on?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M11 5 7 9H4v6h3l4 4V5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M16 9.5c1.2 1 1.2 4 0 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M18.5 7c2.2 2 2.2 8 0 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity={on ? 1 : 0.6}
      />
    </svg>
  );
}

/** 단어장 아이콘 */
function VocabIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M6.5 4.5h10A2 2 0 0 1 18.5 6.5v13A1.5 1.5 0 0 0 17 18H6.5A2 2 0 0 1 4.5 16V6.5A2 2 0 0 1 6.5 4.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 8h8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M7.5 11h8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Chevron 아이콘 */
function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M14.5 6.5 9 12l5.5 5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M9.5 6.5 15 12l-5.5 5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  words: EpisodeWord[];
  initialWordId?: string;
  title?: string;
};

export default function EpisodeVocabModal({
  isOpen,
  onClose,
  words,
  initialWordId,
  title = '단어 카드',
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

  useEffect(() => {
    if (!isOpen) return;
    setIndex(initialIndex);
    setFlipped(false);
  }, [isOpen, initialIndex]);

  useEffect(() => {
    if (!isOpen) return;
    setFlipped(false);
  }, [index, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
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

  const backText = useMemo(() => {
    if (!word) return '';
    return pickBackText(word, targetLang);
  }, [word, targetLang]);

  useEffect(() => {
    if (!isOpen) return;
    if (!word) return;
    const exists = loadVocab().some(v => v.id === String(word.id));
    setSaved(exists);
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

  const handleToggleBookmark = () => {
    if (!word) return;
    const id = String(word.id);

    if (saved) {
      removeVocab(id);
      setSaved(false);
      return;
    }

    const item: VocabItem = {
      id,
      term: word.ko,
      meaning: backText,
      exampleKo: word.exampleKo,
      exampleTr: word.exampleEn,
      status: 'unknown',
      wrongCount: 0,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };

    upsertVocab(item);
    setSaved(true);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[3px]" aria-hidden="true" />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div className="w-[520px] max-w-[92vw] h-[680px] max-h-[90vh]">
          <div className="h-full rounded-[32px] bg-white dark:bg-secondary shadow-2xl overflow-hidden flex flex-col">
            {/* top bar */}
            <div className="px-6 pt-6">
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
                    <BookmarkIcon filled={saved} />
                  </button>

                  <button
                    onClick={onClose}
                    className="h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 flex items-center justify-center"
                    aria-label="닫기"
                    title="닫기"
                  >
                    <span className="text-xl leading-none">✕</span>
                  </button>
                </div>
              </div>
            </div>

            {/* content */}
            <div className="flex-1 px-7 pt-6 pb-6 overflow-auto">
              {/* 전체를 아래로 내리기 위한 래퍼 */}
              <div className="pt-6">
                {/* word: image 위 중앙 */}
                <div className="text-center">
                  <div className="mx-auto max-w-[460px] text-[28px] sm:text-[30px] font-extrabold text-gray-900 dark:text-gray-100 leading-snug">
                    {word ? (flipped ? backText : word.ko) : '단어 카드'}
                  </div>
                </div>

                {/* image + 좌우 버튼 */}
                <div className="relative mt-7 flex items-center justify-center">
                  {/* left: 첫 단어면 숨김 */}
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
                        <ChevronLeftIcon />
                      </span>
                    </button>
                  )}

                  {/* illustration: 더 크게 */}
                  <div className="h-[240px] w-[240px] rounded-[40px] bg-gradient-to-b from-emerald-50 to-white dark:from-white/10 dark:to-transparent flex items-center justify-center shadow-inner">
                    <span className="text-[92px]">
                      {word?.imageEmoji ?? (flipped ? '🔁' : '📚')}
                    </span>
                  </div>

                  {/* right: 마지막 단어면 숨김 */}
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
                        <ChevronRightIcon />
                      </span>
                    </button>
                  )}
                </div>

                {/* example */}
                {word?.exampleKo && !flipped && (
                  <div className="mt-7 text-sm text-gray-600 dark:text-gray-300 text-center px-2">
                    “{word.exampleKo}”
                  </div>
                )}

                {word?.exampleEn && flipped && !targetLang.toLowerCase().startsWith('ko') && (
                  <div className="mt-7 text-sm text-gray-600 dark:text-gray-300 text-center px-2">
                    “{word.exampleEn}”
                  </div>
                )}

                <div className="mt-6 text-center text-xs text-gray-400">
                  단축키: ←/→ 이동 · Space 뒤집기
                </div>
              </div>
            </div>

            {/* bottom actions */}
            <div className="px-7 pb-7 pt-5">
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setFlipped(v => !v)}
                  className="h-[56px] rounded-[18px] bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-lg active:scale-[0.99] transition flex items-center justify-center gap-2"
                >
                  <FlipIcon />
                  <span className="text-[14px]">{flipped ? '앞면' : '뒤집기'}</span>
                </button>

                <button
                  onClick={handleSpeak}
                  disabled={!word}
                  className="h-[56px] rounded-[18px] bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-50 dark:bg-white/10 dark:hover:bg-white/15 dark:text-gray-100"
                  title={ttsSpeaking ? '중지' : '발음 듣기'}
                >
                  <SpeakerIcon on={ttsSpeaking} />
                  <span className="text-[14px]">{ttsSpeaking ? '중지' : '발음'}</span>
                </button>

                <button
                  onClick={() => navigate('/voca')}
                  className="h-[56px] rounded-[18px] bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold active:scale-[0.99] transition flex items-center justify-center gap-2 dark:bg-white/10 dark:hover:bg-white/15 dark:text-gray-100"
                  title="단어장으로 이동"
                >
                  <VocabIcon />
                  <span className="text-[14px]">단어장</span>
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
