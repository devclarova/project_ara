import { supabase } from '../lib/supabase';

export async function chatOpenCreate(currentUserId: string, targetUserId: string) {
  if (!currentUserId || !targetUserId) throw new Error('invalid user ids');
  if (currentUserId === targetUserId) throw new Error('cannot open self chat');

  // user1/user2 정렬 (UNIQUE (least, greatest) 제약과 일치)
  const u1 = currentUserId < targetUserId ? currentUserId : targetUserId;
  const u2 = currentUserId < targetUserId ? targetUserId : currentUserId;

  // 1) 기존 방 조회
  const { data: exists, error: selErr } = await supabase
    .from('chats')
    .select('id')
    .eq('user1_id', u1)
    .eq('user2_id', u2)
    .maybeSingle();

  if (selErr) throw selErr;

  // 2) 없으면 생성
  const { data: created, error: insErr } = await supabase
    .from('chats')
    .insert([{ user1_id: u1, user2_id: u2 }])
    .select('id')
    .single();

  if (insErr) throw insErr;
  return created!.id;
}
