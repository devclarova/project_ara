import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import SeagullIcon from '@/components/common/SeagullIcon';
import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { getBanMessage } from '@/utils/banUtils';
import { getErrorMessage } from '@/utils/errorMessage';
import { useTranslation } from 'react-i18next';
import imageCompression from 'browser-image-compression';


interface ComposeBoxProps {
// ... existing interface ...
  onTweetPost?: (tweet: {
    id: string;
    user: {
      name: string;
      username: string;
      avatar: string;
    };
    content: string;
    image?: string;
    timestamp: string;
    stats: {
      replies: number;
      retweets: number;
      likes: number;
      views: number;
    };
  }) => void;
}

export default function ComposeBox({ onTweetPost }: ComposeBoxProps) {
  const { t } = useTranslation();
  const [tweetText, setTweetText] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, userPlan, profileId, isBanned, bannedUntil } = useAuth();
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [profileNickname, setProfileNickname] = useState<string | null>(null);
  const maxLength = 280;

  // 사용자 프로필 이미지 로드
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      const { data } = await (supabase.from('profiles') as any)
        .select('avatar_url, nickname')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setProfileAvatar(data.avatar_url);
        setProfileNickname(data.nickname);
      }
    };
    loadProfile();
  }, [user]);

  const emojis = ['😀', '😂', '🥰', '😍', '🤔', '👍', '❤️', '🔥', '💯', '🎉', '🚀', '✨'];

  // ✅ 이미지 업로드 핸들러
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 이미지 파일 여부 확인
      if (!file.type.startsWith('image/')) {
        toast.error(t('tweets.error_only_images', '이미지 파일만 업로드할 수 있습니다.'));
        if (event.target) event.target.value = '';
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = e => setPreviewImage(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  // ✅ Supabase에 트윗 업로드
  const handleTweet = async () => {
    if (!tweetText.trim() || !user) return;

    // 제재 중인 사용자는 게시글 작성 불가
    if (isBanned && bannedUntil) {
      toast.error(getBanMessage(bannedUntil, '게시글을 작성'));
      return;
    }

    try {
      setUploading(true);
      
      let uploadedImageUrl: string | null = null;
      let fileToUpload = selectedImage;

      // ✅ 파일 선택 시 용량 제한 및 이미지 압축 로직
      if (selectedImage) {
        if (selectedImage.type.startsWith('image/')) {
          try {
            // 이미지 압축 (1MB 제한)
            const options = {
              maxSizeMB: 1,
              maxWidthOrHeight: 1920,
              useWebWorker: true,
            };
            fileToUpload = await imageCompression(selectedImage, options);
          } catch (err) {
            console.error('이미지 압축 실패:', err);
            // 압축 실패 시 1MB 초과 여부 확인 (차단)
            if (selectedImage.size > 1 * 1024 * 1024) {
              toast.error(t('tweets.error_file_size', '이미지 용량은 1MB를 초과할 수 없습니다.'));
              setUploading(false);
              return;
            }
          }
        } else if (selectedImage.type.startsWith('video/')) {
          // 동영상: 최대 10MB (차단)
          if (selectedImage.size > 10 * 1024 * 1024) {
            toast.error(t('tweets.error_video_size', '동영상 용량은 10MB를 초과할 수 없습니다.'));
            setUploading(false);
            return;
          }
        } else {
          // 기타 파일: 최대 5MB (차단)
          if (selectedImage.size > 5 * 1024 * 1024) {
            toast.error(t('tweets.error_file_size_generic', '파일 용량은 5MB를 초과할 수 없습니다.'));
            setUploading(false);
            return;
          }
        }
      }

      // ✅ 파일 업로드 실행
      if (fileToUpload) {
        const fileExt = fileToUpload.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `tweet_images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('tweet_media')
          .upload(filePath, fileToUpload);

        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage.from('tweet_media').getPublicUrl(filePath);
        uploadedImageUrl = publicUrl.publicUrl;
      }

      // ✅ DB에 트윗 추가
      const { data, error } = await (supabase.from('tweets') as any)
        .insert([
          {
            author_id: user.id, // RLS 정책에 따라 auth.uid()와 매칭
            content: tweetText,
            image_url: uploadedImageUrl,
          },
        ])
        .select(
          `
          id,
          content,
          image_url,
          created_at,
          profiles:author_id (
            nickname,
            username,
            avatar_url
          )
        `,
        )
        .single();

      if (error) throw error;

      const newTweet = {
        id: data.id,
        user: {
          name: data.profiles?.nickname ?? t('common.unknown', 'Unknown'),
          username: data.profiles?.username ?? data.profiles?.nickname ?? t('common.anonymous', 'user'),
          avatar: data.profiles?.avatar_url ?? '/default-avatar.svg',
        },
        content: data.content,
        image: data.image_url ?? undefined, // ✅ image_url → image
        timestamp: new Date(data.created_at).toLocaleString('ko-KR', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }), // ✅ created_at 대신 timestamp 사용
        stats: {
          replies: 0,
          retweets: 0,
          likes: 0,
          bookmarks: 0,
          views: Math.floor(Math.random() * 100) + 1,
        },
      };

      onTweetPost?.(newTweet);

      // ✅ 초기화
      setTweetText('');
      setSelectedImage(null);
      setPreviewImage(null);
      setShowOptions(false);
    } catch (err: unknown) {
      console.error('❌ 트윗 업로드 실패:', getErrorMessage(err));
      toast.error(t('tweets.error_general', '트윗을 업로드하는 중 오류가 발생했습니다.'));
    } finally {
      setUploading(false);
    }
  };

  const addEmoji = (emoji: string) => {
    setTweetText(prev => prev + emoji);
  };

  return (
    <div className="border-b border-gray-200 p-4 min-w-[320px]">
      <div className="flex space-x-3 w-full">
        {/* ✅ 프로필 아바타 */}
        <div className="flex-shrink-0">
          <div className={`relative w-10 h-10 ${userPlan === 'premium' ? 'rounded-full p-[2px] bg-gradient-to-br from-[#00E5FF] via-[#00BFA5] to-[#00796B] shadow-[0_2px_10px_rgba(0,191,165,0.4)]' : ''}`}>
            <Avatar className="w-full h-full border-2 border-white dark:border-background">
              <AvatarImage src={profileAvatar || '/default-avatar.svg'} alt={profileNickname || t('common.avatar', 'User avatar')} />
              <AvatarFallback>{(profileNickname || 'U').charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            {userPlan === 'premium' && (
              <div className="absolute -top-1.5 -left-1.5 z-10 p-[2px] bg-white dark:bg-background rounded-full shadow-[0_2px_5px_rgba(0,0,0,0.1)] transition-transform hover:scale-110 -rotate-12">
                <div className="bg-gradient-to-br from-[#00E5FF] via-[#00BFA5] to-[#00796B] w-[15px] h-[15px] rounded-full flex items-center justify-center shadow-[inset_0_1px_3px_rgba(255,255,255,0.5)]">
                  <SeagullIcon size={12} className="text-white drop-shadow-sm" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ✅ 입력 필드 */}
        <div className="flex-1 min-w-0">
          <textarea
            value={tweetText}
            onChange={e => setTweetText(e.target.value)}
            placeholder={t('tweets.placeholder_tweet', "What's happening?")}
            className="w-full text-xl placeholder-gray-500 border-none resize-none focus:outline-none bg-transparent"
            rows={3}
            maxLength={maxLength}
            onFocus={() => setShowOptions(true)}
          />

          {/* ✅ 이미지 미리보기 */}
          {previewImage && (
            <div className="mt-3 relative rounded-xl overflow-hidden border border-gray-200">
              <img src={previewImage} alt={t('common.preview', 'Preview')} className="w-full h-48 object-cover" />
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setPreviewImage(null);
                }}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-sm"></i>
              </button>
            </div>
          )}

          {/* ✅ 옵션들 */}
          {showOptions && (
            <div className="mt-4 w-full">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-2 sm:space-x-4 flex-wrap">
                  {/* 이미지 업로드 */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-500 hover:bg-blue-50 p-2 rounded-full transition-colors cursor-pointer"
                  >
                    <i className="ri-image-line text-lg"></i>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  {/* 이모지 */}
                  <div className="relative">
                    <button
                      onClick={() => addEmoji('🔥')}
                      className="text-blue-500 hover:bg-blue-50 p-2 rounded-full transition-colors cursor-pointer"
                    >
                      <i className="ri-emotion-line text-lg"></i>
                    </button>
                  </div>
                </div>

                {/* ✅ 게시 버튼 */}
                <div className="flex items-center space-x-3 flex-shrink-0">
                  <div className="text-sm text-gray-500">{maxLength - tweetText.length}</div>
                  <Button
                    onClick={handleTweet}
                    disabled={!tweetText.trim() || uploading}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-1.5 rounded-full font-bold text-sm transition-colors"
                  >
                    {uploading ? t('tweets.btn_posting', 'Posting...') : t('tweets.btn_post', 'Tweet')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
