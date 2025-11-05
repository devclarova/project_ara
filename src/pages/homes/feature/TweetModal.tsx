// src/pages/homes/feature/TweetModal.tsx
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import RichTextEditor from '../editor/RichTextEditor';
import { toast } from 'sonner';

interface TweetModalProps {
  onClose: () => void;
  onTweetCreated?: (tweet: any) => void;
}

export default function TweetModal({ onClose, onTweetCreated }: TweetModalProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ 이미지 배열 업데이트
  const handleImagesChange = useCallback((files: File[]) => {
    setImages(files);
  }, []);

  // ✅ 파일명 안전하게 변환 (중복 확장자 방지)
  const safeFileName = (name: string) => {
    const clean = name.replace(/\s+/g, '_').replace(/[^\w\-_.]/g, '_');
    const ext = clean.split('.').pop() ?? 'jpg';
    const base = clean.replace(/\.[^/.]+$/, ''); // 기존 확장자 제거
    return `${base.slice(0, 50)}.${ext}`;
    
  };

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalContent = content;

      // ✅ 이미지 업로드
      if (images.length > 0) {
        const blobUrls = finalContent.match(/blob:[^"'\s]+/g) || [];

        for (let i = 0; i < blobUrls.length && i < images.length; i++) {
          const file = images[i];
          const blobUrl = blobUrls[i];
          const timestamp = Date.now() + i;
          const fileName = `${user.id}_${timestamp}_${safeFileName(file.name)}`;
          const filePath = `tweet_images/${user.id}/${fileName}`.replace(/^\/+/, '');

          // ✅ Supabase Storage 업로드
          const { error: uploadError } = await supabase.storage
            .from('tweet_media') // ✅ bucket 이름
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadError) {
            console.error('❌ 업로드 실패:', uploadError.message);
            continue;
          }

          // ✅ public URL 가져오기
          const { data: urlData } = await supabase.storage
            .from('tweet_media')
            .getPublicUrl(filePath);

          if (urlData?.publicUrl) {
            finalContent = finalContent.replace(blobUrl, urlData.publicUrl);
          }
        }
      }

      // ✅ 프로필 ID 조회 (user.id → profiles.id)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, nickname, user_id, avatar_url')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        alert('⚠️ 프로필이 존재하지 않습니다. 먼저 프로필을 생성해주세요.');
        setIsSubmitting(false);
        return;
      }

      // ✅ tweets 테이블에 저장
      const { data, error: insertError } = await supabase
        .from('tweets')
        .insert([
          {
            author_id: profile.id,
            content: finalContent,
          },
        ])
        .select(
          `
          id,
          content,
          created_at,
          image_url,
          profiles:author_id (
            nickname,
            user_id,
            avatar_url
          )
        `,
        )
        .single();

      if (insertError) {
        console.error('❌ 트윗 저장 실패:', insertError.message);
        alert('트윗 저장 중 오류가 발생했습니다.');
        return;
      }

      // ✅ 상위(Home)로 전달할 새 트윗 객체 구성
      const newTweet = {
        id: data.id,
        user: {
          name: data.profiles?.nickname || 'Unknown',
          username: data.profiles?.user_id || 'anonymous',
          avatar: data.profiles?.avatar_url || '/default-avatar.svg',
        },
        content: data.content,
        image: data.image_url || '',
        timestamp: new Date(data.created_at).toLocaleString('ko-KR', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        stats: { replies: 0, retweets: 0, likes: 0, views: 0 },
      };

      onTweetCreated?.(newTweet);
      // alert('트윗이 성공적으로 업로드되었습니다!');
      toast.success('트윗이 성공적으로 업로드되었습니다!');
      onClose();
    } catch (err) {
      console.error('⚠️ 트윗 업로드 오류:', err);
      alert('트윗 업로드 중 문제가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg mx-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Compose Tweet</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
          >
            <i className="ri-close-line text-xl text-gray-600"></i>
          </button>
        </div>

        {/* Editor */}
        <div className="p-4">
          <RichTextEditor
            value={content}
            onChange={setContent}
            onImagesChange={handleImagesChange}
            placeholder="What's happening?"
          />

          {/* Submit Button */}
          <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
              className="bg-primary hover:bg-primary/80 disabled:bg-gray-300 text-white font-bold px-6 py-2 rounded-full"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Posting...</span>
                </div>
              ) : (
                'Tweet'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
