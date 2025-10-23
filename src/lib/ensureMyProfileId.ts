import { supabase } from './supabase';

/**
 * 내 프로필의 ID(profiles.id)를 보장해서 반환하는 함수
 * - auth.users.id 기반으로 profiles를 조회
 * - 없으면 새로 생성
 * - 반환값: profiles.id (FK로 쓰는 값)
 */
export async function ensureMyProfileId(): Promise<string> {
  // 1️⃣ 현재 세션 사용자 정보 가져오기
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userRes.user) throw userErr ?? new Error('No auth user');
  const authId = userRes.user.id;

  // 2️⃣ profiles 테이블에서 user_id = authId 검색
  const { data: prof, error: selErr } = await supabase
    .from('profiles')
    .select('id, user_id')
    .eq('user_id', authId)
    .maybeSingle();

  if (selErr) throw selErr;

  // 이미 있으면 그 ID 반환
  if (prof?.id) return prof.id as string;

  // 3️⃣ 없으면 새 프로필 생성
  //    id를 authId로 넣을지 여부는 스키마에 따라 다르지만,
  //    id 컬럼이 UUID이면 그대로 authId로 넣는 게 제일 깔끔합니다.
  const insertRow = {
    id: authId,
    user_id: authId,
    nickname: '사용자',
    avatar_url: null,
  };

  const { data: created, error: insErr } = await supabase
    .from('profiles')
    .insert([insertRow])
    .select('id')
    .single();

  if (insErr) throw insErr;
  if (!created?.id) throw new Error('프로필 생성 실패');

  return created.id as string;
}
