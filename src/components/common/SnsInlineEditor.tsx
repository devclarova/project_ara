/**
 * 실시간 SNS 콘텐츠 저작 엔진(Real-time SNS Content Authoring Engine):
 * - 목적(Why): 트윗 및 댓글 작성 시 리치 텍스트와 미디어 자산의 통합 업로드 파이프라인을 제공함
 * - 방법(How): 클라이언트 사이드 이미지 압축(browser-image-compression) 및 비동기 스토리지 트랜잭션을 통해 성능을 최적화함
 */
import { forwardRef, useImperativeHandle, useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import imageCompression from 'browser-image-compression';
import type { UIReply } from '@/types/sns';
import { getBanMessage } from '@/utils/banUtils';
import SeagullIcon from '@/components/common/SeagullIcon';

type EditorMode = 'tweet' | 'reply';

// 홈 피드에서 사용하는 콜백에 넘겨줄 트윗 형태 (Home의 UITweet과 구조만 맞추면 됨)
export type EditorCreatedTweet = {
  id: string;
  user: {
    id: string; // profiles.id
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
  parentReplyId?: string | null;
  onReplyCreated?: (reply: UIReply) => void;
  onFocus?: () => void;
  onInput?: () => void;
  onChange?: () => void;
  onCompositionEnd?: () => void;
};

type SnsInlineEditorProps = (TweetModeProps | ReplyModeProps) & {
  className?: string;
  onCancel?: () => void;
};

export interface SnsInlineEditorHandle {
  focus: () => void;
}

const SnsInlineEditor = forwardRef<SnsInlineEditorHandle, SnsInlineEditorProps>((props, ref) => {
  const { t } = useTranslation();
  const { mode, onCancel } = props;
  const { user, userPlan, isBanned, bannedUntil } = useAuth();
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

  // Virtual Resource Management: Oversees local Object URL lifecycle for pre-upload previews, ensuring memory release.
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  // Input Synchronization: Tracks IME composition states to prevent duplicate submission triggers during multi-byte character entry.
  const [isComposing, setIsComposing] = useState(false);

  // Contextual Metadata Sync: Asynchronously fetches active user profile attributes for consistent content attribution.
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      const { data, error } = await (supabase.from('profiles') as any)
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
    
    // 이미지 파일만 필터링
    const imageFiles = selected.filter(file => file.type.startsWith('image/'));
    
    // 이미지가 아닌 파일이 포함된 경우 토스트 알림
    if (imageFiles.length !== selected.length) {
      toast.error(t('tweets.error_only_images', '이미지 파일만 업로드할 수 있습니다.'));
    }

    if (imageFiles.length === 0) {
      if (e.target) e.target.value = '';
      return;
    }
    
    setFiles(imageFiles);
  };

  // Media Orchestration: Implements a multi-stage pipeline encompassing client-side compression and storage ingestion.
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
        `<img src="${publicUrl}" alt="${t(mode === 'reply' ? 'common.image_reply' : 'common.image_tweet', mode === 'reply' ? 'reply image' : 'tweet image')}" />`,
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

    // 제재 중인 사용자는 작성 불가
    if (isBanned && bannedUntil) {
      toast.error(getBanMessage(bannedUntil));
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
        const { tweetId, onReplyCreated, parentReplyId } = props as ReplyModeProps;
        const { data: inserted, error: insertError } = await (supabase.from('tweet_replies') as any)
          .insert({
            tweet_id: tweetId,
            author_id: profileId,
            content: finalContent,
            parent_reply_id: parentReplyId || null,
          })
          .select('id, created_at')
          .single();

        if (insertError || !inserted) {
          console.error('❌ 댓글 저장 실패:', insertError?.message);
          toast.error(t('tweets.error_reply_save'));
          setIsSubmitting(false);
          return;
        }

        // 대댓글 알림 생성 (부모 댓글 작성자에게)
        if (parentReplyId) {
          try {
            // 1. 부모 댓글 작성자 ID 조회
            const { data: parentData } = await (supabase.from('tweet_replies') as any)
              .select('author_id')
              .eq('id', parentReplyId)
              .maybeSingle();

            const parentAuthorId = parentData?.author_id;

            // 가드 로직
            if (parentAuthorId && parentAuthorId !== profileId) {
              // 2. 트윗 작성자 ID 조회
              const { data: tweetData } = await (supabase.from('tweets') as any)
                .select('author_id')
                .eq('id', tweetId)
                .maybeSingle();

              const tweetAuthorId = tweetData?.author_id;

              // 부모 댓글 작성자가 트윗 작성자와 다를 때만 reply 알림 발송 (중복 방지)
              if (parentAuthorId !== tweetAuthorId) {
                const { error: notifError } = await (supabase.from('notifications') as any).insert({
                  receiver_id: parentAuthorId,
                  sender_id: profileId,
                  type: 'reply',
                  content: finalContent.trim(),
                  tweet_id: tweetId,
                  comment_id: inserted.id,
                  is_read: false,
                });
              }
            }
          } catch (e) {
            console.error('Notification creation failed:', e);
          }
        }
        
        const uiReply: UIReply = {
           type: 'reply',
           id: inserted.id,
           tweetId: tweetId,
           parent_reply_id: parentReplyId || null,
           root_reply_id: null,
           user: {
               id: profileId,
               name: profileNickname || t('common.unknown', 'Unknown'),
               username: profileUserId || user.id,
               avatar: profileAvatar ?? '/default-avatar.svg'
           },
           content: finalContent,
           timestamp: new Date().toLocaleString('ko-KR', {
               hour: '2-digit',
               minute: '2-digit',
               month: 'short',
               day: 'numeric',
           }),
           createdAt: inserted.created_at || new Date().toISOString(),
           stats: {
               replies: 0,
               retweets: 0,
               likes: 0,
               views: 0
           },
           liked: false
        };

        if (onReplyCreated) {
          onReplyCreated(uiReply);
        }
        toast.success(t('tweets.success_reply'));
      }

      // ================= 트윗 모드 =================
      if (mode === 'tweet') {
        const { onTweetCreated } = props as TweetModeProps;
        const { data: inserted, error: insertError } = await (supabase.from('tweets') as any)
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
            id: profileId,
            name: profileNickname || t('common.unknown', 'Unknown'),
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
      // If we provided onReplyCreated or it was a temporary editor (like in ReplyList), we might want to close it? 
      // But usually SnsInlineEditor stays open. The parent handles closing if needed via onReplyCreated wrapper.
      if (onCancel && mode === 'reply') {
          // If it's a transient reply box, maybe we want to call onCancel (close) after success?
          // Let's leave that to the parent to decide.
      }

    } catch (err) {
      console.error('❌ 에디터 처리 오류:', err);
      toast.error(t('tweets.error_general'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const disabled = (!value.trim() && files.length === 0) || isSubmitting;

  // Keyboard Interaction Schema: Handles conditional dispatching for the 'Enter' key while preserving default IME behaviors.
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
        <div className={`relative flex-shrink-0 ${userPlan === 'premium' ? 'rounded-full p-[2px] bg-gradient-to-br from-[#00E5FF] via-[#00BFA5] to-[#00796B] shadow-[0_2px_10px_rgba(0,191,165,0.4)]' : ''}`}>
          <Avatar className="border-2 border-white dark:border-background">
            <AvatarImage src={profileAvatar || '/default-avatar.svg'} alt="me" />
            <AvatarFallback>{t('common.me', 'ME')}</AvatarFallback>
          </Avatar>
          {userPlan === 'premium' && (
            <div className="absolute -top-1.5 -left-1.5 z-10 p-[2px] bg-white dark:bg-background rounded-full shadow-[0_2px_5px_rgba(0,0,0,0.1)] transition-transform hover:scale-110 -rotate-12">
              <div className="bg-gradient-to-br from-[#00E5FF] via-[#00BFA5] to-[#00796B] w-[15px] h-[15px] rounded-full flex items-center justify-center shadow-[inset_0_1px_3px_rgba(255,255,255,0.5)]">
                <SeagullIcon size={12} className="text-white drop-shadow-sm" />
              </div>
            </div>
          )}
        </div>
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
            
            <div className="flex items-center gap-2">
                 {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-3 py-1.5 rounded-full text-sm font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                    >
                        {t('common.cancel', '취소')}
                    </button>
                 )}
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