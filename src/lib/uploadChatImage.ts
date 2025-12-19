import { supabase } from '@/lib/supabase';

export async function uploadChatImage(file: File, chatId: string, userId: string) {
  // 1. 확장자 추출
  const ext = file.name.split('.').pop();

  // 2. 저장 경로 (정석 구조)
  const path = `dm/${chatId}/${userId}/${crypto.randomUUID()}.${ext}`;

  // 3. 업로드 (버킷명 정확히!)
  const { error } = await supabase.storage.from('chat_attachments').upload(path, file, {
    upsert: false,
    contentType: file.type,
  });

  if (error) {
    console.error('이미지 업로드 실패:', error);
    throw error;
  }

  // 4. Public URL 생성
  const { data } = supabase.storage.from('chat_attachments').getPublicUrl(path);

  return data.publicUrl;
}
