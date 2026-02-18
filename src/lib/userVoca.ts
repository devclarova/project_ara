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

  const { data, error } = await supabase
    .from('user_voca')
    .select('*')
    .eq('user_id', user_id)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as UserVocaRow[];
}

export async function upsertMyVoca(input: {
  word_key: string;

  term: string;
  meaning: string;
  example_ko?: string | null;
  example_tr?: string | null;
  pos?: string | null;
  pron?: string | null;

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

/** user_id 조건 반드시 포함 */
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
