import { supabase } from '@/lib/supabase';

export async function uploadProfileImage(
  userId: string,
  file: File,
  folder: 'avatars' | 'banners',
) {
  const ext = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${ext}`;
  const filePath = `${folder}/${fileName}`;

  const { error } = await supabase.storage
    .from('tweet_media')
    .upload(filePath, file, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from('tweet_media').getPublicUrl(filePath);

  return data.publicUrl;
}
