// ✅ src/pages/homes/feature/ReplyModal.tsx (수정본)
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import RichTextEditor from '../editor/RichTextEditor';
import { toast } from 'sonner';

interface ReplyModalProps {
  tweetId: string; // ✅ 부모 트윗 ID
  onClose: () => void;
}

export default function ReplyModal({ tweetId, onClose }: ReplyModalProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImagesChange = useCallback((files: File[]) => {
    setImages(files);
  }, []);

  const safeFileName = (name: string) => {
    const base = name.replace(/\s+/g, '_').replace(/[^\w\-_.]/g, '_').replace(/_+/g, '_');
    const ext = name.split('.').pop() || 'jpg';
    return `${base.slice(0, 50)}.${ext}`;
  };

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;
    if (!user) {
      toast.error('로그인이 필요합니다.');
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
          const filePath = `reply_images/${user.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('tweet_media')
            .upload(filePath, file, { cacheControl: '3600', upsert: false });
          if (uploadError) {
            console.error('❌ 업로드 실패:', uploadError.message);
            continue;
          }

          const { data: urlData } = await supabase.storage
            .from('tweet_media')
            .getPublicUrl(filePath);
          finalContent = finalContent.replace(blobUrl, urlData.publicUrl);
        }
      }

      // ✅ profiles.id 조회
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        toast.error('⚠️ 프로필이 존재하지 않습니다.');
        setIsSubmitting(false);
        return;
      }

      // ✅ 댓글 저장 (onReplyCreated 제거)
      const { error: insertError } = await supabase.from('tweet_replies').insert([
        {
          tweet_id: tweetId,
          author_id: profile.id,
          content: finalContent,
        },
      ]);

      if (insertError) {
        console.error('❌ 댓글 저장 실패:', insertError.message);
        toast.error('댓글 저장 중 오류가 발생했습니다.');
        return;
      }

      // ✅ 성공 토스트만 띄우고, 나머지는 Realtime이 처리
      toast.success('댓글이 성공적으로 업로드되었습니다!');
      onClose();
    } catch (err) {
      console.error('⚠️ 댓글 업로드 오류:', err);
      toast.error('댓글 업로드 중 문제가 발생했습니다.');
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
          <h2 className="text-lg font-bold text-gray-900">Reply to Tweet</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
          >
            <i className="ri-close-line text-xl text-gray-600"></i>
          </button>
        </div>

        {/* RichTextEditor */}
        <div className="p-4">
          <RichTextEditor
            value={content}
            onChange={setContent}
            onImagesChange={handleImagesChange}
            placeholder="Write your reply..."
          />

          {/* 하단 버튼 */}
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
                'Reply'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
