import type { EpisodeWord } from '@/components/study/EpisodeVocaModal';
import EpisodeVocabModal from '@/components/study/EpisodeVocaModal';
import { deleteMyVoca, fetchMyVoca, updateMyVocaStatus, type UserVocaRow } from '@/lib/userVoca';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type VocabItem = {
  id: string;
  term: string;
  meaning: string;
  exampleKo?: string;
  exampleTr?: string;
  pos?: string;
  pron?: string;
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

export default function StudyVocaPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState<VocabItem[]>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | VocabItem['status']>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialWordId, setInitialWordId] = useState<string | undefined>(undefined);

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

  useEffect(() => {
    reload();
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

  const modalWords: EpisodeWord[] = useMemo(() => {
    return filtered.map(v => ({
      id: v.id,
      ko: v.term,
      en: v.meaning,
      exampleKo: v.exampleKo,
      exampleEn: v.exampleTr,
      pos: v.pos,
      pron: v.pron,
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
    <div className="min-h-screen bg-white dark:bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-5">
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">단어장</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              저장한 단어를 모아볼 수 있어요.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => navigate('/studylist')}
              className="shrink-0 px-4 py-2 rounded-xl ring-1 ring-gray-200 hover:ring-primary/50 hover:bg-primary/20 transition text-sm"
            >
              ← 학습으로
            </button>
          </div>
        </div>

        {/* 검색/필터 */}
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
            onClick={async () => {
              try {
                await Promise.all(items.map(v => deleteMyVoca(v.id)));
                await reload();
              } catch (e) {
                console.error(e);
              }
            }}
            className="px-3 py-2 rounded-xl ring-1 ring-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 transition text-sm"
            title="단어장 초기화"
          >
            전체 삭제
          </button>
        </div>

        {/* 리스트 */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            저장된 단어가 없어요. <span className="text-primary">학습 페이지</span>에서 단어를
            저장해보아요.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map(v => (
              <div
                key={v.id}
                role="button"
                tabIndex={0}
                onClick={() => openModal(v.id)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') openModal(v.id);
                }}
                className="p-4 rounded-2xl ring-1 ring-gray-200 bg-white dark:bg-secondary cursor-pointer hover:bg-gray-50/60 dark:hover:bg-white/5 transition"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-gray-900 dark:text-gray-100">{v.term}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">{v.meaning}</div>

                    {/* pos/pron: 없어도 레이아웃 고정 */}
                    <div className="mt-1 min-h-[16px] text-[11px] text-gray-400">
                      {v.pos || v.pron ? (
                        <>
                          {v.pos ? `(${v.pos})` : ''}
                          {v.pron ? ` · ${v.pron}` : ''}
                        </>
                      ) : (
                        <span className="invisible">placeholder</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={async e => {
                      e.stopPropagation();
                      try {
                        await deleteMyVoca(v.id); // v.id == word_key
                        await reload();
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="text-xs px-2 py-1 rounded-md ring-1 ring-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    삭제
                  </button>
                </div>

                {(v.exampleKo || v.exampleTr) && (
                  <div className="mt-3 text-xs text-gray-500 space-y-1">
                    {v.exampleKo && <div>예문: {v.exampleKo}</div>}
                    {v.exampleTr && <div className="text-gray-400">{v.exampleTr}</div>}
                  </div>
                )}

                <div className="mt-3 flex items-center gap-1">
                  {(['unknown', 'learning', 'known'] as const).map(st => (
                    <button
                      key={st}
                      onClick={async e => {
                        e.stopPropagation();
                        try {
                          await updateMyVocaStatus(v.id, st); // v.id == word_key
                          await reload();
                        } catch (err) {
                          console.error(err);
                        }
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
            ))}
          </div>
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
    </div>
  );
}
