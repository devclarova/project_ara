import { useParams } from 'react-router-dom'
import { useState } from 'react'
import SidebarLeft from '../../components/layout/SidebarLeft'
import SidebarRight from '../../components/layout/SidebarRight'
import TweetHeader from '../../components/detail/TweetHeader'
import TweetMain from '../../components/detail/TweetMain'
import TweetStats from '../../components/detail/TweetStats'
import TweetActions from '../../components/detail/TweetActions'
import ReplyComposer from '../../components/detail/ReplyComposer'
import RepliesList from '../../components/detail/RepliesList'
import { mockTweets, type Tweet } from '../../data/mockTweet'

interface UiReply {
  id: string
  author: string
  handle: string
  avatar: string
  time: string
  text: string
  likes: number
  replies: number
  retweets: number
}

const TweetDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const [tweets, setTweets] = useState<Tweet[]>(mockTweets)
  const tweet = tweets.find(t => t.id === id) || tweets[0]

  const initialReplies: UiReply[] = tweet.replies.map(r => ({
    id: r.id,
    author: r.author,
    handle: r.handle,
    avatar: r.avatar,
    time: r.time,
    text: r.content,
    likes: r.likes,
    replies: r.comments,
    retweets: r.retweets,
  }))

  const [replies, setReplies] = useState<UiReply[]>(initialReplies)

  const handleAddReply = (parentId: string, content: string) => {
    const newReply: UiReply = {
      id: `reply-${Date.now()}`,
      author: 'You',
      handle: 'you_dev',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=You',
      time: 'just now',
      text: content,
      likes: 0,
      replies: 0,
      retweets: 0,
    }
    setReplies(prev => [newReply, ...prev])
  }

  return (
    <div className="flex max-w-7xl mx-auto bg-white">
      {/* Reply 모드로 SidebarLeft 연결 */}
      <SidebarLeft
        isReplyMode
        parentId={tweet.id}
        onReply={handleAddReply}
      />

      <main className="flex-1 min-h-screen border-r border-gray-200">
        <TweetHeader />
        <TweetMain tweet={tweet} />
        <TweetStats stats={tweet.stats} createdAt={tweet.created_at} />
        <TweetActions
          tweet={{
            id: tweet.id,
            likes: tweet.stats.likes,
            retweets: tweet.stats.reposts,
          }}
        />

        {/* 원래 ReplyComposer (기존 입력창) */}
        <ReplyComposer parentId={tweet.id} onReply={handleAddReply} />

        <RepliesList replies={replies} />
      </main>

      <SidebarRight />
    </div>
  )
}

export default TweetDetailPage
