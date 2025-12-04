import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import DOMPurify from 'dompurify';
import ImageSlider from './ImageSlider';
import ModalImageSlider from './ModalImageSlider';

interface User {
  name: string;
  username: string;
  avatar: string;
}

interface Stats {
  replies?: number;
  retweets?: number;
  likes?: number;
  views?: number;
  comments?: number;
  bookmarks?: number;
}

interface Tweet {
  id: string;
  user: User;
  content: string;
  image?: string | string[];
  timestamp: string;
  stats: Stats;
}

interface TweetDetailCardProps {
  tweet: Tweet;
}

export default function TweetDetailCard({ tweet }: TweetDetailCardProps) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [retweeted, setRetweeted] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [contentImages, setContentImages] = useState<string[]>([]);
  const [direction, setDirection] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);

  // ✅ 여기서 user가 아니라 tweet.user 사용해야 함
  const handleAvatarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    navigate(`/profile/${encodeURIComponent(tweet.user.name)}`);
  };

  const normalizedStats = {
    replies: tweet.stats.replies || tweet.stats.comments || 0,
    retweets: tweet.stats.retweets || 0,
    likes: tweet.stats.likes || 0,
    views: tweet.stats.views || 0,
  };

  // 🔥 content에서 <img> 태그 src 추출
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(tweet.content, 'text/html');

    const imgs = Array.from(doc.querySelectorAll('img'))
      .map(img => img.src)
      .filter(Boolean);

    setContentImages(imgs);
  }, [tweet.content]);

  // 🔥 prop 으로 온 image(string | string[]) → 배열로 정규화
  const propImages = Array.isArray(tweet.image) ? tweet.image : tweet.image ? [tweet.image] : [];

  // 🔥 최종적으로 사용할 이미지 목록 (prop 우선, 없으면 contentImages)
  const allImages = propImages.length > 0 ? propImages : contentImages;

  // 🔥 본문에서는 img 태그 제거 (이미지는 아래 그리드에서만 보여줄 것)
  const safeContent = DOMPurify.sanitize(tweet.content, {
    ADD_TAGS: ['iframe', 'video', 'source'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'src', 'controls'],
    FORBID_TAGS: ['img'],
  });

  // 🔥 디테일 그리드: 최대 6장 보여주고, 나머지는 +N
  const MAX_GRID = 6;
  const hasMoreImages = allImages.length > MAX_GRID;
  const visibleImages = hasMoreImages ? allImages.slice(0, MAX_GRID) : allImages;

  // 🔥 텍스트가 실제로 있는지 확인 (태그/공백 제거 후)
  const hasText = !!safeContent
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-6 bg-white dark:bg-background">
      <div className="flex space-x-3">
        <div onClick={handleAvatarClick} className="cursor-pointer">
          <Avatar>
            <AvatarImage src={tweet.user.avatar || '/default-avatar.svg'} alt={tweet.user.name} />
            <AvatarFallback>{tweet.user.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1 min-w-0">
          {/* User Info */}
          <div className="flex items-center space-x-1 flex-wrap">
            <span
              className="font-bold text-gray-900 dark:text-gray-100 hover:underline cursor-pointer truncate"
              onClick={handleAvatarClick}
            >
              {tweet.user.name}
            </span>
            {/* 필요하면 핸들(@username)도 표시 가능 */}
            {/* <span className="text-gray-500 dark:text-gray-400 truncate">
              @{tweet.user.username}
            </span> */}
          </div>
        </div>
      </div>

      {/* Tweet Content */}
      <div className="mt-4">
        {hasText && (
          <div
            className="text-gray-900 dark:text-gray-100 text-xl leading-relaxed break-words"
            dangerouslySetInnerHTML={{ __html: safeContent }}
          />
        )}

        {/* 이미지 슬라이드 */}
        {allImages.length > 0 && (
          <ImageSlider
            allImages={allImages}
            currentImage={currentImage}
            setCurrentImage={setCurrentImage}
            setDirection={setDirection}
            direction={direction}
            onOpen={index => {
              setModalIndex(index);
              setShowImageModal(true);
            }}
          />
        )}

        {/* 이미지 모달 */}
        {showImageModal && (
          <div
            className="fixed inset-0 bg-black/80 z-[2000] flex items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            <ModalImageSlider
              allImages={allImages}
              modalIndex={modalIndex}
              setModalIndex={setModalIndex}
              onClose={() => setShowImageModal(false)}
            />
          </div>
        )}
      </div>

      {/* Timestamp */}
      <div className="mt-4 text-gray-500 dark:text-gray-400 text-sm">{tweet.timestamp}</div>

      {/* Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-6 text-sm">
          <span className="text-gray-900 dark:text-gray-100">
            <span className="font-bold">{normalizedStats.replies}</span>
            <span className="text-gray-500 dark:text-gray-400 ml-1">댓글</span>
          </span>
          <span className="text-gray-900 dark:text-gray-100">
            <span className="font-bold">{normalizedStats.likes}</span>
            <span className="text-gray-500 dark:text-gray-400 ml-1">좋아요</span>
          </span>
          <span className="text-gray-900 dark:text-gray-100">
            <span className="font-bold">{normalizedStats.views}</span>
            <span className="text-gray-500 dark:text-gray-400 ml-1">조회수</span>
          </span>
        </div>
      </div>
    </div>
  );
}
