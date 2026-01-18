import { supabase } from './supabase';

/**
 * 내 프로필의 ID(profiles.id)를 보장해서 반환하는 함수
 * - auth.users.id 기반으로 profiles를 조회
 * - 없으면 새로 생성
 * - 반환값: profiles.id (FK로 쓰는 값)
 */
// 메모리 캐싱을 위한 변수
let cachedAuthId: string | null = null;
let cachedProfileId: string | null = null;

export async function ensureMyProfileId(): Promise<string> {
  // 1️⃣ 현재 세션 사용자 정보 가져오기
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userRes.user) throw userErr ?? new Error('No auth user');
  const authId = userRes.user.id;

  // 캐시된 ID가 있고, 현재 로그인한 사용자와 같다면 바로 반환
  if (cachedAuthId === authId && cachedProfileId) {
    return cachedProfileId;
  }

  // 2️⃣ profiles 테이블에서 user_id = authId 검색
  const { data: prof, error: selErr } = await supabase
    .from('profiles')
    .select('id, user_id')
    .eq('user_id', authId)
    .maybeSingle();

  if (selErr) throw selErr;

  // 이미 있으면 그 ID 반환 (캐시 업데이트)
  if (prof?.id) {
    cachedAuthId = authId;
    cachedProfileId = prof.id;
    return prof.id as string;
  }

  // 3️⃣ 없으면 새 프로필 생성 (Race condition 방지를 위해 Upsert or Retry)
  const randomNickname = `user_${authId.slice(0, 8)}`;
  const insertRow = {
    id: authId,
    user_id: authId,
    nickname: randomNickname,
    avatar_url: null,
    gender: 'Male',
    birthday: '2000-01-01',
    country: 'Unknown',
  };

  // Trigger 충돌 방지를 위해, INSERT 실패시 무시하고 재조회
  const { data: created, error: insErr } = await supabase
    .from('profiles')
    .upsert(insertRow, { onConflict: 'user_id', ignoreDuplicates: true })
    .select('id')
    .maybeSingle(); // .single() 대신 maybeSingle 사용

  if (insErr) {
    // 409 Conflict 등 에러 발생 시, 단순히 다시 조회 시도
    console.warn('[ensureMyProfileId] Upsert error (likely race condition), retrying fetch...', insErr);
  }

  // 생성 후 또는 무시 후 다시 조회 (확실한 ID 확보)
  if (created?.id) {
    cachedAuthId = authId;
    cachedProfileId = created.id;
    return created.id;
  }

  // 재조회
  const { data: retryProf } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', authId)
    .maybeSingle();

  if (retryProf?.id) {
    cachedAuthId = authId;
    cachedProfileId = retryProf.id;
    return retryProf.id;
  }
  
  throw new Error('프로필을 불러오거나 생성할 수 없습니다.');

}
