import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

export default function VocaPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState<VocabItem[]>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | VocabItem['status']>('all');

  const reload = () => setItems(loadVocab());

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
        (v.exampleTr ?? '').toLowerCase().includes(kw)
      );
    });
  }, [items, q, status]);

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
              className="shrink-0 px-4 py-2 rounded-xl ring-1 ring-gray-200 hover:ring-indigo-200 hover:bg-indigo-50 transition text-sm"
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
            placeholder="단어/뜻/예문 검색"
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
            onClick={() => {
              localStorage.removeItem(VOCAB_LS_KEY);
              reload();
            }}
            className="px-3 py-2 rounded-xl ring-1 ring-gray-200 hover:bg-gray-50 transition text-sm"
            title="단어장 초기화"
          >
            전체 삭제
          </button>
        </div>

        {/* 리스트 */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            저장된 단어가 없어요. <span className="text-indigo-600">학습 페이지</span>에서 단어를
            저장해보자.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map(v => (
              <div
                key={v.id}
                className="p-4 rounded-2xl ring-1 ring-gray-200 bg-white dark:bg-secondary"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-gray-900 dark:text-gray-100">{v.term}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">{v.meaning}</div>
                  </div>

                  <button
                    onClick={() => {
                      removeVocab(v.id);
                      reload();
                    }}
                    className="text-xs px-2 py-1 rounded-md ring-1 ring-gray-200 hover:bg-gray-50"
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
                      onClick={() => {
                        setVocabStatus(v.id, st);
                        reload();
                      }}
                      className={`text-[11px] px-2 py-1 rounded-full ring-1 transition ${
                        v.status === st
                          ? 'ring-indigo-200 bg-indigo-50 text-indigo-700'
                          : 'ring-gray-200 hover:ring-indigo-200'
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
    </div>
  );
}
