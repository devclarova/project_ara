// src/components/TweetList.tsx
import TweetCard from './TweetCard'

interface Tweet {
  id: string
  content: string
  image_url: string | null
  created_at: string
  like_count: number
  repost_count: number
  bookmark_count: number
  profiles: { nickname: string; avatar_url: string } | null
}

interface TweetListProps {
  tweets: Tweet[]
}

export default function TweetList({ tweets }: TweetListProps) {
  if (!tweets || tweets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <p className="text-lg font-medium">아직 트윗이 없습니다</p>
        <p className="text-sm text-gray-400 mt-1">첫 트윗을 작성해보세요 🐦</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-200">
      {tweets.map(tweet => (
        <TweetCard key={tweet.id} {...tweet} />
      ))}
    </div>
  )
}
