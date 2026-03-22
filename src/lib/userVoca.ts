import { supabase } from '@/lib/supabase';

export type VocaStatus = 'unknown' | 'learning' | 'known';

export type UserVocaRow = {
  id: string;
  user_id: string;
  word_key: string;

  term: string;
  meaning: string;
  example_ko?: string | null;
  example_tr?: string | null;
  pos?: string | null;
  pron?: string | null;
  image_url?: string | null;

  status: VocaStatus;
  wrong_count: number;

  source_study_path?: string | null;
  source_study_title?: string | null;
  source_episode_id?: string | null;
  source_episode_title?: string | null;

  created_at: string;
  updated_at: string;
};

async function requireUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const user = data.user;
  if (!user) throw new Error('로그인이 필요합니다.');
  return user.id;
}

export async function fetchMyVoca() {
  const user_id = await requireUserId();

  const { data: vocaRows, error: vocaError } = await supabase
    .from('user_voca')
    .select('*')
    .eq('user_id', user_id)
    .order('updated_at', { ascending: false });

  if (vocaError) throw vocaError;

  const rows = (vocaRows ?? []) as UserVocaRow[];

  if (rows.length === 0) return rows;

  // word_key가 "1:5" 같은 형식이면 뒤쪽 실제 word.id 추출
  const parsedWordIds = rows
    .map(row => {
      const raw = String(row.word_key ?? '').trim();
      if (!raw) return null;

      const last = raw.includes(':') ? raw.split(':').pop() : raw;
      if (!last) return null;

      const num = Number(last);
      return Number.isFinite(num) ? num : null;
    })
    .filter((v): v is number => v !== null);

  if (parsedWordIds.length === 0) {
    return rows.map(row => ({
      ...row,
      image_url: row.image_url ?? null,
      pron: row.pron ?? null,
    })) as UserVocaRow[];
  }

  try {
    const { data: wordRows, error: wordError } = await supabase
      .from('word')
      .select('id, image_url, pronunciation')
      .in('id', parsedWordIds);

    if (wordError) {
      console.error('word 정보 조회 실패:', wordError);
      return rows.map(row => ({
        ...row,
        image_url: row.image_url ?? null,
        pron: row.pron ?? null,
      })) as UserVocaRow[];
    }

    const wordMap = new Map(
      (wordRows ?? []).map(
        (w: { id: number; image_url?: string | null; pronunciation?: string | null }) => [
          String(w.id),
          {
            image_url: w.image_url ?? null,
            pronunciation: w.pronunciation ?? null,
          },
        ],
      ),
    );

    return rows.map(row => {
      const raw = String(row.word_key ?? '').trim();
      const last = raw.includes(':') ? (raw.split(':').pop() ?? '') : raw;
      const matched = wordMap.get(String(last));

      return {
        ...row,
        image_url: row.image_url ?? matched?.image_url ?? null,
        pron: row.pron ?? matched?.pronunciation ?? null,
      };
    }) as UserVocaRow[];
  } catch (err) {
    console.error('word 테이블 매핑 실패:', err);
    return rows.map(row => ({
      ...row,
      image_url: row.image_url ?? null,
      pron: row.pron ?? null,
    })) as UserVocaRow[];
  }
}

export async function upsertMyVoca(input: {
  word_key: string;

  term: string;
  meaning: string;
  example_ko?: string | null;
  example_tr?: string | null;
  pos?: string | null;
  pron?: string | null;
  image_url?: string | null;

  status?: VocaStatus;
  wrong_count?: number;

  source_study_path?: string | null;
  source_study_title?: string | null;
  source_episode_id?: string | null;
  source_episode_title?: string | null;
}) {
  const user_id = await requireUserId();

  const payload = {
    user_id,
    word_key: input.word_key,

    term: input.term,
    meaning: input.meaning,
    example_ko: input.example_ko ?? null,
    example_tr: input.example_tr ?? null,
    pos: input.pos ?? null,
    pron: input.pron ?? null,
    image_url: input.image_url ?? null,

    status: input.status ?? 'unknown',
    wrong_count: input.wrong_count ?? 0,

    source_study_path: input.source_study_path ?? null,
    source_study_title: input.source_study_title ?? null,
    source_episode_id: input.source_episode_id ?? null,
    source_episode_title: input.source_episode_title ?? null,

    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('user_voca')
    .upsert(payload, { onConflict: 'user_id,word_key' });

  if (error) throw error;
}

export async function deleteMyVoca(word_key: string) {
  const user_id = await requireUserId();

  const { error } = await supabase
    .from('user_voca')
    .delete()
    .eq('user_id', user_id)
    .eq('word_key', word_key);

  if (error) throw error;
}

export async function updateMyVocaStatus(word_key: string, status: VocaStatus) {
  const user_id = await requireUserId();

  const { error } = await supabase
    .from('user_voca')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('user_id', user_id)
    .eq('word_key', word_key);

  if (error) throw error;
}

export async function isSavedMyVoca(word_key: string) {
  const user_id = await requireUserId();

  const { data, error } = await supabase
    .from('user_voca')
    .select('word_key')
    .eq('user_id', user_id)
    .eq('word_key', word_key)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}
