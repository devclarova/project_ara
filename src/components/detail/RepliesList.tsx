// src/components/detail/RepliesList.tsx
import ReplyCard from './ReplyCard'

interface Reply {
  id: string
  author: string
  avatar: string
  time: string
  text: string
  likes: number
  replies: number
  retweets: number
}

interface RepliesListProps {
  replies: Reply[]
}

export default function RepliesList({ replies }: RepliesListProps) {
  if (!replies || replies.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 bg-white border-t border-gray-100">
        <p className="text-sm">아직 댓글이 없습니다 😌 첫 댓글을 남겨보세요!</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-200 bg-white">
      {replies.map(reply => (
        <ReplyCard key={reply.id} {...reply} />
      ))}
    </div>
  )
}
