import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Image } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface InlineReplyEditorProps {
  tweetId: string;
  // 새로 생성된 댓글 id를 부모(TweetDetail)로 올려주는 콜백 (추가)
  onReplyCreated?: (replyId: string) => void;
}

export default function InlineReplyEditor({ tweetId, onReplyCreated }: InlineReplyEditorProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [value, setValue] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 내 아바타 불러오기
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        setProfileAvatar(data.avatar_url);
      }
    };
    loadProfile();
  }, [user]);

  const safeFileName = (name: string) => {
    const parts = name.split('.');
    const ext = parts.length > 1 ? parts.pop() || 'jpg' : 'jpg';
    const base = parts.join('.');

    const cleanedBase = base
      .replace(/\s+/g, '_')
      .replace(/[^\w\-_.]/g, '_')
      .replace(/_+/g, '_');

    return `${cleanedBase.slice(0, 50)}.${ext}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    // 필요하면 개수 제한도 가능 (예: 최대 4장)
    setFiles(selected);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error(t('auth.login_needed'));
      return;
    }
    if (!value.trim() && files.length === 0) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // profiles.id 조회
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError || !profile) {
        toast.error(t('common.error_profile_load'));
        setIsSubmitting(false);
        return;
      }

      let finalContent = value.trim();

      // 이미지 업로드 후 <img> 태그를 content 뒤에 붙이기
      if (files.length > 0) {
        const imgTags: string[] = [];

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const timestamp = Date.now() + i;
          const fileName = `${user.id}_${timestamp}_${safeFileName(file.name)}`;
          const filePath = `reply_images/${user.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('tweet_media')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadError) {
            console.error('이미지 업로드 실패:', uploadError.message);
            // 일부만 실패해도 나머지는 계속 시도
            continue;
          }

          const { data: urlData } = await supabase.storage
            .from('tweet_media')
            .getPublicUrl(filePath);

          const publicUrl = urlData.publicUrl;

          imgTags.push(`<img src="${publicUrl}" alt="reply image" />`);
        }

        if (imgTags.length > 0) {
          // 텍스트가 있으면 줄바꿈 추가 후 이미지들 붙이기
          if (finalContent) {
            finalContent += '<br />' + imgTags.join('<br />');
          } else {
            finalContent = imgTags.join('<br />');
          }
        }
      }

      if (!finalContent.trim()) {
        toast.error(t('common.error_empty_content'));
        setIsSubmitting(false);
        return;
      }

      // 댓글 insert 시 새로 생성된 id까지 함께 받아오기 (수정 포인트 ①)
      const { data: inserted, error: insertError } = await supabase
        .from('tweet_replies')
        .insert({
          tweet_id: tweetId,
          author_id: profile.id,
          content: finalContent,
        })
        .select('id')
        .single();

      if (insertError || !inserted) {
        console.error('댓글 저장 실패:', insertError?.message);
        toast.error(t('tweets.error_reply_save'));
        setIsSubmitting(false);
        return;
      }

      // 부모(TweetDetail)에게 "이 댓글로 스크롤해"라고 id 전달 (수정 포인트 ②)
      if (onReplyCreated && inserted.id) {
        onReplyCreated(inserted.id);
      }

      // Realtime으로 리스트는 자동 갱신되니까 초기화만
      setValue('');
      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast.success(t('tweets.success_reply_posted'));
    } catch (err) {
      console.error('댓글 등록 오류:', err);
      toast.error(t('tweets.error_reply_upload'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const disabled = (!value.trim() && files.length === 0) || isSubmitting;

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-4 bg-white dark:bg-background">
      <div className="flex items-start gap-3">
        {/* 내 아바타 */}
        <Avatar>
          <AvatarImage src={profileAvatar || '/default-avatar.svg'} alt="me" />
          <AvatarFallback>ME</AvatarFallback>
        </Avatar>

        {/* 입력 영역 */}
        <div className="flex-1">
          <textarea
            value={value}
            onChange={e => setValue(e.target.value)}
            rows={3}
            placeholder="댓글을 입력하세요..."
            className="
              w-full resize-none rounded-2xl border border-gray-300 dark:border-gray-700 
              bg-gray-50 dark:bg-background px-3 py-2 text-sm 
              text-gray-900 dark:text-gray-100 
              focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-transparent
            "
          />

          {/* 파일 선택 + 선택한 이미지 표시 */}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 hover:underline"
              >
                <i className="ri-image-add-line" />
                <span>사진 추가</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              {files.length > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  이미지 {files.length}개 선택됨
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={disabled}
              className={`
                px-4 py-1.5 rounded-full text-sm font-semibold
                ${
                  disabled
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-primary/80'
                }
              `}
            >
              {isSubmitting ? '등록 중...' : '댓글 달기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
