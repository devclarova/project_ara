// src/components/detail/ReplyCard.tsx
import { useState } from 'react'
import { Heart, MessageCircle, Repeat2, Share2 } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

interface ReplyCardProps {
  id: string
  author: string
  avatar: string
  time: string
  text: string // Quill HTML 포함
  likes: number
  replies: number
  retweets: number
}

export default function ReplyCard({
  id,
  author,
  avatar,
  time,
  text,
  likes,
  replies,
  retweets,
}: ReplyCardProps) {
  const [liked, setLiked] = useState(false)
  const [retweeted, setRetweeted] = useState(false)
  const [likeCount, setLikeCount] = useState(likes)
  const [retweetCount, setRetweetCount] = useState(retweets)

  const toggleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    setLiked(prev => !prev)
    setLikeCount(prev => (liked ? prev - 1 : prev + 1))
  }

  const toggleRetweet = (e: React.MouseEvent) => {
    e.stopPropagation()
    setRetweeted(prev => !prev)
    setRetweetCount(prev => (retweeted ? prev - 1 : prev + 1))
  }

  return (
    <div className="flex space-x-3 p-5 hover:bg-gray-50 transition-colors border-b border-gray-100">
      {/* ✅ 아바타 */}
      <Avatar className="w-10 h-10">
        <AvatarImage src={avatar} alt={author} />
        <AvatarFallback>{author?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        {/* 작성자 */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{author}</span>
          <span className="text-gray-400">· {time}</span>
        </div>

        {/* ✅ 본문 (이미지 포함) */}
        <div
          className="mt-2 text-gray-900 text-[15px] leading-relaxed whitespace-pre-wrap break-words"
          dangerouslySetInnerHTML={{ __html: text }}
        />

        {/* 액션 버튼 */}
        <div className="flex items-center justify-between mt-3 text-gray-500 text-sm max-w-md">
          {/* 댓글 수 */}
          <button
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 hover:text-blue-500"
          >
            <MessageCircle size={16} />
            <span>{replies}</span>
          </button>

          {/* 리트윗 */}
          <button
            onClick={toggleRetweet}
            className={`flex items-center gap-1 transition-colors ${
              retweeted ? 'text-green-600' : 'hover:text-green-600'
            }`}
          >
            <Repeat2
              size={16}
              className={`${retweeted ? 'rotate-180' : ''} transition-transform`}
            />
            <span>{retweetCount}</span>
          </button>

          {/* 좋아요 */}
          <button
            onClick={toggleLike}
            className={`flex items-center gap-1 transition-colors ${
              liked ? 'text-pink-500' : 'hover:text-pink-500'
            }`}
          >
            <Heart
              size={16}
              fill={liked ? '#ec4899' : 'none'}
              strokeWidth={liked ? 0 : 2}
            />
            <span>{likeCount}</span>
          </button>

          {/* 공유 */}
          <button
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 hover:text-blue-500"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
