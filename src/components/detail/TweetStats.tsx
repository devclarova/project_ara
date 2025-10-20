// src/components/detail/TweetStats.tsx
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface TweetStatsProps {
  stats: {
    reposts: number
    quotes?: number
    likes: number
    bookmarks: number
  }
  createdAt?: string
}

const TweetStats = ({ stats, createdAt }: TweetStatsProps) => {
  const { reposts, quotes, likes, bookmarks } = stats

  const relativeTime =
    createdAt &&
    formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: ko })

  return (
    <section className="px-6 py-4 border-b border-gray-200 text-sm">
      {createdAt && (
        <p className="text-gray-500 mb-2">
          게시 {relativeTime} ({new Date(createdAt).toLocaleString('ko-KR')})
        </p>
      )}
      <div className="flex items-center space-x-8">
        <div className="flex items-center space-x-1">
          <span className="font-bold text-black">{reposts}</span>
          <span className="text-secondary">Reposts</span>
        </div>

        <div className="flex items-center space-x-1">
          <span className="font-bold text-black">{quotes}</span>
          <span className="text-secondary">Quote posts</span>
        </div>

        <div className="flex items-center space-x-1">
          <span className="font-bold text-black">{likes}</span>
          <span className="text-secondary">Likes</span>
        </div>

        <div className="flex items-center space-x-1">
          <span className="font-bold text-black">{bookmarks}</span>
          <span className="text-secondary">Bookmarks</span>
        </div>
      </div>
    </section>
  )
}

export default TweetStats
