// src/components/TweetCard.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle, Repeat2, Heart, Bookmark, BarChart3 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { Tweet } from '../../data/mockTweet'

export default function TweetCard({
  id,
  author,
  handle,
  avatar,
  content,
  image,
  stats,
  created_at,
}: Tweet) {
  const navigate = useNavigate()

  // 개별 트윗 내 상태 관리
  const [liked, setLiked] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [reposted, setReposted] = useState(false)

  const [likeCount, setLikeCount] = useState(stats.likes)
  const [repostCount, setRepostCount] = useState(stats.reposts)
  const [bookmarkCount, setBookmarkCount] = useState(stats.bookmarks)

  // 시간 포맷
  const timeAgo = formatDistanceToNow(new Date(created_at), {
    addSuffix: true,
    locale: ko,
  })

  // 토글 핸들러들
  const toggleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    setLiked(prev => !prev)
    setLikeCount(prev => (liked ? prev - 1 : prev + 1))
  }

  const toggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation()
    setBookmarked(prev => !prev)
    setBookmarkCount(prev => (bookmarked ? prev - 1 : prev + 1))
  }

  const toggleRepost = (e: React.MouseEvent) => {
    e.stopPropagation()
    setReposted(prev => !prev)
    setRepostCount(prev => (reposted ? prev - 1 : prev + 1))
  }

  // 카드 클릭 시 상세 페이지로 이동
  const handleNavigate = () => {
    navigate(`/social/${id}`)
  }

  return (
    <article
      onClick={handleNavigate}
      className="flex space-x-3 p-4 hover:bg-gray-50 transition cursor-pointer"
    >
      {/* 프로필 이미지 */}
      <img
        src={avatar}
        alt={author}
        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
      />

      {/* 본문 */}
      <div className="flex-1">
        {/* 헤더 */}
        <header className="flex items-center space-x-2 text-sm text-gray-600">
          <span className="font-semibold text-black">{author}</span>
          <span className="text-gray-500">@{handle}</span>
          <span className="text-gray-400">· {timeAgo}</span>
        </header>

        {/* 내용 */}
        <p className="mt-1 text-gray-800 text-[15px] leading-snug whitespace-pre-line">
          {content}
        </p>

        {/* 이미지 */}
        {image && (
          <div className="mt-2 rounded-xl overflow-hidden border border-gray-200">
            <img src={image} alt="tweet media" className="w-full object-cover" />
          </div>
        )}

        {/* 액션 버튼 */}
        <footer className="flex justify-between mt-3 text-gray-500 text-sm">
          <button
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 hover:text-blue-500"
          >
            <MessageCircle size={18} />
            <span>{stats.quotes}</span>
          </button>

          <button
            onClick={toggleRepost}
            className={`flex items-center gap-1 transition-colors ${
              reposted ? 'text-green-600' : 'hover:text-green-500'
            }`}
          >
            <Repeat2
              size={18}
              className={`${reposted ? 'rotate-180' : ''} transition-transform`}
            />
            <span>{repostCount}</span>
          </button>

          <button
            onClick={toggleLike}
            className={`flex items-center gap-1 transition-colors ${
              liked ? 'text-pink-500' : 'hover:text-pink-500'
            }`}
          >
            <Heart
              size={18}
              fill={liked ? '#ec4899' : 'none'}
              strokeWidth={liked ? 0 : 2}
            />
            <span>{likeCount}</span>
          </button>

          <button
            onClick={toggleBookmark}
            className={`flex items-center gap-1 transition-colors ${
              bookmarked ? 'text-blue-600' : 'hover:text-blue-600'
            }`}
          >
            <Bookmark
              size={18}
              fill={bookmarked ? '#1D9BF0' : 'none'}
              strokeWidth={bookmarked ? 0 : 2}
            />
            <span>{bookmarkCount}</span>
          </button>

          <button
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 hover:text-gray-400"
          >
            <BarChart3 size={18} />
          </button>
        </footer>
      </div>
    </article>
  )
}
