import { forwardRef, useImperativeHandle, useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import imageCompression from 'browser-image-compression';
type EditorMode = 'tweet' | 'reply';
// 홈 피드에서 사용하는 콜백에 넘겨줄 트윗 형태 (Home의 UITweet과 구조만 맞추면 됨)
export type EditorCreatedTweet = {
  id: string;
  user: {
    name: string;
    username: string;
    avatar: string;
  };
  content: string;
  image?: string | string[];
  timestamp: string;
  stats: {
    replies: number;
    retweets: number;
    likes: number;
    bookmarks?: number;
    views: number;
  };
};
type TweetModeProps = {
  mode: 'tweet';
  onTweetCreated?: (tweet: EditorCreatedTweet) => void;
  onFocus?: () => void;
  onInput?: () => void;
  onChange?: () => void;
  onCompositionEnd?: () => void;
};
type ReplyModeProps = {
  mode: 'reply';
  tweetId: string;
  onReplyCreated?: (replyId: string) => void;
  onFocus?: () => void;
  onInput?: () => void;
  onChange?: () => void;
  onCompositionEnd?: () => void;
};
type SnsInlineEditorProps = (TweetModeProps | ReplyModeProps) & {
  className?: string;
};
export interface SnsInlineEditorHandle {
  focus: () => void;
}
const SnsInlineEditor = forwardRef<SnsInlineEditorHandle, SnsInlineEditorProps>((props, ref) => {
  const { t } = useTranslation();
  const { mode } = props;
  const { user } = useAuth();
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [profileNickname, setProfileNickname] = useState<string>('');
  const [profileUserId, setProfileUserId] = useState<string>('');
  const [value, setValue] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  useImperativeHandle(ref, () => ({
    focus: () => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },
  }));
  // 미리보기용 URL
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  // 한글 IME 조합 상태
  const [isComposing, setIsComposing] = useState(false);
  // 내 프로필 정보 불러오기
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, avatar_url, nickname, user_id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!error && data) {
        setProfileAvatar(data.avatar_url);
        setProfileId(data.id);
        setProfileNickname(data.nickname ?? '');
        setProfileUserId(data.user_id ?? '');
      }
    };
    loadProfile();
  }, [user]);
  // 파일이 바뀔 때마다 브라우저 Object URL 생성 / 정리
  useEffect(() => {
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [files]);
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
    setFiles(selected);
  };
  // 이미지 업로드 + <img> 태그 문자열 생성
  const uploadImagesAndBuildTags = async () => {
    if (!user || files.length === 0) return '';
    const imgTags: string[] = [];
    for (let i = 0; i < files.length; i++) {
      let file = files[i];
      
      // 🟢 클라이언트 압축 적용
      try {
        const options = {
          maxSizeMB: 1, // 최대 1MB
          maxWidthOrHeight: 1920, // 최대 해상도 FHD
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);
        // 압축 성공 시 교체 (실패하면 원본 사용)
        file = compressedFile;
      } catch (err) {
        console.error('이미지 압축 실패(원본 업로드 진행):', err);
      }
      const timestamp = Date.now() + i;
      const fileName = `${user.id}_${timestamp}_${safeFileName(file.name)}`;
      const folder = mode === 'reply' ? 'reply_images' : 'tweet_images';
      const filePath = `${folder}/${user.id}/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('tweet_media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });
      if (uploadError) {
        console.error('이미지 업로드 실패:', uploadError.message);
        continue;
      }
      const { data: urlData } = await supabase.storage.from('tweet_media').getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;
      imgTags.push(
        `<img src="${publicUrl}" alt="${mode === 'reply' ? 'reply' : 'tweet'} image" />`,
      );
    }
    if (imgTags.length === 0) return '';
    return imgTags.join('<br />');
  };
  const handleSubmit = async () => {
    if (!user) {
      toast.error(t('tweets.error_login'));
      return;
    }
    if (!value.trim() && files.length === 0) return;
    if (isSubmitting) return;
    if (!profileId) {
      // toast.error('프로필 정보를 불러오지 못했습니다.');
      toast.error(t('tweets.error_profile'));
      return;
    }
    setIsSubmitting(true);
    try {
      let finalContent = value.trim();
      const imgTags = await uploadImagesAndBuildTags();
      if (imgTags) {
        if (finalContent) {
          finalContent += '<br />' + imgTags;
        } else {
          finalContent = imgTags;
        }
      }
      if (!finalContent.trim()) {
        toast.error(t('tweets.error_empty'));
        setIsSubmitting(false);
        return;
      }
      // ================= 댓글 모드 =================
      if (mode === 'reply') {
        const { tweetId, onReplyCreated } = props as ReplyModeProps;
        const { data: inserted, error: insertError } = await supabase
          .from('tweet_replies')
          .insert({
            tweet_id: tweetId,
            author_id: profileId,
            content: finalContent,
          })
          .select('id')
          .single();
        if (insertError || !inserted) {
          console.error('❌ 댓글 저장 실패:', insertError?.message);
          toast.error(t('tweets.error_reply_save'));
          setIsSubmitting(false);
          return;
        }
        if (onReplyCreated && inserted.id) {
          onReplyCreated(inserted.id);
        }
        toast.success(t('tweets.success_reply'));
      }
      // ================= 트윗 모드 =================
      if (mode === 'tweet') {
        const { onTweetCreated } = props as TweetModeProps;
        const { data: inserted, error: insertError } = await supabase
          .from('tweets')
          .insert({
            author_id: profileId,
            content: finalContent,
            image_url: null,
          })
          .select(
            `
            id,
            created_at,
            reply_count,
            repost_count,
            like_count,
            bookmark_count,
            view_count
          `,
          )
          .single();
        if (insertError || !inserted) {
          console.error('❌ 트윗 저장 실패:', insertError?.message);
          toast.error(t('tweets.error_tweet_save'));
          setIsSubmitting(false);
          return;
        }
        const uiTweet: EditorCreatedTweet = {
          id: inserted.id,
          user: {
            name: profileNickname || 'Unknown',
            username: profileUserId || user.id,
            avatar: profileAvatar ?? '/default-avatar.svg',
          },
          content: finalContent,
          image: undefined,
          timestamp: inserted.created_at,
          stats: {
            replies: inserted.reply_count ?? 0,
            retweets: inserted.repost_count ?? 0,
            likes: inserted.like_count ?? 0,
            bookmarks: inserted.bookmark_count ?? 0,
            views: inserted.view_count ?? 0,
          },
        };
        if (onTweetCreated) {
          onTweetCreated(uiTweet);
        }
        toast.success(t('tweets.success_tweet'));
      }
      // 공통 초기화
      setValue('');
      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('❌ 에디터 처리 오류:', err);
      toast.error(t('tweets.error_general'));
    } finally {
      setIsSubmitting(false);
    }
  };
  const disabled = (!value.trim() && files.length === 0) || isSubmitting;
  // Enter / Shift+Enter 처리
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isComposing) return; // 한글 조합 중일 땐 무시
    if (e.key === 'Enter' && !e.shiftKey) {
      // Enter 단독 → 게시
      e.preventDefault();
      if (!disabled) {
        handleSubmit();
      }
    }
    // Shift+Enter는 기본 동작(줄바꿈) 그대로 두면 됨
  };
  // 비로그인일 때는 이 컴포넌트는 렌더 안 하게 (상위에서 CTA 따로 처리)
  if (!user) return null;
  const placeholder = mode === 'reply' ? t('tweets.placeholder_reply') : t('tweets.placeholder_tweet');
  const buttonLabel =
    mode === 'reply'
      ? isSubmitting
        ? t('tweets.btn_replying')
        : t('tweets.btn_reply')
      : isSubmitting
        ? t('tweets.btn_posting')
        : t('tweets.btn_post');
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
            ref={textareaRef}
            value={value}
            onChange={e => {
              setValue(e.target.value);
              props.onChange?.();
            }}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={(e) => {
              setIsComposing(false);
              props.onCompositionEnd?.();
            }}
            onFocus={props.onFocus}
            onInput={props.onInput}
            rows={3}
            placeholder={placeholder}
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
                <span>{t('tweets.add_photo')}</span>
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
                  {t('tweets.images_selected', { count: files.length })}
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
              {buttonLabel}
            </button>
          </div>
          {/* 이미지 미리보기 영역 */}
          {previewUrls.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {previewUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-black/5"
                >
                  <img
                    src={url}
                    alt={t('tweets.preview_alt', { index: idx + 1 })}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
export default SnsInlineEditor;