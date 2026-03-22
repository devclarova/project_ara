import type { EpisodeWord } from '@/components/study/EpisodeVocaModal';
import EpisodeVocabModal from '@/components/study/EpisodeVocaModal';
import MatchingQuizModal from '@/components/study/MatchingQuizModal';
import McqQuizModal from '@/components/study/McqQuizModal';
import OxQuizModal from '@/components/study/OxQuizModal';
import QuizMenuModal from '@/components/study/QuizMenuModal';
import ConfirmModal from '@/components/common/ConfirmModal';
import Pagination from '@/components/common/Pagination';
import { deleteMyVoca, fetchMyVoca, updateMyVocaStatus, type UserVocaRow } from '@/lib/userVoca';
import { useAutoTranslation } from '@/hooks/useAutoTranslation';
import { ArrowLeft, Gamepad2, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

type VocabItem = {
  id: string;
  term: string;
  meaning: string;
  exampleKo?: string;
  exampleTr?: string;
  pos?: string;
  pron?: string;
  image_url?: string | null;
  status: 'unknown' | 'learning' | 'known';
  wrongCount: number;
  createdAt: string;
  updatedAt: string;

  sourceEpisodeId?: string;
  sourceEpisodeTitle?: string;

  sourceStudyPath?: string;
  sourceStudyTitle?: string;
};

const VOCAB_LS_KEY = 'ara_vocab_mock_v1';

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

function removeVocab(id: string) {
  const items = loadVocab();
  saveVocab(items.filter(v => v.id !== id));
}

function setVocabStatus(id: string, status: VocabItem['status']) {
  const items = loadVocab();
  const out = items.map(v =>
    v.id === id ? { ...v, status, updatedAt: new Date().toISOString() } : v,
  );
  saveVocab(out);
}

type VocabCardProps = {
  v: VocabItem;
  onOpen: () => void;
  onDelete: () => void;
  onChangeStatus: (status: VocabItem['status']) => void;
};

function VocabCard({ v, onOpen, onDelete, onChangeStatus }: VocabCardProps) {
  const { i18n } = useTranslation();
  const targetLang = i18n.language || 'en';
  const isKorean = targetLang.toLowerCase().startsWith('ko');

  const meaningSrc = v.meaning ?? '';
  const exampleKoSrc = v.exampleKo ?? '';
  const exampleTrSrc = v.exampleTr ?? '';
  const posSrc = v.pos ?? '';

  const { translatedText: translatedMeaning } = useAutoTranslation(
    meaningSrc,
    `voca_page_meaning_${v.id}`,
    targetLang,
  );

  const { translatedText: translatedExampleKo } = useAutoTranslation(
    exampleKoSrc,
    `voca_page_example_ko_${v.id}`,
    targetLang,
  );

  const { translatedText: translatedPos } = useAutoTranslation(
    posSrc,
    `voca_page_pos_${v.id}`,
    targetLang,
  );

  const displayMeaning = isKorean ? meaningSrc : translatedMeaning?.trim() || meaningSrc;
  const displayExample = isKorean
    ? exampleKoSrc || exampleTrSrc
    : translatedExampleKo?.trim() || exampleTrSrc || exampleKoSrc;
  const displayPos = isKorean ? posSrc : translatedPos?.trim() || posSrc;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') onOpen();
      }}
      className="p-4 rounded-2xl ring-1 ring-gray-200 bg-white dark:bg-secondary cursor-pointer hover:bg-gray-50/60 dark:hover:bg-white/5 transition"
    >
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="font-bold text-gray-900 dark:text-gray-100 truncate">{v.term}</div>

            {v.pron && (
              <div className="text-[11px] text-gray-400 whitespace-nowrap">[{v.pron}]</div>
            )}
          </div>
          <div className="mt-1 min-h-[16px] text-[11px] text-gray-400">
            {displayPos ? `(${displayPos})` : ''}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">{displayMeaning}</div>
        </div>

        <button
          onClick={e => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1.5 rounded-md ring-1 ring-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 transition"
          aria-label="삭제"
          title="삭제"
        >
          <Trash2 size={14} className="text-gray-500" />
        </button>
      </div>

      {displayExample && (
        <div className="mt-3 text-xs text-gray-500 space-y-1">
          <div>예문: {displayExample}</div>
        </div>
      )}

      <div className="mt-3 flex items-center gap-1">
        {(['unknown', 'learning', 'known'] as const).map(st => (
          <button
            key={st}
            onClick={e => {
              e.stopPropagation();
              onChangeStatus(st);
            }}
            className={`text-[11px] px-2 py-1 rounded-full ring-1 transition ${
              v.status === st
                ? 'ring-primary/60 bg-primary-50 text-primary'
                : 'ring-primary/60 hover:ring-primary'
            }`}
          >
            {st}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function StudyVocaPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState<VocabItem[]>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | VocabItem['status']>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialWordId, setInitialWordId] = useState<string | undefined>(undefined);

  const [quizMenuOpen, setQuizMenuOpen] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<null | 'mcq' | 'ox' | 'matching'>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmType, setConfirmType] = useState<'single' | 'all' | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);

  const matchingPool = useMemo(() => items.filter(v => (v.wrongCount ?? 0) > 0), [items]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  useEffect(() => {
    document.title = '단어장 | ARA';
  }, []);

  const reload = async () => {
    const rows = await fetchMyVoca();

    setItems(
      rows.map((r: UserVocaRow) => ({
        id: r.word_key,
        term: r.term,
        meaning: r.meaning,
        exampleKo: r.example_ko ?? undefined,
        exampleTr: r.example_tr ?? undefined,
        pos: r.pos ?? undefined,
        pron: r.pron ?? undefined,
        image_url: r.image_url ?? undefined,
        status: r.status,
        wrongCount: r.wrong_count,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        sourceStudyPath: r.source_study_path ?? undefined,
        sourceStudyTitle: r.source_study_title ?? undefined,
        sourceEpisodeId: r.source_episode_id ?? undefined,
        sourceEpisodeTitle: r.source_episode_title ?? undefined,
      })),
    );
  };

  const handleDeleteOne = async (id: string) => {
    try {
      await deleteMyVoca(id);
      await reload();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAll = async () => {
    try {
      await Promise.all(items.map(v => deleteMyVoca(v.id)));
      await reload();
    } catch (err) {
      console.error(err);
    }
  };

  const openDeleteConfirm = (id: string) => {
    setConfirmType('single');
    setTargetId(id);
    setConfirmOpen(true);
  };

  const openDeleteAllConfirm = () => {
    setConfirmType('all');
    setTargetId(null);
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
    setConfirmType(null);
    setTargetId(null);
  };

  const handleConfirmDelete = async () => {
    if (confirmType === 'single' && targetId) {
      await handleDeleteOne(targetId);
    }

    if (confirmType === 'all') {
      await handleDeleteAll();
    }

    closeConfirm();
  };

  useEffect(() => {
    reload();
  }, []);

  useEffect(() => {
    const updatePageSize = () => {
      const width = window.innerWidth;

      if (width < 640) {
        setPageSize(4);
        return;
      }

      if (width < 1024) {
        setPageSize(6);
        return;
      }

      setPageSize(9);
    };

    updatePageSize();
    window.addEventListener('resize', updatePageSize);
    return () => window.removeEventListener('resize', updatePageSize);
  }, []);

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();

    return items.filter(v => {
      const okStatus = status === 'all' ? true : v.status === status;
      if (!okStatus) return false;
      if (!kw) return true;

      return (
        v.term.toLowerCase().includes(kw) ||
        v.meaning.toLowerCase().includes(kw) ||
        (v.exampleKo ?? '').toLowerCase().includes(kw) ||
        (v.exampleTr ?? '').toLowerCase().includes(kw) ||
        (v.pos ?? '').toLowerCase().includes(kw) ||
        (v.pron ?? '').toLowerCase().includes(kw)
      );
    });
  }, [items, q, status]);

  useEffect(() => {
    setPage(1);
  }, [q, status]);

  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filtered.slice(start, end);
  }, [filtered, page, pageSize]);

  useEffect(() => {
    if (totalPages === 0) {
      if (page !== 1) setPage(1);
      return;
    }
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const modalWords: EpisodeWord[] = useMemo(() => {
    return filtered.map(v => ({
      id: v.id,
      ko: v.term,
      en: v.meaning,
      exampleKo: v.exampleKo,
      exampleEn: v.exampleTr,
      pos: v.pos,
      pron: v.pron,
      pronKo: v.pron,
      image_url: v.image_url ?? undefined,
      imageEmoji: '📌',
      difficulty: 2,
    }));
  }, [filtered]);

  const openModal = (id: string) => {
    setInitialWordId(id);
    setIsModalOpen(true);
  };

  const getEpisodeHref = (w: EpisodeWord) => {
    const v = items.find(x => x.id === String(w.id));
    return v?.sourceStudyPath ?? null;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-background relative">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">단어장</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              저장한 단어를 모아볼 수 있어요.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setQuizMenuOpen(true)}
              className="shrink-0 px-4 py-2 rounded-xl ring-1 ring-gray-200 hover:ring-primary/50 hover:bg-primary/20 transition text-sm flex items-center gap-2"
            >
              <Gamepad2 size={16} />
              퀴즈
            </button>

            <button
              onClick={() => navigate('/studylist')}
              className="shrink-0 px-4 py-2 rounded-xl ring-1 ring-gray-200 hover:ring-primary/50 hover:bg-primary/20 transition text-sm flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              학습으로
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="단어/뜻/예문/품사/발음 검색"
            className="flex-1 px-3 py-2 rounded-xl ring-1 ring-gray-200 bg-white dark:bg-secondary"
          />
          <select
            value={status}
            onChange={e => setStatus(e.target.value as any)}
            className="px-3 py-2 rounded-xl ring-1 ring-gray-200 bg-white dark:bg-secondary"
          >
            <option value="all">전체</option>
            <option value="unknown">unknown</option>
            <option value="learning">learning</option>
            <option value="known">known</option>
          </select>

          <button
            onClick={openDeleteAllConfirm}
            className="px-3 py-2 rounded-xl ring-1 ring-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 transition text-sm"
            title="단어장 초기화"
          >
            전체 삭제
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            저장된 단어가 없어요.
            <Link
              to="/studylist"
              className="text-primary font-medium underline underline-offset-2 hover:text-primary/80"
            >
              학습 페이지
            </Link>
            에서 단어를 저장해보아요.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-4">
              {paginated.map(v => (
                <VocabCard
                  key={v.id}
                  v={v}
                  onOpen={() => openModal(v.id)}
                  onDelete={() => openDeleteConfirm(v.id)}
                  onChangeStatus={async st => {
                    try {
                      await updateMyVocaStatus(v.id, st);
                      await reload();
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination
                totalPages={totalPages}
                page={page}
                onPageChange={setPage}
                windowSize={5}
                autoScrollTop={true}
              />
            )}
          </>
        )}
      </div>

      <EpisodeVocabModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        words={modalWords}
        initialWordId={initialWordId}
        getEpisodeHref={getEpisodeHref}
        episodeCtaLabel="에피소드로"
      />

      <QuizMenuModal
        isOpen={quizMenuOpen}
        onClose={() => setQuizMenuOpen(false)}
        totalCount={items.length}
        matchingCount={matchingPool.length}
        pool={items}
      />

      {activeQuiz === 'mcq' && (
        <McqQuizModal isOpen onClose={() => setActiveQuiz(null)} pool={items} />
      )}

      {activeQuiz === 'ox' && (
        <OxQuizModal isOpen onClose={() => setActiveQuiz(null)} pool={items} />
      )}

      {activeQuiz === 'matching' && (
        <MatchingQuizModal isOpen onClose={() => setActiveQuiz(null)} pool={matchingPool} />
      )}

      <ConfirmModal
        open={confirmOpen}
        title={confirmType === 'single' ? '단어 삭제' : '전체 삭제'}
        description={
          confirmType === 'single' ? '단어를 삭제하시겠습니까?' : '전체 단어를 삭제하시겠습니까?'
        }
        confirmText="삭제"
        cancelText="취소"
        onConfirm={handleConfirmDelete}
        onCancel={closeConfirm}
      />
    </div>
  );
}
