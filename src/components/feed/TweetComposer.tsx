// src\components\feed\TweetComposer.tsx
import { useEffect, useRef, useState } from 'react';
import { Image, FileVideo, Smile, BarChart3, Calendar, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface TweetComposerProps {
  onPost: (tweet: any) => void;
}

export default function TweetComposer({ onPost }: TweetComposerProps) {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // ✅ input 초기화용 ref
  const { user } = useAuth();

  // ✅ 유저 프로필 아바타 가져오기
  useEffect(() => {
    if (!user) return;
    console.log('current user id:', user.id);

    async function fetchAvatar() {
      if (!user) return; // user 없으면 실행 안 함 (단, Hook 순서는 유지됨)
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('user_id', user.id)
        .single();
      setAvatarUrl(data?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=You');
    }
    fetchAvatar();
  }, [user]);

  // ✅ textarea 자동 높이 조정
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [content]);

  // ✅ 파일 선택 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
  };

  // ✅ 파일 삭제 (선택된 파일 비우기)
  const handleRemoveFiles = () => {
    setFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // input 완전 초기화
    }
  };

  // ✅ 게시글 업로드
  const handlePost = async () => {
    if (!user || !content.trim()) return;
    setLoading(true);
    try {
      const { data: tweet } = await supabase
        .from('tweets')
        .insert([{ author_id: user.id, content }])
        .select()
        .single();

      const mediaRecords: any[] = [];
      for (const file of files) {
        const filePath = `${user.id}/${tweet.id}/${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('tweet_media')
          .upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage.from('tweet_media').getPublicUrl(filePath);

        await supabase.from('tweet_media').insert([
          {
            tweet_id: tweet.id,
            type: file.type.startsWith('video/')
              ? 'video'
              : file.name.endsWith('.gif')
                ? 'gif'
                : 'image',
            url: publicData.publicUrl,
          },
        ]);

        mediaRecords.push({
          type: file.type.startsWith('video/')
            ? 'video'
            : file.name.endsWith('.gif')
              ? 'gif'
              : 'image',
          url: publicData.publicUrl,
        });
      }

      onPost({
        ...tweet,
        profiles: { nickname: 'You', avatar_url: avatarUrl },
        tweet_media: mediaRecords,
      });

      setContent('');
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('❌ Error posting tweet:', err);
      alert('게시 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-b border-gray-200 p-4">
      {!user ? (
        <div className="text-center text-gray-500 py-6">
          로그인 후 게시글을 작성할 수 있습니다 💬
        </div>
      ) : (
        <div className="flex space-x-3">
          <img
            src={avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=You'}
            alt="Your avatar"
            className="w-12 h-12 rounded-full object-cover border"
          />

          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="무슨 일이 일어나고 있나요?"
              rows={3}
              className="w-full text-xl placeholder-gray-500 border-none resize-none outline-none bg-transparent"
            />

            {files.length > 0 && (
              <div className="mt-3 relative">
                {/* ✅ 전체 삭제 버튼 */}
                <button
                  onClick={handleRemoveFiles}
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white text-gray-700 rounded-full p-1 shadow-sm"
                >
                  <X size={18} />
                </button>

                <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden border">
                  {files.map((file, i) => (
                    <img
                      key={i}
                      src={URL.createObjectURL(file)}
                      alt="preview"
                      className="object-cover w-full max-h-64 rounded-xl border"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-4">
              <div className="flex space-x-3 text-primary">
                <label className="hover:bg-blue-50 p-2 rounded-full transition cursor-pointer">
                  <Image size={18} />
                  <input
                    ref={fileInputRef} // ✅ ref 연결
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>

                <button className="hover:bg-blue-50 p-2 rounded-full transition">
                  <FileVideo size={18} />
                </button>
                <button className="hover:bg-blue-50 p-2 rounded-full transition">
                  <Smile size={18} />
                </button>
                <button className="hover:bg-blue-50 p-2 rounded-full transition">
                  <BarChart3 size={18} />
                </button>
                <button className="hover:bg-blue-50 p-2 rounded-full transition">
                  <Calendar size={18} />
                </button>
              </div>

              <button
                disabled={!content.trim() || loading}
                onClick={handlePost}
                className={`font-bold py-2 px-6 rounded-full text-white transition-colors ${
                  content.trim() && !loading
                    ? 'bg-primary hover:bg-blue-600'
                    : 'bg-primary opacity-50 cursor-not-allowed'
                }`}
              >
                {loading ? '게시 중...' : '게시하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
