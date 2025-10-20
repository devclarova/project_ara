// src/components/TweetComposer.tsx
import { useEffect, useRef, useState } from 'react';
import { Image, BarChart3, Smile, Calendar, FileVideo } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface TweetComposerProps {
  onPost: (content: string, image_url?: string | null) => Promise<void>;
}

export default function TweetComposer({ onPost }: TweetComposerProps) {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();

  // ✅ 로그인한 유저의 아바타 가져오기
  useEffect(() => {
    async function fetchAvatar() {
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      } else {
        // 기본 아바타
        setAvatarUrl('https://api.dicebear.com/7.x/avataaars/svg?seed=You');
      }
    }

    fetchAvatar();
  }, [user]);

  // ✅ textarea 자동 높이 조정
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [content]);

  // ✅ Supabase 게시글 등록
  const handlePost = async () => {
    if (!content.trim() || !user) return;
    setLoading(true);
    console.log('🚀 handlePost called with content:', content);
    try {
      await onPost(content, imageUrl);
      setContent('');
      setImageUrl(null);
    } catch (error) {
      console.error('❌ Error posting tweet:', error);
      alert('게시 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-b border-gray-200 p-4">
      <div className="flex space-x-3">
        {/* ✅ Supabase 프로필 아바타 반영 */}
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

          {imageUrl && (
            <div className="mt-3 rounded-xl overflow-hidden border">
              <img src={imageUrl} alt="preview" className="object-cover w-full max-h-64" />
            </div>
          )}

          <div className="flex items-center justify-between mt-4">
            <div className="flex space-x-3 text-primary">
              {[Image, FileVideo, BarChart3, Smile, Calendar].map((Icon, i) => (
                <button
                  key={i}
                  type="button"
                  className="hover:bg-blue-50 p-2 rounded-full transition"
                >
                  <Icon size={18} />
                </button>
              ))}
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
    </div>
  );
}
