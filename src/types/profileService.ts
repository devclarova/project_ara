import { supabase } from '@/lib/supabase';

export async function getSessionUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function fetchMyProfileRow(uid: string) {
  // 필요한 컬럼만 골라 와도 좋지만, MVP는 * 로 단순화
  const { data, error } = await supabase.from('profiles').select('*').eq('user_id', uid).single();

  if (error) return null;
  return data;
}

export async function seedProfileIfMissing(uid: string) {
  const { data: auth } = await supabase.auth.getUser();
  const seed = {
    user_id: uid,
    nickname: auth.user?.email?.split('@')[0] ?? 'user',
    country: '대한민국',
    is_public: true,
  };
  const { data, error } = await supabase
    .from('profiles')
    .upsert(seed, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) return null;
  return data;
}

export type SaveForm = {
  name?: string;
  bio?: string;
  birth?: string;
  gender?: string;
  country?: string;
  avatarUrl?: string;
};

export async function upsertMyProfile(uid: string, form: SaveForm, raw?: any) {
  const payload: any = {
    user_id: uid,
    nickname: form.name ?? raw?.nickname ?? null,
    bio: form.bio ?? raw?.bio ?? null,
    birthday: form.birth ?? raw?.birthday ?? null,
    gender: form.gender ?? raw?.gender ?? null,
    country: form.country ?? raw?.country ?? null,
    avatar_url: form.avatarUrl ?? raw?.avatar_url ?? null,
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) return null;
  return data;
}
